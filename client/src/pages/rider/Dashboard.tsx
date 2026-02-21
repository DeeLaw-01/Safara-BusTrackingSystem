import { useEffect, useState } from 'react'
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
  MoreHorizontal,
  Menu,
  X,
  Settings,
  User,
  LogOut,
  HelpCircle,
  Bell,
  Shield,
  ChevronRight
} from 'lucide-react'
import { routesApi, busesApi } from '@/services/api'
import { socketService } from '@/services/socket'
import { useBusStore } from '@/store/busStore'
import { useAuthStore } from '@/store/authStore'
import UserAvatar from '@/components/ui/UserAvatar'
import type { Route, Stop, BusLocation } from '@/types'
import 'leaflet/dist/leaflet.css'

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
    routes.forEach(r => socketService.joinRoute(r._id))
    return () => {
      routes.forEach(r => socketService.leaveRoute(r._id))
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
      <div className='flex items-center justify-center h-screen bg-white'>
        <Loader2 className='w-8 h-8 text-coral-500 animate-spin' />
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
      <header className='bg-white border-b border-gray-100 px-4 h-14 flex items-center gap-3 z-[120] shrink-0 relative'>
        {view !== 'select' ? (
          <button
            title='Back'
            onClick={handleBack}
            className='p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors'
          >
            <ArrowLeft className='w-5 h-5 text-gray-700' />
          </button>
        ) : (
          <button
            title='Open Sidebar'
            onClick={() => setSidebarOpen(true)}
            className='p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors'
          >
            <Menu className='w-5 h-5 text-gray-700' />
          </button>
        )}
        <div className='flex items-center gap-2'>
          <div className='p-1.5 bg-coral-500 rounded-lg'>
            <Bus className='w-4 h-4 text-white' />
          </div>
          <h1 className='text-lg font-bold text-gray-900 tracking-tight'>
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
          className='h-full w-full'
          zoomControl={false}
          style={{ background: '#f8f9fa' }}
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
                  <span className='text-sm font-medium'>Your location</span>
                </Popup>
              </Marker>
            </>
          )}

          {/* Route polyline (preview / tracking) */}
          {(view === 'preview' || view === 'tracking') &&
            selectedRoute &&
            selectedRoute.stops?.length > 1 && (
              <Polyline
                positions={selectedRoute.stops.map(
                  s => [s.latitude, s.longitude] as [number, number]
                )}
                color='#38bdf8'
                weight={5}
                opacity={0.9}
              />
            )}

          {/* Stop markers (preview / tracking) */}
          {(view === 'preview' || view === 'tracking') &&
            selectedRoute?.stops?.map(stop => (
              <Marker
                key={stop._id}
                position={[stop.latitude, stop.longitude]}
                icon={stopIcon}
              >
                <Popup>
                  <div className='text-sm'>
                    <div className='font-semibold text-gray-900'>
                      {stop.name}
                    </div>
                    <div className='text-gray-500'>
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
                    <div className='text-sm'>
                      <div className='font-bold text-gray-900'>{bus.name}</div>
                      <div className='text-gray-500'>{getRouteName(bus)}</div>
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
                    <div className='text-sm'>
                      <div className='font-bold text-gray-900'>
                        {selectedBus.name}
                      </div>
                      {live.speed && (
                        <div className='text-gray-500'>
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
          className='flex justify-center pt-3 pb-2 cursor-pointer'
          onClick={() => setSheetExpanded(!sheetExpanded)}
        >
          <div className='w-10 h-1 bg-gray-300 rounded-full' />
        </div>

        {/* Sheet content */}
        <div className='flex-1 overflow-y-auto px-4 pb-4'>
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
  return (
    <div>
      <div className='flex items-center gap-2 mb-4'>
        <h2 className='text-xl font-bold text-gray-900'>Select bus</h2>
        <button className='p-1' title='Information'>
          <Info className='w-4 h-4 text-gray-400' />
        </button>
      </div>

      {buses.length === 0 ? (
        <div className='text-center py-12'>
          <Bus className='w-12 h-12 text-gray-300 mx-auto mb-4' />
          <p className='text-gray-500 font-medium'>No buses available</p>
          <p className='text-gray-400 text-sm mt-1'>
            Check back later for available routes
          </p>
        </div>
      ) : (
        <div className='space-y-3'>
          {buses.map(bus => {
            const routeName = getRouteName(bus)
            const live = getLiveBusLocation(bus._id)

            return (
              <button
                key={bus._id}
                onClick={() => onSelectBus(bus)}
                className='w-full flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:border-coral-200 hover:bg-coral-50/30 transition-all group'
              >
                {/* Bus icon */}
                <div className='w-12 h-10 bg-amber-100 rounded-lg flex items-center justify-center shrink-0'>
                  <Bus className='w-6 h-6 text-amber-600' />
                </div>

                {/* Bus info */}
                <div className='flex-1 text-left'>
                  <div className='font-semibold text-gray-900 group-hover:text-coral-600 transition-colors'>
                    {bus.name}
                  </div>
                </div>

                {/* Route badge */}
                {routeName && (
                  <span className='text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full uppercase tracking-wide'>
                    {routeName}
                  </span>
                )}

                {/* Live indicator */}
                {live && (
                  <span className='w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shrink-0' />
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
    <div className='flex flex-col h-full'>
      <h2 className='text-xl font-bold text-gray-900 mb-4'>
        {bus.name} - Route
      </h2>

      {/* Timeline */}
      <div className='flex-1 overflow-y-auto'>
        <div className='relative pl-6'>
          {/* Red vertical line */}
          {stops.length > 1 && (
            <div
              className='absolute left-[11px] top-2 bottom-2 w-0.5 bg-coral-400'
              style={{ zIndex: 0 }}
            />
          )}

          {stops.map((stop, index) => (
            <div
              key={stop._id}
              className='relative flex items-start gap-4 mb-6 last:mb-0'
            >
              {/* Dot */}
              <div
                className={`absolute left-[-17px] top-1 w-4 h-4 rounded-full border-2 z-10 ${
                  index === 0
                    ? 'bg-white border-coral-500 ring-4 ring-coral-100'
                    : 'bg-gray-400 border-gray-400'
                }`}
              />

              {/* Stop info */}
              <div className='flex-1 min-w-0'>
                <div className='font-semibold text-gray-900'>{stop.name}</div>
                <div className='text-sm text-gray-400'>
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
        className='btn-coral w-full mt-4 py-4 text-base rounded-2xl'
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

  // Determine which stop the bus is closest to
  const currentStopIndex = getCurrentStopIndex(stops, live)

  // Calculate ETA (rough estimate based on remaining stops)
  const etaMinutes = estimateETA(stops, currentStopIndex)

  return (
    <div className='flex flex-col h-full'>
      {/* Driver Info Card */}
      <div className='flex items-center gap-4 mb-6'>
        <div className='w-14 h-14 bg-gray-200 rounded-full flex items-center justify-center shrink-0'>
          <svg
            className='w-8 h-8 text-gray-400'
            fill='currentColor'
            viewBox='0 0 24 24'
          >
            <path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z' />
          </svg>
        </div>
        <div className='flex-1 min-w-0'>
          <div className='font-semibold text-gray-900 text-base'>
            {driver?.name || 'Driver'}
          </div>
          {driver?.phone && (
            <div className='text-sm text-gray-500 flex items-center gap-1'>
              <Phone className='w-3 h-3' />
              {driver.phone}
            </div>
          )}
          <span className='inline-block mt-1 text-xs font-medium text-white bg-coral-500 px-2 py-0.5 rounded-full'>
            {bus.name}
          </span>
        </div>
        <div className='text-right'>
          <div className='text-xs text-gray-500 font-medium'>Next stop in</div>
          <div className='text-3xl font-bold text-coral-500 tabular-nums'>
            {formatETA(etaMinutes)}
          </div>
        </div>
      </div>

      {/* Route Timeline */}
      <h3 className='text-lg font-bold text-gray-900 mb-4'>
        {bus.name} - Route
      </h3>

      <div className='flex-1 overflow-y-auto'>
        <div className='relative pl-6'>
          {/* Progress line */}
          {stops.length > 1 && (
            <>
              {/* Completed portion (red) */}
              <div
                className='absolute left-[11px] top-2 w-0.5 bg-coral-500'
                style={{
                  height: `${
                    (currentStopIndex / Math.max(stops.length - 1, 1)) * 100
                  }%`,
                  zIndex: 1
                }}
              />
              {/* Remaining portion (gray) */}
              <div
                className='absolute left-[11px] top-2 bottom-2 w-0.5 bg-gray-200'
                style={{ zIndex: 0 }}
              />
            </>
          )}

          {stops.map((stop, index) => {
            const isPassed = index < currentStopIndex
            const isCurrent = index === currentStopIndex

            return (
              <div
                key={stop._id}
                className='relative flex items-start gap-4 mb-6 last:mb-0'
              >
                {/* Dot */}
                <div
                  className={`absolute left-[-17px] top-1 w-4 h-4 rounded-full border-2 z-10 ${
                    isCurrent
                      ? 'bg-white border-coral-500 ring-4 ring-coral-100'
                      : isPassed
                      ? 'bg-coral-500 border-coral-500'
                      : 'bg-gray-300 border-gray-300'
                  }`}
                />

                {/* Stop info */}
                <div className='flex-1 min-w-0'>
                  <div
                    className={`font-semibold ${
                      isCurrent
                        ? 'text-gray-900 text-base'
                        : isPassed
                        ? 'text-gray-500'
                        : 'text-gray-700'
                    }`}
                  >
                    {stop.name}
                  </div>
                  <div className='text-sm text-gray-400'>
                    More information about the station
                  </div>
                </div>

                {/* Three dots menu */}
                <button
                  className='p-1 hover:bg-gray-100 rounded-lg shrink-0'
                  title='More'
                >
                  <MoreHorizontal className='w-4 h-4 text-gray-400' />
                </button>
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
    { icon: Bell, label: 'Notifications', path: '/notifications' },
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
        <div className='bg-gradient-to-br from-coral-500 to-coral-600 px-5 pt-12 pb-6'>
          <button
            title='Close Sidebar'
            onClick={onClose}
            className='absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/20 transition-colors'
          >
            <X className='w-5 h-5 text-white' />
          </button>

          <UserAvatar
            name={user?.name}
            avatar={user?.avatar}
            size='lg'
            className='ring-3 ring-white/30 mb-3'
          />
          <div className='text-white font-semibold text-lg leading-tight'>
            {user?.name || 'User'}
          </div>
          <div className='text-white/70 text-sm mt-0.5'>{user?.email}</div>
          <div className='mt-2'>
            <span className='inline-block text-xs font-medium text-coral-100 bg-white/20 px-2.5 py-0.5 rounded-full capitalize'>
              {user?.role || 'Rider'}
            </span>
          </div>
        </div>

        {/* Menu items */}
        <nav className='flex-1 py-3 overflow-y-auto'>
          {menuItems.map(({ icon: Icon, label, path }) => (
            <button
              key={path}
              onClick={() => {
                navigate(path)
                onClose()
              }}
              className='w-full flex items-center gap-4 px-5 py-3.5 text-left hover:bg-gray-50 transition-colors group'
            >
              <Icon className='w-5 h-5 text-gray-400 group-hover:text-coral-500 transition-colors' />
              <span className='flex-1 text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors'>
                {label}
              </span>
              <ChevronRight className='w-4 h-4 text-gray-300 group-hover:text-gray-400 transition-colors' />
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className='border-t border-gray-100 p-4'>
          <button
            title='Logout'
            onClick={() => {
              onLogout()
              onClose()
            }}
            className='w-full flex items-center gap-3 px-3 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-colors group'
          >
            <LogOut className='w-5 h-5' />
            <span className='text-sm font-medium'>Log out</span>
          </button>
        </div>

        {/* App version */}
        <div className='px-5 pb-4 text-center'>
          <span className='text-xs text-gray-300'>BusTrack v1.0.0</span>
        </div>
      </div>
    </>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getCurrentStopIndex (stops: Stop[], busLocation?: BusLocation): number {
  if (!busLocation || stops.length === 0) return 0

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
