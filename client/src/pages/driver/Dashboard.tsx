import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bus, Route as RouteIcon, Navigation, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { tripsApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import type { Bus as BusType, Trip } from '../../types';

export default function DriverDashboard() {
  const [assignedBus, setAssignedBus] = useState<BusType | null>(null);
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);
  const [recentTrips, setRecentTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [busRes, tripRes, recentRes] = await Promise.all([
        tripsApi.getMyBus().catch(() => ({ data: { data: null } })),
        tripsApi.getCurrent(),
        tripsApi.getMyTrips({ limit: 5 }),
      ]);

      setAssignedBus(busRes.data.data);
      setCurrentTrip(tripRes.data.data);
      setRecentTrips(recentRes.data.data);
    } catch (error) {
      console.error('Failed to load data:', error);
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

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-white mb-2">
          Driver Dashboard
        </h1>
        <p className="text-slate-400">
          Welcome back, {user?.name}
        </p>
      </div>

      {/* No Bus Assigned */}
      {!assignedBus && (
        <div className="card bg-amber-500/10 border-amber-500/20 mb-8">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-amber-400 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-amber-400 mb-1">No Bus Assigned</h3>
              <p className="text-slate-300 text-sm">
                You don't have a bus assigned to you yet. Please contact your administrator.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Assigned Bus */}
      {assignedBus && (
        <div className="card mb-8">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Bus className="w-5 h-5 text-primary-400" />
            Your Assigned Bus
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-800/50 rounded-lg">
              <div className="text-sm text-slate-400 mb-1">Bus Name</div>
              <div className="text-lg font-semibold text-white">{assignedBus.name}</div>
            </div>
            <div className="p-4 bg-slate-800/50 rounded-lg">
              <div className="text-sm text-slate-400 mb-1">Plate Number</div>
              <div className="text-lg font-semibold text-white">{assignedBus.plateNumber}</div>
            </div>
            <div className="p-4 bg-slate-800/50 rounded-lg">
              <div className="text-sm text-slate-400 mb-1">Capacity</div>
              <div className="text-lg font-semibold text-white">{assignedBus.capacity} seats</div>
            </div>
            <div className="p-4 bg-slate-800/50 rounded-lg">
              <div className="text-sm text-slate-400 mb-1">Route</div>
              <div className="text-lg font-semibold text-white flex items-center gap-2">
                <RouteIcon className="w-4 h-4 text-primary-400" />
                {typeof assignedBus.routeId === 'object' 
                  ? (assignedBus.routeId as { name: string }).name 
                  : 'Not assigned'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Current Trip / Start Trip */}
      {assignedBus && (
        <div className="card mb-8 bg-gradient-to-r from-primary-600/20 to-accent-600/20 border-primary-500/30">
          {currentTrip ? (
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="text-sm font-medium text-green-400">Trip in Progress</span>
                </div>
                <p className="text-slate-300">
                  You have an active trip. Continue broadcasting your location.
                </p>
              </div>
              <Link to="/driver/trip" className="btn btn-primary">
                <Navigation className="w-5 h-5" />
                View Trip
              </Link>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Ready to start?</h3>
                <p className="text-slate-300">
                  Begin your trip to start sharing your location with riders.
                </p>
              </div>
              <Link to="/driver/trip" className="btn btn-primary">
                <Navigation className="w-5 h-5" />
                Start Trip
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Recent Trips */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary-400" />
          Recent Trips
        </h2>

        {recentTrips.length === 0 ? (
          <p className="text-slate-400 text-center py-8">No trips yet</p>
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
                      {new Date(trip.startTime).toLocaleDateString()} at{' '}
                      {new Date(trip.startTime).toLocaleTimeString()}
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
  );
}
