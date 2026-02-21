import { useEffect, useState } from 'react';
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
  ChevronRight
} from 'lucide-react';
import { adminApi } from '@/services/api'
import type { DashboardStats, Trip, BusLocation } from '@/types'
import 'leaflet/dist/leaflet.css';

// Custom bus icon
const busIcon = L.divIcon({
  className: 'bus-marker',
  html: `<div class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
    <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
      <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10z"/>
    </svg>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTrips, setRecentTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000); // Refresh every 10s for live bus accuracy
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, tripsRes] = await Promise.all([
        adminApi.getDashboard(),
        adminApi.getRecentTrips(5),
      ]);
      setStats(statsRes.data.data);
      setRecentTrips(tripsRes.data.data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Failed to load dashboard</p>
      </div>
    );
  }

  const liveLocations = stats.liveLocations || [];
  const mapCenter: [number, number] = liveLocations.length > 0
    ? [liveLocations[0].latitude, liveLocations[0].longitude]
    : [31.5204, 74.3587]; // Default to Lahore

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold text-white">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Total Users"
          value={stats.users.total}
          subValue={`${stats.users.riders} riders, ${stats.users.drivers} drivers`}
          color="primary"
        />
        <StatCard
          icon={UserCheck}
          label="Pending Drivers"
          value={stats.users.pendingDrivers}
          subValue="Awaiting approval"
          color="amber"
          link="/admin/users"
        />
        <StatCard
          icon={Bus}
          label="Active Buses"
          value={stats.buses.live}
          subValue={`of ${stats.buses.total} total`}
          color="green"
        />
        <StatCard
          icon={RouteIcon}
          label="Active Routes"
          value={stats.routes.active}
          subValue={`of ${stats.routes.total} total`}
          color="accent"
        />
      </div>

      {/* Live Map & Recent Trips */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Live Map */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Navigation className="w-5 h-5 text-primary-400" />
              Live Buses
            </h2>
            <span className="text-sm text-slate-400">
              {liveLocations.length} active
            </span>
          </div>

          <div className="h-64 rounded-lg overflow-hidden">
            <MapContainer
              center={mapCenter}
              zoom={12}
              className="h-full w-full"
              zoomControl={false}
            >
              <TileLayer
                attribution='&copy; OpenStreetMap'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {liveLocations.map((bus: BusLocation) => (
                <Marker
                  key={bus.busId}
                  position={[bus.latitude, bus.longitude]}
                  icon={busIcon}
                >
                  <Popup>
                    <div className="text-sm">
                      <div className="font-semibold">Bus {bus.busId.slice(-6)}</div>
                      {bus.speed && <div>{Math.round(bus.speed)} km/h</div>}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>

        {/* Recent Trips */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary-400" />
              Recent Trips
            </h2>
            <span className="text-sm text-slate-400">
              {stats.trips.today} today
            </span>
          </div>

          {recentTrips.length === 0 ? (
            <p className="text-slate-400 text-center py-8">No recent trips</p>
          ) : (
            <div className="space-y-3">
              {recentTrips.map((trip) => (
                <div
                  key={trip._id}
                  className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      trip.status === 'ongoing' ? 'bg-green-500' : 'bg-slate-500'
                    }`} />
                    <div>
                      <div className="text-sm font-medium text-white">
                        {typeof trip.routeId === 'object'
                          ? (trip.routeId as { name: string }).name
                          : 'Unknown Route'}
                      </div>
                      <div className="text-xs text-slate-400">
                        {typeof trip.driverId === 'object'
                          ? (trip.driverId as { name: string }).name
                          : 'Unknown Driver'}
                      </div>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    trip.status === 'ongoing'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-slate-700 text-slate-400'
                  }`}>
                    {trip.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Link to="/admin/users" className="card hover:bg-slate-800/50 transition-colors group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-600/20 rounded-lg">
                <Users className="w-5 h-5 text-primary-400" />
              </div>
              <span className="font-medium text-white">Manage Users</span>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-primary-400" />
          </div>
        </Link>
        <Link to="/admin/routes" className="card hover:bg-slate-800/50 transition-colors group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent-600/20 rounded-lg">
                <RouteIcon className="w-5 h-5 text-accent-400" />
              </div>
              <span className="font-medium text-white">Manage Routes</span>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-accent-400" />
          </div>
        </Link>
        <Link to="/admin/buses" className="card hover:bg-slate-800/50 transition-colors group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-600/20 rounded-lg">
                <Bus className="w-5 h-5 text-green-400" />
              </div>
              <span className="font-medium text-white">Manage Buses</span>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-green-400" />
          </div>
        </Link>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number;
  subValue?: string;
  color: 'primary' | 'green' | 'amber' | 'accent';
  link?: string;
}

function StatCard({ icon: Icon, label, value, subValue, color, link }: StatCardProps) {
  const colors = {
    primary: 'bg-primary-600/20 text-primary-400',
    green: 'bg-green-600/20 text-green-400',
    amber: 'bg-amber-600/20 text-amber-400',
    accent: 'bg-accent-600/20 text-accent-400',
  };

  const content = (
    <div className={`card ${link ? 'hover:bg-slate-800/50 transition-colors' : ''}`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2 rounded-lg ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        {link && <ChevronRight className="w-5 h-5 text-slate-500" />}
      </div>
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-slate-400">{label}</div>
      {subValue && <div className="text-xs text-slate-500 mt-1">{subValue}</div>}
    </div>
  );

  if (link) {
    return <Link to={link}>{content}</Link>;
  }
  return content;
}
