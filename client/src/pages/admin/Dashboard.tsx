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
      <div className="">
        <Loader2 className="" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="">
        <p className="">Failed to load dashboard</p>
      </div>
    );
  }

  const liveLocations = stats.liveLocations || [];
  const mapCenter: [number, number] = liveLocations.length > 0
    ? [liveLocations[0].latitude, liveLocations[0].longitude]
    : [31.5204, 74.3587]; // Default to Lahore

  return (
    <div className="">
      <h1 className="">Dashboard</h1>

      {/* Stats Grid */}
      <div className="">
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
      <div className="">
        {/* Live Map */}
        <div className="">
          <div className="">
            <h2 className="">
              <Navigation className="" />
              Live Buses
            </h2>
            <span className="">
              {liveLocations.length} active
            </span>
          </div>

          <div className="">
            <MapContainer
              center={mapCenter}
              zoom={12}
              className=""
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
                    <div className="">
                      <div className="">Bus {bus.busId.slice(-6)}</div>
                      {bus.speed && <div>{Math.round(bus.speed)} km/h</div>}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>

        {/* Recent Trips */}
        <div className="">
          <div className="">
            <h2 className="">
              <Clock className="" />
              Recent Trips
            </h2>
            <span className="">
              {stats.trips.today} today
            </span>
          </div>

          {recentTrips.length === 0 ? (
            <p className="">No recent trips</p>
          ) : (
            <div className="">
              {recentTrips.map((trip) => (
                <div
                  key={trip._id}
                  className=""
                >
                  <div className="">
                    <div className={`w-2 h-2 rounded-full ${
                      trip.status === 'ongoing' ? 'bg-green-500' : 'bg-content-secondary'
                    }`} />
                    <div>
                      <div className="">
                        {typeof trip.routeId === 'object'
                          ? (trip.routeId as { name: string }).name
                          : 'Unknown Route'}
                      </div>
                      <div className="">
                        {typeof trip.driverId === 'object'
                          ? (trip.driverId as { name: string }).name
                          : 'Unknown Driver'}
                      </div>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    trip.status === 'ongoing'
                      ? 'bg-green-50 text-green-600 font-medium'
                      : 'bg-app-bg text-content-secondary border border-ui-border'
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
      <div className="">
        <Link to="/admin/users" className="">
          <div className="">
            <div className="">
              <div className="">
                <Users className="" />
              </div>
              <span className="">Manage Users</span>
            </div>
            <ChevronRight className="" />
          </div>
        </Link>
        <Link to="/admin/routes" className="">
          <div className="">
            <div className="">
              <div className="">
                <RouteIcon className="" />
              </div>
              <span className="">Manage Routes</span>
            </div>
            <ChevronRight className="" />
          </div>
        </Link>
        <Link to="/admin/buses" className="">
          <div className="">
            <div className="">
              <div className="">
                <Bus className="" />
              </div>
              <span className="">Manage Buses</span>
            </div>
            <ChevronRight className="" />
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
    primary: 'bg-primary/10 text-primary',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
    accent: 'bg-primary/10 text-primary',
  };

  const content = (
    <div className={`card shadow-sm ${link ? 'hover:border-primary/30 transition-all' : ''}`}>
      <div className="">
        <div className={`p-2 rounded-lg ${colors[color]}`}>
          <Icon className="" />
        </div>
        {link && <ChevronRight className="" />}
      </div>
      <div className="">{value}</div>
      <div className="">{label}</div>
      {subValue && <div className="">{subValue}</div>}
    </div>
  );

  if (link) {
    return <Link to={link}>{content}</Link>;
  }
  return content;
}

