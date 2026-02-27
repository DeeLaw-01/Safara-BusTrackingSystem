import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMap,
  Popup
} from 'react-leaflet'
import L from 'leaflet'
import {
  Navigation,
  Square,
  MapPin,
  Loader2,
  AlertCircle,
  Gauge,
  Locate,
  ChevronRight
} from 'lucide-react'
import { tripsApi, routesApi } from '@/services/api'
import { socketService } from '@/services/socket'
import type { Bus, Route, Stop } from '@/types'


// ─── Custom Icons ────────────────────────────────────────────────────────────

function createDriverIcon(heading: number) {
  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:48px;height:48px;">
        <!-- Heading cone -->
        <div style="
          position:absolute;top:-12px;left:50%;transform:translateX(-50%) rotate(${heading}deg);
          width:0;height:0;
          border-left:16px solid transparent;
          border-right:16px solid transparent;
          border-bottom:24px solid rgba(59,130,246,0.25);
          transform-origin:bottom center;
        "></div>
        <!-- GPS dot -->
        <div style="
          position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
          width:24px;height:24px;
          background:#3b82f6;
          border-radius:50%;
          border:4px solid white;
          box-shadow:0 2px 12px rgba(59,130,246,0.5);
        "></div>
        <!-- Pulse ring -->
        <div style="
          position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
          width:40px;height:40px;
          border-radius:50%;
          border:2px solid rgba(59,130,246,0.3);
          animation:pulse 2s ease-out infinite;
        "></div>
      </div>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 24]
  })
}

const stopIcon = L.divIcon({
  className: '',
  html: `
    <div style="
      width:16px;height:16px;
      background:white;
      border-radius:50%;
      border:4px solid #0ea5e9;
      box-shadow:0 2px 6px rgba(0,0,0,0.3);
    "></div>
  `,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
})

