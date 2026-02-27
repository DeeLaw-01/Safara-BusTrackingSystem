import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
  Circle
} from 'react-leaflet'
import L from 'leaflet'
import {
  Bus,
  ArrowLeft,
  Loader2,
  Phone,
  Info,
  Menu,
  X,
  Settings,
  User,
  LogOut,
  HelpCircle,
  Bell as BellIcon,
  Shield,
  ChevronRight
} from 'lucide-react'
import { routesApi, busesApi, remindersApi } from '@/services/api'
import { socketService } from '@/services/socket'
import { useBusStore } from '@/store/busStore'
import { useAuthStore } from '@/store/authStore'
import UserAvatar from '@/components/ui/UserAvatar'
import type { Route, Stop, BusLocation } from '@/types'


// ─── Leaflet Icon Fix ────────────────────────────────────────────────────────
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: () => void })
  ._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
})

// ─── Custom Icons ────────────────────────────────────────────────────────────
function createBusIcon (label: string, isActive = false) {
  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:48px;height:56px;">
        <div style="
          width:48px;height:48px;
          background:${isActive ? '#f95f5f' : '#fbbf24'};
          border-radius:12px;
          display:flex;align-items:center;justify-content:center;
          box-shadow:0 4px 12px rgba(0,0,0,0.2);
          border:3px solid white;
        ">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
            <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/>
          </svg>
        </div>
        <div style="
          position:absolute;top:-8px;right:-8px;
          width:24px;height:24px;
          background:#38bdf8;border:2px solid white;
          border-radius:50%;display:flex;align-items:center;justify-content:center;
          font-size:11px;font-weight:700;color:white;
          box-shadow:0 2px 6px rgba(0,0,0,0.2);
        ">${label}</div>
      </div>
    `,
    iconSize: [48, 56],
    iconAnchor: [24, 48]
  })
}

const stopIcon = L.divIcon({
  className: '',
  html: `
    <div style="
      width:14px;height:14px;
      background:#f95f5f;
      border-radius:50%;
      border:3px solid white;
      box-shadow:0 2px 6px rgba(0,0,0,0.3);
    "></div>
  `,
  iconSize: [14, 14],
  iconAnchor: [7, 7]
})

const userIcon = L.divIcon({
  className: '',
  html: `
    <div style="position:relative;width:20px;height:20px;">
      <div style="
        width:20px;height:20px;
        background:#3b82f6;
        border-radius:50%;
        border:3px solid white;
        box-shadow:0 2px 8px rgba(59,130,246,0.5);
      "></div>
    </div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10]
})

// ─── Types ───────────────────────────────────────────────────────────────────
type ViewState = 'select' | 'preview' | 'tracking'

interface BusWithRoute {
  _id: string
  plateNumber: string
  name: string
  capacity: number
  isActive: boolean
  routeId: { _id: string; name: string } | string
  driverId?:
    | { _id: string; name: string; email: string; phone?: string }
    | string
}

// ─── Map Controller ──────────────────────────────────────────────────────────
function MapController ({
  center,
  zoom,
  bounds
}: {
  center?: [number, number]
  zoom?: number
  bounds?: L.LatLngBoundsExpression
}) {
  const map = useMap()

  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 })
    } else if (center && zoom) {
      map.setView(center, zoom)
    }
  }, [map, center, zoom, bounds])

  return null
}

