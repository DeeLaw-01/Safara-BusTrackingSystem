import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Navigation, ChevronRight, Loader2, Bus } from 'lucide-react';
import { routesApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import type { Route } from '../../types';

export default function RiderHome() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to onboarding if no home stop set
    if (user && !user.homeStop) {
      navigate('/onboarding');
      return;
    }

    loadRoutes();
  }, [user, navigate]);

  const loadRoutes = async () => {
    try {
      const { data } = await routesApi.getAll(true);
      setRoutes(data.data);
    } catch (error) {
      console.error('Failed to load routes:', error);
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
          Good {getGreeting()}, {user?.name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-slate-400">
          Track your bus in real-time
        </p>
      </div>

      {/* Quick Action Card */}
      <div className="card mb-8 bg-gradient-to-r from-primary-600 to-primary-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white mb-1">
              Ready to track?
            </h2>
            <p className="text-primary-100">
              Select a route below to see live bus locations
            </p>
          </div>
          <div className="p-4 bg-white/10 rounded-xl">
            <Navigation className="w-8 h-8 text-white" />
          </div>
        </div>
      </div>

      {/* Routes List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary-400" />
          Available Routes
        </h2>

        {routes.length === 0 ? (
          <div className="card text-center py-12">
            <Bus className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No routes available yet</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {routes.map((route) => (
              <Link
                key={route._id}
                to={`/track/${route._id}`}
                className="card hover:bg-slate-800/50 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary-600/20 rounded-xl">
                      <Bus className="w-6 h-6 text-primary-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white group-hover:text-primary-400 transition-colors">
                        {route.name}
                      </h3>
                      {route.description && (
                        <p className="text-sm text-slate-400">{route.description}</p>
                      )}
                      <p className="text-sm text-slate-500 mt-1">
                        {route.stops?.length || 0} stops
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-primary-400 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}
