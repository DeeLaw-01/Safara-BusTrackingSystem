import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Loader2, ChevronRight, Check } from 'lucide-react';
import { routesApi, userApi } from '@/services/api'
import type { Route, Stop } from '@/types'

export default function Onboarding() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [selectedStop, setSelectedStop] = useState<Stop | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadRoutes();
  }, []);

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

  const handleSave = async () => {
    if (!selectedStop) return;

    setSaving(true);
    try {
      await userApi.setHomeStop(selectedStop._id);
      navigate('/');
    } catch (error) {
      console.error('Failed to set home stop:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-4">
      <div className="max-w-lg mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-display font-bold text-white mb-2">
            Select Your Stop
          </h1>
          <p className="text-slate-400">
            Choose your usual boarding stop so we can show you relevant routes
          </p>
        </div>

        {/* Step 1: Select Route */}
        {!selectedRoute && (
          <div className="space-y-4">
            <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider">
              Step 1: Choose a Route
            </h2>
            <div className="space-y-3">
              {routes.map((route) => (
                <button
                  key={route._id}
                  onClick={() => setSelectedRoute(route)}
                  className="w-full card hover:bg-slate-800/50 transition-colors text-left group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white group-hover:text-primary-400 transition-colors">
                        {route.name}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {route.stops?.length || 0} stops
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-primary-400 transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Select Stop */}
        {selectedRoute && (
          <div className="space-y-4">
            <button
              onClick={() => {
                setSelectedRoute(null);
                setSelectedStop(null);
              }}
              className="text-sm text-primary-400 hover:text-primary-300"
            >
              ← Back to routes
            </button>

            <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider">
              Step 2: Choose Your Stop on {selectedRoute.name}
            </h2>

            <div className="space-y-2">
              {selectedRoute.stops?.map((stop, index) => (
                <button
                  key={stop._id}
                  onClick={() => setSelectedStop(stop)}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    selectedStop?._id === stop._id
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      selectedStop?._id === stop._id
                        ? 'bg-primary-500 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {selectedStop?._id === stop._id ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-white">{stop.name}</h3>
                      <p className="text-xs text-slate-500">
                        Stop #{stop.sequence + 1}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {selectedStop && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn btn-primary w-full py-3 mt-6"
              >
                {saving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Confirm Selection
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