// ─── Main Dashboard Component ────────────────────────────────────────────────
export default function RiderDashboard () {
  const { busLocations, updateBusLocation, removeBus } = useBusStore()
  const { user, logout } = useAuthStore()

  // View state
  const [view, setView] = useState<ViewState>('select')
  const [sheetExpanded, setSheetExpanded] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Data state
  const [routes, setRoutes] = useState<Route[]>([])
  const [buses, setBuses] = useState<BusWithRoute[]>([])
  const [loading, setLoading] = useState(true)

  // Selected items
  const [selectedBus, setSelectedBus] = useState<BusWithRoute | null>(null)
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null)

  // User location
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null
  )

  // Default center (Lahore)
  const defaultCenter: [number, number] = [31.5204, 74.3587]

  // ─── Load initial data ──────────────────────────────────────────────
  useEffect(() => {
    loadData()
    getUserLocation()
  }, [])

  const loadData = async () => {
    try {
      const [routesRes, busesRes] = await Promise.all([
        routesApi.getAll(true),
        busesApi.getAll({ active: true })
      ])
      setRoutes(routesRes.data.data)
      setBuses(busesRes.data.data)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getUserLocation = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      pos => {
        setUserLocation([pos.coords.latitude, pos.coords.longitude])
      },
      err => console.log('Geolocation not available:', err.message),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  // ─── Socket connection for real-time bus updates ────────────────────
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      socketService.connect(token)
    }

    const unsubLocation = socketService.onBusLocation(data => {
      updateBusLocation(data)
    })

    const unsubTripEnded = socketService.onTripEnded(data => {
      removeBus(data.busId)
    })

    return () => {
      unsubLocation()
      unsubTripEnded()
    }
  }, [updateBusLocation, removeBus])

  // ─── Join all route rooms for live bus updates ──────────────────────
  useEffect(() => {
    const joinAllRoutes = () => {
      routes.forEach(r => socketService.joinRoute(r._id))
    }

    joinAllRoutes()

    // Re-join rooms after socket reconnection (rooms are lost on disconnect)
    const unsubConnected = socketService.onConnected(() => {
      console.log('Socket reconnected — rejoining route rooms')
      joinAllRoutes()
    })

    return () => {
      routes.forEach(r => socketService.leaveRoute(r._id))
      unsubConnected()
    }
  }, [routes])

  // ─── Handlers ───────────────────────────────────────────────────────
  const handleSelectBus = (bus: BusWithRoute) => {
    setSelectedBus(bus)
    // Find the route for this bus
    const routeId =
      typeof bus.routeId === 'object' ? bus.routeId._id : bus.routeId
    const route = routes.find(r => r._id === routeId)
    if (route) {
      setSelectedRoute(route)
    }
    setView('preview')
    setSheetExpanded(true)
  }

  const handleViewStops = () => {
    if (!selectedBus || !selectedRoute) return
    setView('tracking')
    setSheetExpanded(true)
  }

  const handleBack = () => {
    if (view === 'tracking') {
      setView('preview')
    } else if (view === 'preview') {
      setView('select')
      setSelectedBus(null)
      setSelectedRoute(null)
    }
  }

  // ─── Get live bus locations ─────────────────────────────────────────
  const getLiveBusLocation = (busId: string): BusLocation | undefined => {
    return busLocations.get(busId)
  }

  // ─── Compute map bounds ─────────────────────────────────────────────
  const getMapBounds = (): L.LatLngBoundsExpression | undefined => {
    if (view === 'preview' || view === 'tracking') {
      if (selectedRoute && selectedRoute.stops?.length > 0) {
        const points: [number, number][] = selectedRoute.stops.map(s => [
          s.latitude,
          s.longitude
        ])
        if (selectedBus) {
          const live = getLiveBusLocation(selectedBus._id)
          if (live) points.push([live.latitude, live.longitude])
        }
        if (userLocation) points.push(userLocation)
        return points as L.LatLngBoundsExpression
      }
    }
    // For select view, show all bus locations + user
    const points: [number, number][] = []
    busLocations.forEach(loc => points.push([loc.latitude, loc.longitude]))
    if (userLocation) points.push(userLocation)
    if (points.length >= 2) return points as L.LatLngBoundsExpression
    return undefined
  }

  // ─── Get route label for a bus ──────────────────────────────────────
  const getRouteName = (bus: BusWithRoute): string => {
    if (typeof bus.routeId === 'object' && bus.routeId) {
      return bus.routeId.name
    }
    const route = routes.find(r => r._id === bus.routeId)
    return route?.name || ''
  }

  // ─── Get bus letter label ──────────────────────────────────────────
  const getBusLabel = (index: number): string => {
    return String.fromCharCode(65 + (index % 26))
  }

  // ─── Get driver info ───────────────────────────────────────────────
  const getDriverInfo = (
    bus: BusWithRoute
  ): { name: string; phone?: string } | null => {
    if (typeof bus.driverId === 'object' && bus.driverId) {
      return { name: bus.driverId.name, phone: bus.driverId.phone }
    }
    return null
  }

  // ─── Loading state ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="">
        <Loader2 className="" />
      </div>
    )
  }

  const mapBounds = getMapBounds()
  const mapCenter = userLocation || defaultCenter

  return (
    <div
      className={`h-screen flex flex-col bg-white relative overflow-hidden ${
        sidebarOpen ? 'sidebar-open' : ''
      }`}
    >
      {/* ─── Sidebar Drawer ───────────────────────────────────────── */}
      <SidebarDrawer
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
        onLogout={logout}
      />

      {/* ─── Header ─────────────────────────────────────────────────── */}
      <header className="">
        {view !== 'select' ? (
          <button
            title='Back'
            onClick={handleBack}
            className=""
          >
            <ArrowLeft className="" />
          </button>
        ) : (
          <button
            title='Open Sidebar'
            onClick={() => setSidebarOpen(true)}
            className=""
          >
            <Menu className="" />
          </button>
        )}
        <div className="">
          <div className="">
            <Bus className="" />
          </div>
          <h1 className="">
            BUS SMART SYSTEM
          </h1>
        </div>
      </header>

      {/* ─── Map Area ───────────────────────────────────────────────── */}
      <div
        className={`relative transition-all duration-300 ${
          view === 'tracking' && sheetExpanded ? 'h-[25vh]' : 'h-[45vh]'
        }`}
      >
        <MapContainer
          center={mapCenter}
          zoom={13}
          className=""
          zoomControl={false}
         
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url='https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
          />

          {mapBounds && <MapController bounds={mapBounds} />}
          {!mapBounds && <MapController center={mapCenter} zoom={13} />}

          {/* User location */}
          {userLocation && (
            <>
              <Circle
                center={userLocation}
                radius={100}
                pathOptions={{
                  color: '#3b82f6',
                  fillColor: '#3b82f6',
                  fillOpacity: 0.1,
                  weight: 1
                }}
              />
              <Marker position={userLocation} icon={userIcon}>
                <Popup>
                  <span className="">Your location</span>
                </Popup>
              </Marker>
            </>
          )}

          {/* Route polyline (preview / tracking) — use OSRM path if available */}
          {(view === 'preview' || view === 'tracking') &&
            selectedRoute &&
            (selectedRoute.path && selectedRoute.path.length > 1 ? (
              <Polyline
                positions={selectedRoute.path}
                color='#38bdf8'
                weight={5}
                opacity={0.9}
              />
            ) : selectedRoute.stops?.length > 1 ? (
              <Polyline
                positions={selectedRoute.stops.map(
                  s => [s.latitude, s.longitude] as [number, number]
                )}
                color='#38bdf8'
                weight={5}
                opacity={0.9}
              />
            ) : null)}

          {/* Stop markers (preview / tracking) */}
          {(view === 'preview' || view === 'tracking') &&
            selectedRoute?.stops?.map(stop => (
              <Marker
                key={stop._id}
                position={[stop.latitude, stop.longitude]}
                icon={stopIcon}
              >
                <Popup>
                  <div className="">
                    <div className="">
                      {stop.name}
                    </div>
                    <div className="">
                      Stop #{stop.sequence + 1}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

          {/* Bus markers */}
          {view === 'select' &&
            buses.map((bus, idx) => {
              const live = getLiveBusLocation(bus._id)
              if (!live) return null
              return (
                <Marker
                  key={bus._id}
                  position={[live.latitude, live.longitude]}
                  icon={createBusIcon(getBusLabel(idx))}
                  eventHandlers={{ click: () => handleSelectBus(bus) }}
                >
                  <Popup>
                    <div className="">
                      <div className="">{bus.name}</div>
                      <div className="">{getRouteName(bus)}</div>
                    </div>
                  </Popup>
                </Marker>
              )
            })}

          {/* Selected bus marker */}
          {(view === 'preview' || view === 'tracking') &&
            selectedBus &&
            (() => {
              const live = getLiveBusLocation(selectedBus._id)
              const idx = buses.findIndex(b => b._id === selectedBus._id)
              if (!live) return null
              return (
                <Marker
                  position={[live.latitude, live.longitude]}
                  icon={createBusIcon(getBusLabel(idx >= 0 ? idx : 0), true)}
                >
                  <Popup>
                    <div className="">
                      <div className="">
                        {selectedBus.name}
                      </div>
                      {live.speed && (
                        <div className="">
                          {Math.round(live.speed)} km/h
                        </div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              )
            })()}
        </MapContainer>
      </div>

      {/* ─── Bottom Sheet ───────────────────────────────────────────── */}
      <div
        className={`flex-1 bg-white rounded-t-3xl -mt-4 relative z-10 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] flex flex-col overflow-hidden`}
      >
        {/* Drag handle */}
        <div
          className=""
          onClick={() => setSheetExpanded(!sheetExpanded)}
        >
          <div className="" />
        </div>

        {/* Sheet content */}
        <div className="">
          {view === 'select' && (
            <BusSelectView
              buses={buses}
              getRouteName={getRouteName}
              getLiveBusLocation={getLiveBusLocation}
              onSelectBus={handleSelectBus}
            />
          )}

          {view === 'preview' && selectedRoute && selectedBus && (
            <RoutePreviewView
              bus={selectedBus}
              route={selectedRoute}
              onViewStops={handleViewStops}
            />
          )}

          {view === 'tracking' && selectedRoute && selectedBus && (
            <ActiveTrackingView
              bus={selectedBus}
              route={selectedRoute}
              getLiveBusLocation={getLiveBusLocation}
              getDriverInfo={getDriverInfo}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Bus Select View (Screen 1) ─────────────────────────────────────────────
function BusSelectView ({
  buses,
  getRouteName,
  getLiveBusLocation,
  onSelectBus
}: {
  buses: BusWithRoute[]
  getRouteName: (bus: BusWithRoute) => string
  getLiveBusLocation: (busId: string) => BusLocation | undefined
  onSelectBus: (bus: BusWithRoute) => void
}) {
  // Split buses into live (active trip) and inactive
  const liveBuses = buses.filter(b => getLiveBusLocation(b._id))
  const inactiveBuses = buses.filter(b => !getLiveBusLocation(b._id))

  return (
    <div>
      <div className="">
        <h2 className="">Select bus</h2>
        <button className="" title='Information'>
          <Info className="" />
        </button>
      </div>

      {buses.length === 0 ? (
        <div className="">
          <Bus className="" />
          <p className="">No buses available</p>
          <p className="">
            Check back later for available routes
          </p>
        </div>
      ) : (
        <div className="">
          {/* Live buses first */}
          {liveBuses.map(bus => {
            const routeName = getRouteName(bus)
            return (
              <button
                key={bus._id}
                onClick={() => onSelectBus(bus)}
                className=""
              >
                <div className="">
                  <Bus className="" />
                </div>
                <div className="">
                  <div className="">
                    {bus.name}
                  </div>
                  <div className="">
                    Live — On route
                  </div>
                </div>
                {routeName && (
                  <span className="">
                    {routeName}
                  </span>
                )}
                <span className="" />
              </button>
            )
          })}

          {/* Inactive buses */}
          {inactiveBuses.map(bus => {
            const routeName = getRouteName(bus)
            return (
              <button
                key={bus._id}
                onClick={() => onSelectBus(bus)}
                className=""
              >
                <div className="">
                  <Bus className="" />
                </div>
                <div className="">
                  <div className="">
                    {bus.name}
                  </div>
                  <div className="">
                    Not currently active
                  </div>
                </div>
                {routeName && (
                  <span className="">
                    {routeName}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Route Preview View (Screen 2) ──────────────────────────────────────────
function RoutePreviewView ({
  bus,
  route,
  onViewStops
}: {
  bus: BusWithRoute
  route: Route
  onViewStops: () => void
}) {
  const stops = route.stops || []

  return (
    <div className="">
      <h2 className="">
        {bus.name} - Route
      </h2>

      {/* Timeline */}
      <div className="">
        <div className="">
          {/* Red vertical line */}
          {stops.length > 1 && (
            <div
              className=""
             
            />
          )}

          {stops.map((stop, index) => (
            <div
              key={stop._id}
              className=""
            >
              {/* Dot */}
              <div
                className={`absolute left-[-17px] top-1 w-4 h-4 rounded-full border-2 z-10 ${
                  index === 0
                    ? 'bg-white border-primary ring-4 ring-primary/10'
                    : 'bg-ui-border border-ui-border'
                }`}
              />

              {/* Stop info */}
              <div className="">
                <div className="">{stop.name}</div>
                <div className="">
                  More information about the station
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* View Stops Button */}
      <button
        onClick={onViewStops}
        className=""
      >
        View Stops
      </button>
    </div>
  )
}

// ─── Active Tracking View (Screen 3) ────────────────────────────────────────
function ActiveTrackingView ({
  bus,
  route,
  getLiveBusLocation,
  getDriverInfo
}: {
  bus: BusWithRoute
  route: Route
  getLiveBusLocation: (busId: string) => BusLocation | undefined
  getDriverInfo: (bus: BusWithRoute) => { name: string; phone?: string } | null
}) {
  const stops = route.stops || []
  const live = getLiveBusLocation(bus._id)
  const driver = getDriverInfo(bus)

  // Determine which stop the bus is at using path-aware progress
  const currentStopIndex = getCurrentStopIndex(stops, live, route.path)

  // Calculate ETA (rough estimate based on remaining stops)
  const etaMinutes = estimateETA(stops, currentStopIndex)

  // Reminders state
  const [reminders, setReminders] = useState<
    Map<string, { id: string; minutesBefore: number }>
  >(new Map())
  const [reminderPopup, setReminderPopup] = useState<string | null>(null)
  const [reminderMinutes, setReminderMinutes] = useState(5)
  const [savingReminder, setSavingReminder] = useState(false)

  // Load existing reminders for this route
  useEffect(() => {
    loadReminders()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route._id])

  const loadReminders = async () => {
    try {
      const res = await remindersApi.getMyReminders()
      const data = res.data.data as Array<{
        _id: string
        stopId: { _id: string } | string
        routeId: { _id: string } | string
        minutesBefore: number
        isActive: boolean
      }>
      const map = new Map<string, { id: string; minutesBefore: number }>()
      data
        .filter(r => {
          const rRouteId =
            typeof r.routeId === 'object' ? r.routeId._id : r.routeId
          return rRouteId === route._id && r.isActive
        })
        .forEach(r => {
          const stopId = typeof r.stopId === 'object' ? r.stopId._id : r.stopId
          map.set(stopId, { id: r._id, minutesBefore: r.minutesBefore })
        })
      setReminders(map)
    } catch {
      // Silently fail
    }
  }

  const handleSetReminder = useCallback(
    async (stopId: string, minutes: number) => {
      setSavingReminder(true)
      try {
        // Check if reminder already exists
        const existing = reminders.get(stopId)
        if (existing) {
          // Update
          await remindersApi.update(existing.id, { minutesBefore: minutes })
          setReminders(prev => {
            const next = new Map(prev)
            next.set(stopId, { ...existing, minutesBefore: minutes })
            return next
          })
        } else {
          // Create
          const res = await remindersApi.create({
            stopId,
            routeId: route._id,
            minutesBefore: minutes,
            notificationType: 'push'
          })
          const newReminder = res.data.data
          setReminders(prev => {
            const next = new Map(prev)
            next.set(stopId, { id: newReminder._id, minutesBefore: minutes })
            return next
          })
        }
        setReminderPopup(null)
      } catch (err) {
        console.error('Failed to set reminder:', err)
      } finally {
        setSavingReminder(false)
      }
    },
    [reminders, route._id]
  )

  const handleRemoveReminder = useCallback(
    async (stopId: string) => {
      const existing = reminders.get(stopId)
      if (!existing) return
      try {
        await remindersApi.delete(existing.id)
        setReminders(prev => {
          const next = new Map(prev)
          next.delete(stopId)
          return next
        })
        setReminderPopup(null)
      } catch (err) {
        console.error('Failed to remove reminder:', err)
      }
    },
    [reminders]
  )

  return (
    <div className="">
      {/* Driver Info Card */}
      <div className="">
        <div className="">
          <svg
            className=""
            fill='currentColor'
            viewBox='0 0 24 24'
          >
            <path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z' />
          </svg>
        </div>
        <div className="">
          <div className="">
            {driver?.name || 'Driver'}
          </div>
          {driver?.phone && (
            <div className="">
              <Phone className="" />
              {driver.phone}
            </div>
          )}
          <span className="">
            {bus.name}
          </span>
        </div>
        <div className="">
          <div className="">Next stop in</div>
          <div className="">
            {formatETA(etaMinutes)}
          </div>
        </div>
      </div>

      {/* Route Timeline */}
      <h3 className="">
        {bus.name} - Route
      </h3>

      <div className="">
        <div className="">
          {/* Progress line */}
          {stops.length > 1 && (
            <>
              {/* Completed portion (red) */}
              <div
                className=""
                style={{
                  height: `${
                    (currentStopIndex / Math.max(stops.length - 1, 1)) * 100
                  }%`,
                  zIndex: 1
                }}
              />
              {/* Remaining portion (gray) */}
              <div
                className=""
               
              />
            </>
          )}

          {stops.map((stop, index) => {
            const isPassed = index < currentStopIndex
            const isCurrent = index === currentStopIndex
            const hasReminder = reminders.has(stop._id)
            const reminderData = reminders.get(stop._id)

            return (
              <div
                key={stop._id}
                className=""
              >
                {/* Dot */}
                <div
                  className={`absolute left-[-17px] top-1 w-4 h-4 rounded-full border-2 z-10 ${
                    isCurrent
                      ? 'bg-white border-primary ring-4 ring-primary/10'
                      : isPassed
                      ? 'bg-primary border-primary'
                      : 'bg-ui-border border-ui-border'
                  }`}
                />

                {/* Stop info */}
                <div className="">
                  <div
                    className={`font-semibold ${
                      isCurrent
                        ? 'text-content-primary text-base'
                        : isPassed
                        ? 'text-content-secondary'
                        : 'text-content-primary/80'
                    }`}
                  >
                    {stop.name}
                  </div>
                  {hasReminder && (
                    <div className="">
                      🔔 Alert {reminderData?.minutesBefore} min before
                    </div>
                  )}
                  {stop.estimatedArrivalTime && (
                    <div className="">
                      ETA: {stop.estimatedArrivalTime}
                    </div>
                  )}
                </div>

                {/* Reminder bell button */}
                {!isPassed && (
                  <div className="">
                    <button
                      className={`p-1.5 rounded-lg transition-colors ${
                        hasReminder
                          ? 'bg-amber-50 text-amber-500 hover:bg-amber-100'
                          : 'text-ui-border hover:bg-app-bg hover:text-content-secondary'
                      }`}
                      title={hasReminder ? 'Edit reminder' : 'Set reminder'}
                      onClick={() => {
                        if (reminderPopup === stop._id) {
                          setReminderPopup(null)
                        } else {
                          setReminderMinutes(reminderData?.minutesBefore || 5)
                          setReminderPopup(stop._id)
                        }
                      }}
                    >
                      <BellIcon className="" />
                    </button>

                    {/* Reminder popup */}
                    {reminderPopup === stop._id && (
                      <div className="">
                        <div className="">
                          Set Alert
                        </div>
                        <p className="">
                          Get notified when the bus is approaching this stop.
                        </p>
                        <label className="">
                          Minutes before arrival
                        </label>
                        <div className="">
                          {[2, 5, 10, 15].map(m => (
                            <button
                              key={m}
                              onClick={() => setReminderMinutes(m)}
                              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                                reminderMinutes === m
                                  ? 'bg-primary text-white'
                                  : 'bg-app-bg text-content-secondary hover:bg-ui-border/50'
                              }`}
                            >
                              {m} min
                            </button>
                          ))}
                        </div>
                        <div className="">
                          <button
                            onClick={() =>
                              handleSetReminder(stop._id, reminderMinutes)
                            }
                            disabled={savingReminder}
                            className=""
                          >
                            {savingReminder
                              ? 'Saving...'
                              : hasReminder
                              ? 'Update'
                              : 'Set Alert'}
                          </button>
                          {hasReminder && (
                            <button
                              onClick={() => handleRemoveReminder(stop._id)}
                              className=""
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Sidebar Drawer ──────────────────────────────────────────────────────────
function SidebarDrawer ({
  open,
  onClose,
  user,
  onLogout
}: {
  open: boolean
  onClose: () => void
  user: ReturnType<typeof useAuthStore.getState>['user']
  onLogout: () => void
}) {
  const navigate = useNavigate()

  const menuItems = [
    { icon: User, label: 'My Account', path: '/account' },
    { icon: BellIcon, label: 'Notifications', path: '/notifications' },
    { icon: Settings, label: 'Settings', path: '/settings' },
    { icon: HelpCircle, label: 'Help & Support', path: '/help' },
    { icon: Shield, label: 'Privacy Policy', path: '/privacy' }
  ]

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 z-[100] transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 left-0 bottom-0 w-[280px] bg-white z-[110] shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header / Profile area */}
        <div className="">
          <button
            title='Close Sidebar'
            onClick={onClose}
            className=""
          >
            <X className="" />
          </button>

          <UserAvatar
            name={user?.name}
            avatar={user?.avatar}
            size='lg'
            className=""
          />
          <div className="">
            {user?.name || 'User'}
          </div>
          <div className="">{user?.email}</div>
          <div className="">
            <span className="">
              {user?.role || 'Rider'}
            </span>
          </div>
        </div>

        {/* Menu items */}
        <nav className="">
          {menuItems.map(({ icon: Icon, label, path }) => (
            <button
              key={path}
              onClick={() => {
                navigate(path)
                onClose()
              }}
              className=""
            >
              <Icon className="" />
              <span className="">
                {label}
              </span>
              <ChevronRight className="" />
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="">
          <button
            title='Logout'
            onClick={() => {
              onLogout()
              onClose()
            }}
            className=""
          >
            <LogOut className="" />
            <span className="">Log out</span>
          </button>
        </div>

        {/* App version */}
        <div className="">
          <span className="">BusTrack v1.0.0</span>
        </div>
      </div>
    </>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Find the index of the closest point in an array of coordinates */
function findClosestPointIndex (
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

/**
 * Determine which stop the bus is currently at / approaching.
 * Uses route path (OSRM) when available for accurate directional progress.
 * Falls back to proximity-based approach otherwise.
 */
function getCurrentStopIndex (
  stops: Stop[],
  busLocation?: BusLocation,
  routePath?: [number, number][]
): number {
  if (!busLocation || stops.length === 0) return 0

  const busPos: [number, number] = [busLocation.latitude, busLocation.longitude]

  // ── Path-based progress (accurate, uses route direction) ───────────
  if (routePath && routePath.length > 1) {
    // Where is the bus along the path?
    const busPathIdx = findClosestPointIndex(routePath, busPos)

    // For each stop, find where it sits on the path
    let currentStopIdx = 0
    for (let i = 0; i < stops.length; i++) {
      const stopPathIdx = findClosestPointIndex(routePath, [
        stops[i].latitude,
        stops[i].longitude
      ])
      const distToStop = haversineDistance(
        busLocation.latitude,
        busLocation.longitude,
        stops[i].latitude,
        stops[i].longitude
      )

      if (busPathIdx > stopPathIdx && distToStop > 200) {
        // Bus is past this stop on the route AND far enough away
        currentStopIdx = Math.min(i + 1, stops.length - 1)
      } else {
        // Bus hasn't reached this stop yet (or is right at it)
        break
      }
    }
    return currentStopIdx
  }

  // ── Fallback: proximity-based (no path data) ──────────────────────
  // Only consider a stop "passed" if the bus is close enough to be on-route
  const NEAR_THRESHOLD = 500 // metres

  let closestIndex = 0
  let minDist = Infinity

  stops.forEach((stop, index) => {
    const dist = haversineDistance(
      busLocation.latitude,
      busLocation.longitude,
      stop.latitude,
      stop.longitude
    )
    if (dist < minDist) {
      minDist = dist
      closestIndex = index
    }
  })

  // If the bus is far from ALL stops, assume it hasn't reached stop 0 yet
  if (minDist > NEAR_THRESHOLD) return 0

  return closestIndex
}

function haversineDistance (
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

function estimateETA (stops: Stop[], currentIndex: number): number {
  // Rough estimate: ~3 minutes per stop remaining
  const remaining = Math.max(0, stops.length - 1 - currentIndex)
  return remaining * 3
}

function formatETA (minutes: number): string {
  const hrs = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}

