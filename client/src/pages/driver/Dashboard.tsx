import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bus, Route as RouteIcon, Navigation, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { tripsApi } from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import { socketService } from '@/services/socket'
import type { Bus as BusType, Trip } from '@/types'

export default function DriverDashboard() {
  const [assignedBus, setAssignedBus] = useState<BusType | null>(null);
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);
  const [recentTrips, setRecentTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    loadData();

    // Listen for trip end events (when trip is ended by driver or admin)
    const unsubTripEnded = socketService.onTripEnded((data) => {
      console.log('Trip ended event received:', data);
      // Refresh trip data immediately
      loadData();
    });

    // Periodic refresh as fallback (every 10 seconds)
    const refreshInterval = setInterval(() => {
      loadData();
    }, 10000);

    return () => {
      unsubTripEnded();
      clearInterval(refreshInterval);
    };
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
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden min-h-screen bg-slate-50">
      {/* Subtle Parallax Background */}
      <div className='parallax-bg'>
        <div className='parallax-shape parallax-shape-1' style={{ opacity: 0.04 }} />
        <div className='parallax-shape parallax-shape-2' style={{ opacity: 0.03 }} />
      </div>

      <div className="max-w-4xl mx-auto p-4 lg:p-8 relative z-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold font-bold text-slate-800 mb-2">
          Driver Dashboard
        </h1>
        <p className="text-slate-500">
          Welcome back, {user?.name}
        </p>
      </div>

      {/* No Bus Assigned */}
      {!assignedBus && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 bg-amber-50 border-amber-200 mb-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-amber-600 mb-1">No Bus Assigned</h3>
              <p className="text-slate-500 text-sm">
                You don't have a bus assigned to you yet. Please contact your administrator.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Assigned Bus */}
      {assignedBus && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-6">
          <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Bus className="w-5 h-5 text-teal-600" />
            Your Assigned Bus
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-sm text-slate-500 mb-1">Bus Name</div>
              <div className="text-lg font-semibold text-slate-800">{assignedBus.name}</div>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-sm text-slate-500 mb-1">Plate Number</div>
              <div className="text-lg font-semibold text-slate-800">{assignedBus.plateNumber}</div>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-sm text-slate-500 mb-1">Capacity</div>
              <div className="text-lg font-semibold text-slate-800">{assignedBus.capacity} seats</div>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-sm text-slate-500 mb-1">Route</div>
              <div className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <RouteIcon className="w-4 h-4 text-teal-600" />
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
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-6 bg-gradient-to-r from-teal-600-50 to-teal-600-light/30 border-teal-600/20">
          {currentTrip ? (
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                  <span className="text-sm font-medium text-emerald-600">Trip in Progress</span>
                </div>
                <p className="text-slate-500">
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
                <h3 className="text-lg font-semibold text-slate-800 mb-1">Ready to start?</h3>
                <p className="text-slate-500">
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
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-teal-600" />
          Recent Trips
        </h2>

        {recentTrips.length === 0 ? (
          <p className="text-slate-500 text-center py-8">No trips yet</p>
        ) : (
          <div className="space-y-3">
            {recentTrips.map((trip) => (
              <div
                key={trip._id}
                className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    trip.status === 'ongoing' ? 'bg-emerald-500' : 'bg-slate-400'
                  }`} />
                  <div>
                    <div className="text-sm font-medium text-slate-800">
                      {typeof trip.routeId === 'object' 
                        ? (trip.routeId as { name: string }).name 
                        : 'Unknown Route'}
                    </div>
                    <div className="text-xs text-slate-500">
                      {new Date(trip.startTime).toLocaleDateString()} at{' '}
                      {new Date(trip.startTime).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  trip.status === 'ongoing'
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-slate-100 text-slate-500'
                }`}>
                  {trip.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
