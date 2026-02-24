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
  Menu,
  X,
  User,
  LogOut,
  Bell as BellIcon,
  ChevronRight
} from 'lucide-react'
import { routesApi, busesApi, remindersApi } from '@/services/api'
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
          background:${isActive ? '#0F766E' : '#0D9488'};
          border-radius:14px;
          display:flex;align-items:center;justify-content:center;
          box-shadow:0 4px 16px rgba(15,118,110,0.25);
          border:3px solid white;
        ">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
            <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/>
          </svg>
        </div>
        <div style="
          position:absolute;top:-8px;right:-8px;
          width:24px;height:24px;
          background:#F59E0B;border:2px solid white;
          border-radius:50%;display:flex;align-items:center;justify-content:center;
          font-size:11px;font-weight:700;color:white;
          box-shadow:0 2px 6px rgba(0,0,0,0.15);
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
      background:#0F766E;
      border-radius:50%;
      border:3px solid white;
      box-shadow:0 2px 6px rgba(15,118,110,0.3);
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
        background:#0F766E;
        border-radius:50%;
        border:3px solid white;
        box-shadow:0 2px 8px rgba(15,118,110,0.4);
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

  // Socket ready state — tracks whether socket is connected and ready for room joins
  const [isSocketReady, setIsSocketReady] = useState(false)

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
      // If already connected (e.g. page nav without unmount), mark ready immediately
      if (socketService.isConnected()) {
        setIsSocketReady(true)
      }
    }

    const unsubLocation = socketService.onBusLocation(data => {
      updateBusLocation(data)
    })

    const unsubTripEnded = socketService.onTripEnded(data => {
      removeBus(data.busId)
    })

    const unsubConnected = socketService.onConnected(() => {
      console.log('[RiderDash] 🟢 Socket connected event fired → setIsSocketReady(true)');
      setIsSocketReady(true)
    })

    return () => {
      unsubLocation()
      unsubTripEnded()
      unsubConnected()
    }
  }, [updateBusLocation, removeBus])

  // ─── Join all route rooms — only when socket AND routes are ready ───
  useEffect(() => {
    console.log(`[RiderDash] joinRoute effect: isSocketReady=${isSocketReady}, routes.length=${routes.length}`);
    if (!isSocketReady || routes.length === 0) return

    console.log('[RiderDash] ✅ Joining', routes.length, 'route rooms:', routes.map(r => r._id));
    routes.forEach(r => socketService.joinRoute(r._id))

    return () => {
      routes.forEach(r => socketService.leaveRoute(r._id))
    }
  }, [isSocketReady, routes])

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
      <div className='flex items-center justify-center h-screen bg-slate-50'>
        <Loader2 className='w-8 h-8 text-teal-600 animate-spin' />
      </div>
    )
  }

  const mapBounds = getMapBounds()
  const mapCenter = userLocation || defaultCenter

  // Shared map content (reused in both mobile & desktop layouts)
  const mapContent = (
    <MapContainer
      center={mapCenter}
      zoom={13}
      className='h-full w-full'
      zoomControl={false}
      style={{ background: '#F8FAFB' }}
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
              color: '#0F766E',
              fillColor: '#0F766E',
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

      {/* Route polyline (preview / tracking) — use OSRM path if available */}
      {(view === 'preview' || view === 'tracking') &&
        selectedRoute &&
        (selectedRoute.path && selectedRoute.path.length > 1 ? (
          <Polyline
            positions={selectedRoute.path}
            color='#0D9488'
            weight={5}
            opacity={0.9}
          />
        ) : selectedRoute.stops?.length > 1 ? (
          <Polyline
            positions={selectedRoute.stops.map(
              s => [s.latitude, s.longitude] as [number, number]
            )}
            color='#0D9488'
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
              <div className='text-sm'>
                <div className='font-semibold text-slate-800'>
                  {stop.name}
                </div>
                <div className='text-slate-500'>
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
                  <div className='font-bold text-slate-800'>{bus.name}</div>
                  <div className='text-slate-500'>{getRouteName(bus)}</div>
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
                  <div className='font-bold text-slate-800'>
                    {selectedBus.name}
                  </div>
                  {live.speed && (
                    <div className='text-slate-500'>
                      {Math.round(live.speed)} km/h
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          )
        })()}
    </MapContainer>
  )

  // Shared panel content (reused in both mobile bottom sheet & desktop sidebar)
  const panelContent = (
    <>
      {view === 'select' && (
        <BusSelectView
          buses={buses}
          routes={routes}
          getRouteName={getRouteName}
          getLiveBusLocation={getLiveBusLocation}
          onSelectBus={handleSelectBus}
          user={user}
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
    </>
  )

  return (
    <div
      className={`h-screen flex flex-col bg-slate-50 relative overflow-hidden ${
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
      <header className='bg-white/90 backdrop-blur-xl border-b border-slate-200 px-4 lg:px-6 h-14 flex items-center gap-3 z-[120] shrink-0 relative shadow-sm'>
        {view !== 'select' ? (
          <button
            title='Back'
            onClick={handleBack}
            className='p-2 -ml-2 hover:bg-slate-100 rounded-xl transition-colors'
          >
            <ArrowLeft className='w-5 h-5 text-slate-800' />
          </button>
        ) : (
          <button
            title='Open Sidebar'
            onClick={() => setSidebarOpen(true)}
            className='p-2 -ml-2 hover:bg-slate-100 rounded-xl transition-colors'
          >
            <Menu className='w-5 h-5 text-slate-800' />
          </button>
        )}
        <div className='flex items-center gap-2 flex-1'>
          <div className='p-1.5 bg-teal-600 rounded-xl'>
            <Bus className='w-4 h-4 text-white' />
          </div>
          <h1 className='text-lg font-semibold font-bold text-slate-800 tracking-tight'>
            Safara
          </h1>
        </div>
        {/* Profile avatar in header for quick access */}
        {view === 'select' && (
          <button onClick={() => setSidebarOpen(true)} className='shrink-0'>
            <UserAvatar name={user?.name} avatar={user?.avatar} size='sm' />
          </button>
        )}
      </header>

      {/* ═══════════════════════════════════════════════════════════════
           DESKTOP LAYOUT (lg+): Side panel + full-height map
           ═══════════════════════════════════════════════════════════════ */}
      <div className='hidden lg:flex flex-1 min-h-0'>
        {/* Left Panel */}
        <aside className='w-[400px] xl:w-[420px] shrink-0 bg-white border-r border-slate-200 flex flex-col overflow-hidden'>
          <div className='flex-1 overflow-y-auto p-5'>
            {panelContent}
          </div>
        </aside>

        {/* Map — fills remaining space */}
        <div className='flex-1 relative'>
          {mapContent}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
           MOBILE LAYOUT (<lg): Map on top + bottom sheet
           ═══════════════════════════════════════════════════════════════ */}
      <div className='flex flex-col flex-1 lg:hidden min-h-0'>
        {/* ─── Map Area ───────────────────────────────────────────── */}
        <div
          className={`relative transition-all duration-300 ${
            view === 'tracking' && sheetExpanded ? 'h-[25vh]' : 'h-[45vh]'
          }`}
        >
          {mapContent}
        </div>

        {/* ─── Bottom Sheet ───────────────────────────────────────── */}
        <div
          className='flex-1 bg-white rounded-t-3xl -mt-4 relative z-10 shadow-lg flex flex-col overflow-hidden border-t border-slate-200'
        >
          {/* Drag handle */}
          <div
            className='flex justify-center pt-3 pb-2 cursor-pointer'
            onClick={() => setSheetExpanded(!sheetExpanded)}
          >
            <div className='w-10 h-1 bg-slate-300 rounded-full' />
          </div>

          {/* Sheet content */}
          <div className='flex-1 overflow-y-auto px-4 pb-4'>
            {panelContent}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Bus Select View (Screen 1) ─────────────────────────────────────────────
function BusSelectView ({
  buses,
  routes,
  getRouteName,
  getLiveBusLocation,
  onSelectBus,
  user
}: {
  buses: BusWithRoute[]
  routes: Route[]
  getRouteName: (bus: BusWithRoute) => string
  getLiveBusLocation: (busId: string) => BusLocation | undefined
  onSelectBus: (bus: BusWithRoute) => void
  user: ReturnType<typeof useAuthStore.getState>['user']
}) {
  const [showInactive, setShowInactive] = useState(false)
  // Split buses into live (active trip) and inactive
  const liveBuses = buses.filter(b => getLiveBusLocation(b._id))
  const inactiveBuses = buses.filter(b => !getLiveBusLocation(b._id))

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = user?.name?.split(' ')[0] || 'there'

  return (
    <div>
      {/* Greeting — gradient header */}
      <div className='bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 rounded-2xl p-5 mb-5 relative overflow-hidden'>
        <div className='absolute inset-0 opacity-[0.04]'
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
            backgroundSize: '16px 16px'
          }}
        />
        <div className='absolute -top-6 -right-6 w-24 h-24 border border-white/5 rounded-full' />
        <div className='relative z-10'>
          <p className='text-teal-400 text-xs font-medium'>{greeting}, {firstName} 👋</p>
          <h2 className='text-lg font-bold text-white mt-1'>Choose a bus to track</h2>
          <p className='text-xs text-slate-400 mt-1'>
            {liveBuses.length > 0
              ? `${liveBuses.length} bus${liveBuses.length > 1 ? 'es' : ''} live now across ${routes.length} routes`
              : 'No buses are currently active'}
          </p>
        </div>
      </div>

      {liveBuses.length === 0 && inactiveBuses.length === 0 ? (
        <div className='text-center py-12'>
          <div className='w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4'>
            <Bus className='w-7 h-7 text-slate-300' />
          </div>
          <p className='text-slate-500 font-medium'>No buses configured</p>
          <p className='text-slate-400 text-sm mt-1'>
            Contact your administrator to set up routes.
          </p>
        </div>
      ) : (
        <div className='space-y-3'>
          {/* Live buses */}
          {liveBuses.length === 0 ? (
            <div className='text-center py-8 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50'>
              <div className='w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto mb-3 shadow-sm'>
                <Bus className='w-6 h-6 text-slate-300' />
              </div>
              <p className='text-slate-500 font-medium text-sm'>No buses are active right now</p>
              <p className='text-slate-400 text-xs mt-1'>Try again later or check the schedule.</p>
            </div>
          ) : liveBuses.map(bus => {
            const routeName = getRouteName(bus)
            return (
              <button
                key={bus._id}
                onClick={() => onSelectBus(bus)}
                className='w-full flex items-center gap-4 p-4 rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50/50 to-teal-50/50 hover:from-teal-50 hover:to-emerald-50 hover:border-teal-300 transition-all duration-200 group shadow-sm'
              >
                <div className='w-12 h-10 bg-gradient-to-br from-teal-400 to-teal-600 rounded-xl flex items-center justify-center shrink-0 shadow-sm'>
                  <Bus className='w-5 h-5 text-white' />
                </div>
                <div className='flex-1 text-left min-w-0'>
                  <div className='font-bold text-slate-800 group-hover:text-teal-600 transition-colors truncate'>
                    {bus.name}
                  </div>
                  <div className='text-xs text-emerald-600 font-semibold mt-0.5 flex items-center gap-1'>
                    <span className='w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse inline-block' />
                    Live on route
                  </div>
                </div>
                {routeName && (
                  <span className='text-xs font-semibold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full shrink-0 border border-teal-100'>
                    {routeName}
                  </span>
                )}
                <ChevronRight className='w-4 h-4 text-slate-300 group-hover:text-teal-600 transition-colors shrink-0' />
              </button>
            )
          })}

          {/* Inactive buses — collapsed by default */}
          {inactiveBuses.length > 0 && (
            <div>
              <button
                onClick={() => setShowInactive(v => !v)}
                className='w-full flex items-center justify-between px-1 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider hover:text-slate-500 transition-colors'
              >
                <span>Offline buses ({inactiveBuses.length})</span>
                <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showInactive ? 'rotate-90' : ''}`} />
              </button>
              {showInactive && (
                <div className='space-y-2 mt-1'>
                  {inactiveBuses.map(bus => {
                    const routeName = getRouteName(bus)
                    return (
                      <div
                        key={bus._id}
                        className='w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 opacity-50'
                      >
                        <div className='w-10 h-9 bg-slate-100 rounded-lg flex items-center justify-center shrink-0'>
                          <Bus className='w-5 h-5 text-slate-400' />
                        </div>
                        <div className='flex-1 text-left min-w-0'>
                          <div className='font-semibold text-slate-500 text-sm truncate'>{bus.name}</div>
                          <div className='text-xs text-slate-400'>Not active</div>
                        </div>
                        {routeName && (
                          <span className='text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full shrink-0'>
                            {routeName}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
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
  const first = 0
  const last = stops.length - 1

  return (
    <div className='flex flex-col h-full'>
      {/* Route header */}
      <div className='mb-4'>
        <div className='text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5'>Route Preview</div>
        <h2 className='text-xl font-semibold font-bold text-slate-800'>
          {stops.length >= 2 ? `${stops[0].name} → ${stops[last].name}` : bus.name}
        </h2>
        <p className='text-xs text-slate-500 mt-1'>{stops.length} stops · {bus.name}</p>
      </div>

      {/* Timeline */}
      <div className='flex-1 overflow-y-auto'>
        <div className='relative pl-6'>
          {/* Connector line */}
          {stops.length > 1 && (
            <div
              className='absolute left-[11px] top-2 bottom-2 w-0.5 bg-teal-600/20'
              style={{ zIndex: 0 }}
            />
          )}

          {stops.map((stop, index) => (
            <div
              key={stop._id}
              className='relative flex items-start gap-4 mb-5 last:mb-0'
            >
              {/* Dot */}
              <div
                className={`absolute left-[-17px] top-1 w-4 h-4 rounded-full border-2 z-10 ${
                  index === first
                    ? 'bg-emerald-500 border-emerald-500 ring-4 ring-emerald-100'
                    : index === last
                    ? 'bg-accent border-accent ring-4 ring-accent-light'
                    : 'bg-slate-200 border-slate-200'
                }`}
              />

              {/* Stop info */}
              <div className='flex-1 min-w-0'>
                <div className={`font-semibold ${
                  index === first ? 'text-emerald-700' : index === last ? 'text-amber-700' : 'text-slate-800'
                }`}>{stop.name}</div>
                <div className='text-xs text-slate-500 mt-0.5'>
                  {index === first ? 'Origin' : index === last ? 'Destination' : `Stop ${stop.sequence + 1}`}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Track Live CTA */}
      <button
        onClick={onViewStops}
        className='bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors w-full mt-4 py-4 text-base rounded-2xl flex items-center justify-center gap-2'
      >
        <Bus className='w-5 h-5' />
        Track Live
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

  const remainingStops = stops.length - 1 - currentStopIndex

  return (
    <div className='flex flex-col h-full'>
      {/* Driver Info Card */}
      <div className='flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 mb-5'>
        <UserAvatar name={driver?.name || 'Driver'} size='md' />
        <div className='flex-1 min-w-0'>
          <div className='font-bold text-slate-800 text-sm'>
            {driver?.name || 'Unknown Driver'}
          </div>
          {driver?.phone ? (
            <a href={`tel:${driver.phone}`} className='text-xs text-teal-600 flex items-center gap-1 mt-0.5 hover:underline'>
              <Phone className='w-3 h-3' />
              {driver.phone}
            </a>
          ) : (
            <div className='text-xs text-slate-400 mt-0.5'>No contact info</div>
          )}
        </div>
        <div className='text-right shrink-0'>
          <div className='text-[10px] text-slate-400 font-bold uppercase tracking-wider'>ETA</div>
          <div className='text-2xl font-bold text-teal-600 tabular-nums leading-none mt-0.5'>
            {etaMinutes === 0 ? 'Now' : `${etaMinutes} min`}
          </div>
          <div className='text-[10px] text-slate-500 mt-0.5'>{remainingStops} stop{remainingStops !== 1 ? 's' : ''} left</div>
        </div>
      </div>

      {/* Route Timeline Header */}
      <div className='mb-3'>
        <div className='text-xs font-bold text-slate-400 uppercase tracking-wider'>Live Route</div>
        <h3 className='text-base font-semibold font-bold text-slate-800 mt-0.5'>
          {stops.length >= 2 ? `${stops[0].name} → ${stops[stops.length - 1].name}` : bus.name}
        </h3>
      </div>

      <div className='flex-1 overflow-y-auto'>
        <div className='relative pl-6'>
          {/* Progress line */}
          {stops.length > 1 && (
            <>
              {/* Completed portion (teal) */}
              <div
                className='absolute left-[11px] top-2 w-0.5 bg-teal-600'
                style={{
                  height: `${
                    (currentStopIndex / Math.max(stops.length - 1, 1)) * 100
                  }%`,
                  zIndex: 1
                }}
              />
              {/* Remaining portion (gray) */}
              <div
                className='absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-200'
                style={{ zIndex: 0 }}
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
                className='relative flex items-start gap-4 mb-6 last:mb-0'
              >
                {/* Dot */}
                <div
                  className={`absolute left-[-17px] top-1 w-4 h-4 rounded-full border-2 z-10 ${
                    isCurrent
                      ? 'bg-white border-teal-600 ring-4 ring-teal-500/10'
                      : isPassed
                      ? 'bg-teal-600 border-teal-600'
                      : 'bg-slate-200 border-slate-200'
                  }`}
                />

                {/* Stop info */}
                <div className='flex-1 min-w-0'>
                  <div
                    className={`font-semibold ${
                      isCurrent
                        ? 'text-slate-800 text-base'
                        : isPassed
                        ? 'text-slate-500'
                        : 'text-slate-800/80'
                    }`}
                  >
                    {stop.name}
                  </div>
                  {hasReminder && (
                    <div className='text-xs text-amber-600 font-medium mt-0.5 flex items-center gap-1'>
                      <BellIcon className='w-3 h-3' /> Alert {reminderData?.minutesBefore} min before
                    </div>
                  )}
                  {stop.estimatedArrivalTime && (
                    <div className='text-xs text-slate-400 mt-0.5'>
                      ETA: {stop.estimatedArrivalTime}
                    </div>
                  )}
                </div>

                {/* Reminder bell button */}
                {!isPassed && (
                  <div className='relative shrink-0'>
                    <button
                      className={`p-1.5 rounded-lg transition-colors ${
                        hasReminder
                          ? 'bg-amber-50 text-amber-600 hover:bg-amber-200'
                          : 'text-slate-200 hover:bg-slate-100 hover:text-slate-500'
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
                      <BellIcon className='w-4 h-4' />
                    </button>

                    {/* Reminder popup */}
                    {reminderPopup === stop._id && (
                      <div className='absolute right-0 left-auto top-10 z-30 bg-white rounded-xl shadow-lg border border-slate-200 p-3 w-56 max-w-[calc(100vw-2rem)]'>
                        <div className='text-sm font-semibold text-slate-800 mb-2'>
                          Set Alert
                        </div>
                        <p className='text-xs text-slate-500 mb-3'>
                          Get notified when the bus is approaching this stop.
                        </p>
                        <label className='block text-xs text-slate-500 mb-1'>
                          Minutes before arrival
                        </label>
                        <div className='flex gap-1 mb-3'>
                          {[2, 5, 10, 15].map(m => (
                            <button
                              key={m}
                              onClick={() => setReminderMinutes(m)}
                              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                                reminderMinutes === m
                                  ? 'bg-teal-600 text-white'
                                  : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                              }`}
                            >
                              {m} min
                            </button>
                          ))}
                        </div>
                        <div className='flex gap-2'>
                          <button
                            onClick={() =>
                              handleSetReminder(stop._id, reminderMinutes)
                            }
                            disabled={savingReminder}
                            className='flex-1 py-2 text-xs font-medium bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors'
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
                              className='px-3 py-2 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors'
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
    { icon: BellIcon, label: 'Notifications', path: '/notifications' }
  ]

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-ink/30 backdrop-blur-sm z-[100] transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 left-0 bottom-0 w-[280px] bg-white z-[110] shadow-xl transform transition-transform duration-300 ease-out flex flex-col ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header / Profile area */}
        <div className='bg-teal-600 px-5 pt-12 pb-6 relative'>
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
            <span className='inline-block text-xs font-medium text-white/90 bg-white/20 px-2.5 py-0.5 rounded-full capitalize'>
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
              className='w-full flex items-center gap-4 px-5 py-3.5 text-left hover:bg-slate-100 transition-colors group'
            >
              <Icon className='w-5 h-5 text-slate-400 group-hover:text-teal-600 transition-colors' />
              <span className='flex-1 text-sm font-medium text-slate-800/80 group-hover:text-slate-800 transition-colors'>
                {label}
              </span>
              <ChevronRight className='w-4 h-4 text-slate-200 group-hover:text-slate-500 transition-colors' />
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className='border-t border-slate-200 p-4'>
          <button
            title='Logout'
            onClick={() => {
              onLogout()
              onClose()
            }}
            className='w-full flex items-center gap-3 px-3 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors group'
          >
            <LogOut className='w-5 h-5' />
            <span className='text-sm font-medium'>Log out</span>
          </button>
        </div>

        {/* App version */}
        <div className='px-5 pb-4 text-center'>
          <span className='text-xs text-slate-400 font-medium'>Safara v1.0.0</span>
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