const nextStopIcon = L.divIcon({
  className: '',
  html: `
    <div style="
      width:24px;height:24px;
      background:#f95f5f;
      border-radius:50%;
      border:4px solid white;
      box-shadow:0 2px 8px rgba(249,95,95,0.5);
    "></div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
})

// ─── Auto-follow map component ──────────────────────────────────────────────

function AutoFollowMap({
  position,
  heading,
  followMode
}: {
  position: [number, number]
  heading: number
  followMode: boolean
}) {
  const map = useMap()

  useEffect(() => {
    if (followMode && position) {
      map.setView(position, Math.max(map.getZoom(), 16), { animate: true })
    }
  }, [map, position, followMode, heading])

  return null
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function findClosestPointOnPath(
  path: [number, number][],
  pos: [number, number]
): number {
  let minDist = Infinity
  let closestIdx = 0
  for (let i = 0; i < path.length; i++) {
    const dist = haversineDistance(pos[0], pos[1], path[i][0], path[i][1])
    if (dist < minDist) {
      minDist = dist
      closestIdx = i
    }
  }
  return closestIdx
}

function getNextStopIndex(
  stops: Stop[],
  position: [number, number],
  routePath?: [number, number][]
): number {
  if (!position || stops.length === 0) return 0

  // ── Path-based progress (accurate, directional) ──────────────────
  if (routePath && routePath.length > 1) {
    const busPathIdx = findClosestPointOnPath(routePath, position)
    let nextIdx = 0
    for (let i = 0; i < stops.length; i++) {
      const stopPathIdx = findClosestPointOnPath(routePath, [
        stops[i].latitude,
        stops[i].longitude
      ])
      const distToStop = haversineDistance(
        position[0],
        position[1],
        stops[i].latitude,
        stops[i].longitude
      )
      if (busPathIdx > stopPathIdx && distToStop > 150) {
        // We've passed this stop on the route
        nextIdx = Math.min(i + 1, stops.length - 1)
      } else {
        break
      }
    }
    return nextIdx
  }

  // ── Fallback: proximity-based ────────────────────────────────────
  let closestIdx = 0
  let minDist = Infinity
  stops.forEach((stop, idx) => {
    const dist = haversineDistance(
      position[0],
      position[1],
      stop.latitude,
      stop.longitude
    )
    if (dist < minDist) {
      minDist = dist
      closestIdx = idx
    }
  })

  // If far from all stops, assume at the start
  if (minDist > 500) return 0

  // If very close to the current stop (< 100m), next is the one after
  if (minDist < 100 && closestIdx < stops.length - 1) {
    return closestIdx + 1
  }
  return closestIdx
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function ActiveTrip() {
  const navigate = useNavigate()
  const [bus, setBus] = useState<Bus | null>(null)
  const [route, setRoute] = useState<Route | null>(null)
  const [tripActive, setTripActive] = useState(false)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [ending, setEnding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [followMode, setFollowMode] = useState(true)

  // Location state
  const [position, setPosition] = useState<[number, number] | null>(null)
  const [speed, setSpeed] = useState<number>(0)
  const [heading, setHeading] = useState<number>(0)
  const [locationError, setLocationError] = useState<string | null>(null)

  const watchIdRef = useRef<number | null>(null)
  const sendIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const latestPositionRef = useRef<[number, number] | null>(null)
  const latestSpeedRef = useRef(0)
  const latestHeadingRef = useRef(0)
  const lastSendTimeRef = useRef(0)

  useEffect(() => {
    loadData()

    // Listen for trip end events (e.g., if admin ends the trip)
    const unsubTripEnded = socketService.onTripEnded((data) => {
      console.log('Trip ended event received:', data)
      // Stop location tracking and navigate back
      stopLocationTracking()
      setTripActive(false)
      navigate('/driver')
    })

    // Listen for socket errors
    const handleError = (error: unknown) => {
      const err = error as { message?: string }
      console.error('Socket error:', err.message || 'Unknown error')
      setError(err.message || 'An error occurred')
    }

    socketService.on('error', handleError)

    return () => {
      stopLocationTracking()
      unsubTripEnded()
      socketService.off('error', handleError)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadData = async () => {
    try {
      const [busRes, tripRes] = await Promise.all([
        tripsApi.getMyBus().catch(() => ({ data: { data: null } })),
        tripsApi.getCurrent()
      ])

      setBus(busRes.data.data)

      if (busRes.data.data?.routeId) {
        const routeId =
          typeof busRes.data.data.routeId === 'object'
            ? (busRes.data.data.routeId as { _id: string })._id
            : busRes.data.data.routeId

        const routeRes = await routesApi.getById(routeId)
        setRoute(routeRes.data.data)
      }

      if (tripRes.data.data) {
        setTripActive(true)
        startLocationTracking()
      }
    } catch (err) {
      console.error('Failed to load data:', err)
    } finally {
      setLoading(false)
    }
  }

  const startLocationTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported')
      return
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      pos => {
        const newPos: [number, number] = [
          pos.coords.latitude,
          pos.coords.longitude
        ]
        setPosition(newPos)
        latestPositionRef.current = newPos

        const spd = pos.coords.speed ? pos.coords.speed * 3.6 : 0
        setSpeed(spd)
        latestSpeedRef.current = spd

        const hdg = pos.coords.heading || 0
        setHeading(hdg)
        latestHeadingRef.current = hdg

        setLocationError(null)

        // Send location immediately on every GPS fix (throttled to once per 3s)
        const now = Date.now()
        if (now - lastSendTimeRef.current >= 3000) {
          lastSendTimeRef.current = now
          socketService.sendLocation(newPos[0], newPos[1], spd, hdg)
        }
      },
      err => setLocationError(err.message),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )

    // Fallback: send location every 5 seconds in case watchPosition fires infrequently
    sendIntervalRef.current = setInterval(() => {
      if (latestPositionRef.current) {
        const now = Date.now()
        if (now - lastSendTimeRef.current >= 3000) {
          lastSendTimeRef.current = now
          socketService.sendLocation(
            latestPositionRef.current[0],
            latestPositionRef.current[1],
            latestSpeedRef.current,
            latestHeadingRef.current
          )
        }
      }
    }, 5000)
  }, [])

  const stopLocationTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    if (sendIntervalRef.current) {
      clearInterval(sendIntervalRef.current)
      sendIntervalRef.current = null
    }
  }

  const handleStartTrip = async () => {
    if (!bus) return

    const routeId =
      typeof bus.routeId === 'object'
        ? (bus.routeId as { _id: string })._id
        : bus.routeId

    if (!routeId) {
      setError('No route assigned to your bus')
      return
    }

    setStarting(true)
    setError(null)

    try {
      socketService.startTrip(bus._id, routeId)
      setTripActive(true)
      startLocationTracking()
    } catch (err) {
      setError('Failed to start trip')
      console.error(err)
    } finally {
      setStarting(false)
    }
  }

  const handleEndTrip = async () => {
    if (!confirm('Are you sure you want to end this trip?')) return

    setEnding(true)
    try {
      socketService.endTrip()
      stopLocationTracking()
      setTripActive(false)
      navigate('/driver')
    } catch (err) {
      setError('Failed to end trip')
      console.error(err)
    } finally {
      setEnding(false)
    }
  }

  // ─── Compute path segments (covered vs remaining) ────────────────────────

  const stops = useMemo(() => route?.stops || [], [route])
  const routePath: [number, number][] = useMemo(() => {
    if (route?.path && route.path.length > 1) return route.path
    if (stops.length > 1) return stops.map(s => [s.latitude, s.longitude] as [number, number])
    return []
  }, [route, stops])

  const nextStopIdx = useMemo(
    () => (position ? getNextStopIndex(stops, position, routePath) : 0),
    [stops, position, routePath]
  )

  const nextStop = stops[nextStopIdx] || null
  const distToNextStop = useMemo(() => {
    if (!position || !nextStop) return null
    return Math.round(
      haversineDistance(
        position[0],
        position[1],
        nextStop.latitude,
        nextStop.longitude
      )
    )
  }, [position, nextStop])

  // Split the path into covered (dimmed) and remaining (bright)
  const { coveredPath, remainingPath } = useMemo(() => {
    if (!position || routePath.length === 0) {
      return { coveredPath: [] as [number, number][], remainingPath: routePath }
    }
    const closestIdx = findClosestPointOnPath(routePath, position)
    return {
      coveredPath: routePath.slice(0, closestIdx + 1),
      remainingPath: routePath.slice(closestIdx)
    }
  }, [routePath, position])

  const driverIcon = useMemo(() => createDriverIcon(heading), [heading])

  // ─── Loading / Error States ───────────────────────────────────────────────

  if (loading) {
    return (
      <div className="">
        <Loader2 className="" />
      </div>
    )
  }

  if (!bus) {
    return (
      <div className="">
        <AlertCircle className="" />
        <h2 className="">
          No Bus Assigned
        </h2>
        <p className="">
          You need a bus assigned to start a trip.
        </p>
      </div>
    )
  }

  const center: [number, number] = position ||
    (stops.length > 0
      ? [stops[0].latitude, stops[0].longitude]
      : [31.5204, 74.3587])

  return (
    <div className="">
      {/* ─── Navigation Header (Google Maps style) ─────────────────── */}
      {tripActive && nextStop && (
        <div className="">
          <div className="">
            <Navigation className="" />
          </div>
          <div className="">
            <div className="">Next stop</div>
            <div className="">{nextStop.name}</div>
          </div>
          <div className="">
            {distToNextStop !== null && (
              <div className="">
                {distToNextStop > 1000
                  ? `${(distToNextStop / 1000).toFixed(1)} km`
                  : `${distToNextStop} m`}
              </div>
            )}
            {speed > 0 && (
              <div className="">
                <Gauge className="" />
                {Math.round(speed)} km/h
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Pre-trip header ──────────────────────────────────────── */}
      {!tripActive && (
        <div className="">
          <div>
            <div className="">{bus.name}</div>
            <div className="">
              {bus.plateNumber} •{' '}
              {route ? `${stops.length} stops` : 'No route assigned'}
            </div>
          </div>
          <button
            onClick={handleStartTrip}
            disabled={starting || !route}
            className=""
          >
            {starting ? (
              <Loader2 className="" />
            ) : (
              <Navigation className="" />
            )}
            Start Trip
          </button>
        </div>
      )}

      {error && (
        <div className="">
          <p className="">{error}</p>
        </div>
      )}

      {locationError && tripActive && (
        <div className="">
          <p className="">
            Location error: {locationError}
          </p>
        </div>
      )}

      {/* ─── Map ──────────────────────────────────────────────────── */}
      <div className="">
        <MapContainer
          center={center}
          zoom={16}
          className=""
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
          />

          {/* Auto-follow */}
          {position && tripActive && (
            <AutoFollowMap
              position={position}
              heading={heading}
              followMode={followMode}
            />
          )}

          {/* Covered path (dimmed) */}
          {tripActive && coveredPath.length > 1 && (
            <Polyline
              positions={coveredPath}
              color='#94a3b8'
              weight={5}
              opacity={0.4}
            />
          )}

          {/* Remaining path (bright) */}
          {remainingPath.length > 1 && (
            <Polyline
              positions={remainingPath}
              color='#0ea5e9'
              weight={5}
              opacity={0.9}
            />
          )}

          {/* Full path (when not tripping) */}
          {!tripActive && routePath.length > 1 && (
            <Polyline
              positions={routePath}
              color='#0ea5e9'
              weight={4}
              opacity={0.7}
            />
          )}

          {/* Stop markers */}
          {stops.map((stop, index) => (
            <Marker
              key={stop._id}
              position={[stop.latitude, stop.longitude]}
              icon={
                tripActive && index === nextStopIdx ? nextStopIcon : stopIcon
              }
            >
              <Popup>
                <div className="">
                  <div className="">{stop.name}</div>
                  <div className="">
                    Stop #{index + 1}
                    {tripActive && index === nextStopIdx && ' — Next'}
                    {tripActive && index < nextStopIdx && ' — Passed'}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Driver position marker */}
          {position && (
            <Marker position={position} icon={driverIcon}>
              <Popup>
                <div className="">
                  <div className="">You are here</div>
                  {speed > 0 && (
                    <div className="">
                      {Math.round(speed)} km/h
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>

        {/* ─── Map overlay controls ──────────────────────────────── */}

        {/* Re-center button */}
        {tripActive && (
          <button
            onClick={() => setFollowMode(true)}
            className={`absolute bottom-24 right-4 z-[1000] p-3 rounded-full shadow-lg transition-all ${
              followMode
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
            title='Re-center on your location'
          >
            <Locate className="" />
          </button>
        )}

        {/* Stop list bar (bottom of map when trip active) */}
        {tripActive && (
          <div className="">
            <div className="">
              <div className="">
                <span className="">
                  Upcoming stops
                </span>
                <button
                  onClick={handleEndTrip}
                  disabled={ending}
                  className=""
                >
                  {ending ? (
                    <Loader2 className="" />
                  ) : (
                    <Square className="" />
                  )}
                  End Trip
                </button>
              </div>

              <div className="">
                {stops.slice(nextStopIdx).map((stop, i) => (
                  <div
                    key={stop._id}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg shrink-0 ${
                      i === 0
                        ? 'bg-primary/10 border border-primary/20'
                        : 'bg-app-bg border border-ui-border'
                    }`}
                  >
                    <MapPin
                      className={`w-3.5 h-3.5 shrink-0 ${
                        i === 0 ? 'text-primary' : 'text-content-secondary'
                      }`}
                    />
                    <span
                      className={`text-sm font-medium whitespace-nowrap ${
                        i === 0 ? 'text-primary' : 'text-content-secondary'
                      }`}
                    >
                      {stop.name}
                    </span>
                    {i < stops.slice(nextStopIdx).length - 1 && (
                      <ChevronRight className="" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

