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
      <div className="">
        <Loader2 className="" />
      </div>
    );
  }

  return (
    <div className="">
      {/* Header */}
      <div className="">
        <h1 className="">
          Driver Dashboard
        </h1>
        <p className="">
          Welcome back, {user?.name}
        </p>
      </div>

      {/* No Bus Assigned */}
      {!assignedBus && (
        <div className="">
          <div className="">
            <AlertCircle className="" />
            <div>
              <h3 className="">No Bus Assigned</h3>
              <p className="">
                You don't have a bus assigned to you yet. Please contact your administrator.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Assigned Bus */}
      {assignedBus && (
        <div className="">
          <h2 className="">
            <Bus className="" />
            Your Assigned Bus
          </h2>
          <div className="">
            <div className="">
              <div className="">Bus Name</div>
              <div className="">{assignedBus.name}</div>
            </div>
            <div className="">
              <div className="">Plate Number</div>
              <div className="">{assignedBus.plateNumber}</div>
            </div>
            <div className="">
              <div className="">Capacity</div>
              <div className="">{assignedBus.capacity} seats</div>
            </div>
            <div className="">
              <div className="">Route</div>
              <div className="">
                <RouteIcon className="" />
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
        <div className="">
          {currentTrip ? (
            <div className="">
              <div>
                <div className="">
                  <span className=""></span>
                  <span className="">Trip in Progress</span>
                </div>
                <p className="">
                  You have an active trip. Continue broadcasting your location.
                </p>
              </div>
              <Link to="/driver/trip" className="">
                <Navigation className="" />
                View Trip
              </Link>
            </div>
          ) : (
            <div className="">
              <div>
                <h3 className="">Ready to start?</h3>
                <p className="">
                  Begin your trip to start sharing your location with riders.
                </p>
              </div>
              <Link to="/driver/trip" className="">
                <Navigation className="" />
                Start Trip
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Recent Trips */}
      <div className="">
        <h2 className="">
          <Clock className="" />
          Recent Trips
        </h2>

        {recentTrips.length === 0 ? (
          <p className="">No trips yet</p>
        ) : (
          <div className="">
            {recentTrips.map((trip) => (
              <div
                key={trip._id}
                className=""
              >
                <div className="">
                  <div className={`w-2 h-2 rounded-full ${
                    trip.status === 'ongoing' ? 'bg-green-500' : 'bg-slate-500'
                  }`} />
                  <div>
                    <div className="">
                      {typeof trip.routeId === 'object' 
                        ? (trip.routeId as { name: string }).name 
                        : 'Unknown Route'}
                    </div>
                    <div className="">
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

