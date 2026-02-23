import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { 
  Users, 
  Bus, 
  Route as RouteIcon, 
  Navigation,
  Clock,
  UserCheck,
  Loader2,
  ArrowUpRight,
  MapPin,
  Activity,
  Cpu,
  Zap
} from 'lucide-react';
import { adminApi } from '@/services/api'
import { socketService } from '@/services/socket'
import { useAuthStore } from '@/store/authStore'
import type { DashboardStats, Trip, BusLocation } from '@/types'
import 'leaflet/dist/leaflet.css';

// Custom bus icon
const busIcon = L.divIcon({
  className: 'bus-marker',
  html: `<div style="
    width: 32px; height: 32px; background: linear-gradient(135deg, #0d9488, #0f766e);
    border-radius: 12px; display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 12px rgba(15,118,110,0.3); border: 2px solid white;
  ">
    <svg style="width: 16px; height: 16px; color: white;" fill="currentColor" viewBox="0 0 24 24">
      <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10z"/>
    </svg>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTrips, setRecentTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [liveBusMap, setLiveBusMap] = useState<Map<string, BusLocation>>(new Map());

  const updateBusLocation = useCallback((loc: BusLocation) => {
    setLiveBusMap(prev => { const next = new Map(prev); next.set(loc.busId, loc); return next; });
  }, []);

  const removeBus = useCallback((busId: string) => {
    setLiveBusMap(prev => { const next = new Map(prev); next.delete(busId); return next; });
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) socketService.connect(token);
    const unsubLocation = socketService.onBusLocation(updateBusLocation);
    const unsubTripEnded = socketService.onTripEnded((data) => removeBus(data.busId));
    return () => { unsubLocation(); unsubTripEnded(); };
  }, [updateBusLocation, removeBus]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, tripsRes] = await Promise.all([
        adminApi.getDashboard(),
        adminApi.getRecentTrips(5),
      ]);
      const data: DashboardStats = statsRes.data.data;
      setStats(data);
      setRecentTrips(tripsRes.data.data);
      if (data.liveLocations?.length) {
        setLiveBusMap(prev => {
          const next = new Map(prev);
          data.liveLocations.forEach(loc => { if (!next.has(loc.busId)) next.set(loc.busId, loc); });
          return next;
        });
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
          <span className="text-sm text-slate-400">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Failed to load dashboard data.</p>
      </div>
    );
  }

  const liveLocations = Array.from(liveBusMap.values());
  const mapCenter: [number, number] = liveLocations.length > 0
    ? [liveLocations[0].latitude, liveLocations[0].longitude]
    : [31.5204, 74.3587];

  const firstName = user?.name?.split(' ')[0] || 'Admin';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // Chart data derived from stats
  const totalUsers = stats.users.total || 1;
  const riderPct = Math.round((stats.users.riders / totalUsers) * 100);
  const driverPct = Math.round((stats.users.drivers / totalUsers) * 100);
  const adminPct = 100 - riderPct - driverPct;

  return (
    <div className="space-y-6 stagger-children">

      {/* ── Welcome Banner with Digital Effects ── */}
      <div className="relative bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-500 animated-gradient rounded-2xl p-6 lg:p-8 text-white overflow-hidden scan-line-overlay">
        {/* Digital grid overlay */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}
        />
        {/* Floating particles */}
        <div className="absolute top-6 right-12 float-particle">
          <Cpu className="w-8 h-8 text-white/10" />
        </div>
        <div className="absolute bottom-4 right-32 float-particle-delay">
          <Zap className="w-6 h-6 text-white/10" />
        </div>
        <div className="absolute top-4 right-64 float-particle">
          <Activity className="w-10 h-10 text-white/5" />
        </div>
        
        <div className="relative z-10">
          <p className="text-white/70 text-sm mb-1">{greeting},</p>
          <h2
            className="text-2xl lg:text-3xl font-bold mb-2 glitch-text"
            data-text={`${firstName} 👋`}
          >
            {firstName} 👋
          </h2>
          <p className="text-white/60 text-sm max-w-lg">
            Here's what's happening with your bus tracking system today. All systems operational.
          </p>
          {/* Status indicators */}
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-1.5 text-xs text-white/70">
              <div className="w-2 h-2 bg-emerald-300 rounded-full pulse-live" />
              System Online
            </div>
            <div className="flex items-center gap-1.5 text-xs text-white/70">
              <Activity className="w-3.5 h-3.5" />
              {liveLocations.length} live connections
            </div>
          </div>
        </div>
      </div>

      {/* ── Stat Cards with Mini Charts ── */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Total Users"
          value={stats.users.total}
          subValue={`${stats.users.riders} riders · ${stats.users.drivers} drivers`}
          accent="teal"
          chart={<MiniBarChart values={[riderPct, driverPct, adminPct]} colors={['#0d9488', '#f59e0b', '#6366f1']} />}
        />
        <StatCard
          icon={UserCheck}
          label="Pending Drivers"
          value={stats.users.pendingDrivers}
          subValue="Awaiting approval"
          accent="amber"
          link="/admin/users"
          chart={<MiniDonut value={stats.users.pendingDrivers} max={stats.users.drivers || 1} color="#f59e0b" />}
        />
        <StatCard
          icon={Bus}
          label="Live Trips"
          value={stats.trips.ongoing}
          subValue={`${stats.buses.active} buses enabled`}
          accent="emerald"
          chart={<MiniBarChart values={[stats.trips.ongoing * 20, stats.trips.today * 10, 60, 40]} colors={['#10b981', '#10b981', '#d1fae5', '#d1fae5']} />}
        />
        <StatCard
          icon={RouteIcon}
          label="Active Routes"
          value={stats.routes.active}
          subValue={`of ${stats.routes.total} total`}
          accent="blue"
          chart={<MiniDonut value={stats.routes.active} max={stats.routes.total || 1} color="#3b82f6" />}
        />
      </div>

      {/* ── Map + Trips + User Breakdown Grid ── */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Live Map — wider */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-teal-50 rounded-xl flex items-center justify-center">
                <MapPin className="w-4.5 h-4.5 text-teal-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Live Bus Map</h3>
                <p className="text-xs text-slate-400">{liveLocations.length} active now</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full pulse-live" />
              Live
            </div>
          </div>
          <div className="h-[380px]">
            <MapContainer center={mapCenter} zoom={12} className="h-full w-full" zoomControl={false}>
              <TileLayer
                attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                url='https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
              />
              {liveLocations.map((bus: BusLocation) => (
                <Marker key={bus.busId} position={[bus.latitude, bus.longitude]} icon={busIcon}>
                  <Popup>
                    <div className="p-1 min-w-[100px]">
                      <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Live Bus</div>
                      <div className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                        <Bus className="w-3.5 h-3.5 text-teal-600" />
                        ID: {bus.busId.slice(-6)}
                      </div>
                      {bus.speed !== undefined && (
                        <div className="flex items-center gap-1 text-xs font-medium text-teal-600">
                          <Navigation className="w-3 h-3" />
                          {Math.round(bus.speed)} km/h
                        </div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>

        {/* Right column: Recent Trips + User Breakdown */}
        <div className="space-y-6">

          {/* Recent Trips */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                  <Clock className="w-4 h-4 text-amber-600" />
                </div>
                <h3 className="text-sm font-semibold text-slate-800">Recent Trips</h3>
              </div>
              <span className="text-xs text-slate-400">{stats.trips.today} today</span>
            </div>
            <div className="p-3 max-h-[240px] overflow-y-auto">
              {recentTrips.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">No recent trips</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {recentTrips.map((trip) => (
                    <div key={trip._id} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${
                          trip.status === 'ongoing' ? 'bg-emerald-500 pulse-live' : 'bg-slate-300'
                        }`} />
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-slate-700 truncate">
                            {typeof trip.routeId === 'object' ? (trip.routeId as { name: string }).name : 'Unknown Route'}
                          </div>
                          <div className="text-xs text-slate-400">
                            {typeof trip.driverId === 'object' ? (trip.driverId as { name: string }).name : 'Unknown'}
                          </div>
                        </div>
                      </div>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                        trip.status === 'ongoing' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {trip.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* User Breakdown Donut */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">User Breakdown</h3>
            <div className="flex items-center gap-6">
              <div className="relative w-20 h-20 shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#f1f5f9" strokeWidth="10" />
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#0d9488" strokeWidth="10"
                    strokeDasharray={`${riderPct * 2.39} 239`}
                    className="donut-ring" style={{ '--circumference': '239', '--offset': `${239 - riderPct * 2.39}` } as React.CSSProperties}
                  />
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#f59e0b" strokeWidth="10"
                    strokeDasharray={`${driverPct * 2.39} 239`}
                    strokeDashoffset={`-${riderPct * 2.39}`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-base font-bold text-slate-800">{totalUsers}</span>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-teal-500" />
                  <span className="text-slate-600">Riders ({stats.users.riders})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-amber-500" />
                  <span className="text-slate-600">Drivers ({stats.users.drivers})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-indigo-500" />
                  <span className="text-slate-600">Admins ({totalUsers - stats.users.riders - stats.users.drivers})</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { to: '/admin/users', icon: Users, label: 'Manage Users', desc: 'View and manage all users', color: 'teal' as const },
          { to: '/admin/routes', icon: RouteIcon, label: 'Manage Routes', desc: 'Configure bus routes', color: 'blue' as const },
          { to: '/admin/buses', icon: Bus, label: 'Manage Buses', desc: 'Track and assign buses', color: 'amber' as const },
        ].map(({ to, icon: Icon, label, desc, color }) => {
          const colorMap = {
            teal: 'bg-teal-50 text-teal-600 group-hover:bg-teal-100',
            blue: 'bg-blue-50 text-blue-600 group-hover:bg-blue-100',
            amber: 'bg-amber-50 text-amber-600 group-hover:bg-amber-100',
          };
          return (
            <Link key={to} to={to} className="group bg-white rounded-2xl border border-slate-200 p-5 hover:border-teal-200 hover:shadow-md transition-all duration-200">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${colorMap[color]}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-teal-500 transition-colors" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800 mb-0.5">{label}</h3>
              <p className="text-xs text-slate-400">{desc}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MINI CHART COMPONENTS
   ═══════════════════════════════════════════════════════════ */

function MiniBarChart({ values, colors }: { values: number[]; colors: string[] }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-end gap-1 h-8">
      {values.map((v, i) => (
        <div
          key={i}
          className="w-2 rounded-sm chart-bar"
          style={{ '--bar-height': `${Math.max((v / max) * 100, 8)}%`, backgroundColor: colors[i % colors.length] } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

function MiniDonut({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  const circumference = 2 * Math.PI * 14;
  const offset = circumference - (pct / 100) * circumference;
  return (
    <svg viewBox="0 0 36 36" className="w-9 h-9 -rotate-90">
      <circle cx="18" cy="18" r="14" fill="none" stroke="#f1f5f9" strokeWidth="3" />
      <circle
        cx="18" cy="18" r="14" fill="none" stroke={color} strokeWidth="3"
        strokeDasharray={`${circumference}`}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="donut-ring"
        style={{ '--circumference': `${circumference}`, '--offset': `${offset}` } as React.CSSProperties}
      />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════
   STAT CARD
   ═══════════════════════════════════════════════════════════ */
interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number;
  subValue?: string;
  accent: 'teal' | 'amber' | 'emerald' | 'blue';
  link?: string;
  chart?: React.ReactNode;
}

function StatCard({ icon: Icon, label, value, subValue, accent, link, chart }: StatCardProps) {
  const accentMap = {
    teal:    { bg: 'bg-teal-50', text: 'text-teal-600', border: 'border-l-teal-500' },
    amber:   { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-l-amber-500' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-l-emerald-500' },
    blue:    { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-l-blue-500' },
  };
  const a = accentMap[accent];

  const content = (
    <div className={`bg-white rounded-2xl border border-slate-200 border-l-4 ${a.border} p-5 shadow-sm ${
      link ? 'hover:shadow-md hover:border-slate-300 transition-all cursor-pointer' : ''
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${a.bg}`}>
          <Icon className={`w-5 h-5 ${a.text}`} />
        </div>
        {chart}
      </div>
      <div className="text-3xl font-bold text-slate-900 shimmer-text mb-0.5">{value}</div>
      <div className="text-sm font-medium text-slate-600">{label}</div>
      {subValue && <div className="text-xs text-slate-400 mt-0.5">{subValue}</div>}
    </div>
  );

  return link ? <Link to={link}>{content}</Link> : content;
}
