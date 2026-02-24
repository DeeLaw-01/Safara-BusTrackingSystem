import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Route as RouteIcon, 
  Plus, 
  Edit, 
  Trash2, 
  Loader2,
  ChevronDown,
  ChevronUp,
  Map
} from 'lucide-react';
import { routesApi, stopsApi } from '@/services/api'
import type { Route, Stop } from '@/types'

interface ConfirmState {
  open: boolean
  message: string
  onConfirm: () => void
}

export default function ManageRoutes() {
  const navigate = useNavigate();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRoute, setExpandedRoute] = useState<string | null>(null);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [showStopModal, setShowStopModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [editingStop, setEditingStop] = useState<Stop | null>(null);
  const [selectedRouteForStop, setSelectedRouteForStop] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState>({ open: false, message: '', onConfirm: () => {} });

  const askConfirm = (message: string, onConfirm: () => void) =>
    setConfirm({ open: true, message, onConfirm });
  const closeConfirm = () => setConfirm(c => ({ ...c, open: false }));

  useEffect(() => {
    loadRoutes();
  }, []);

  const loadRoutes = async () => {
    try {
      const { data } = await routesApi.getAll();
      setRoutes(data.data);
    } catch (error) {
      console.error('Failed to load routes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRoute = (id: string) => {
    askConfirm('Are you sure? This will also delete all stops on this route.', async () => {
      closeConfirm();
      try {
        await routesApi.delete(id);
        loadRoutes();
      } catch (error) {
        console.error('Failed to delete route:', error);
      }
    });
  };

  const handleDeleteStop = (id: string) => {
    askConfirm('Are you sure you want to delete this stop?', async () => {
      closeConfirm();
      try {
        await stopsApi.delete(id);
        loadRoutes();
      } catch (error) {
        console.error('Failed to delete stop:', error);
      }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 rounded-2xl p-6 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        <div className="absolute -top-10 -right-10 w-40 h-40 border border-white/5 rounded-full" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
              <RouteIcon className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Manage Routes</h1>
              <p className="text-sm text-slate-400 mt-0.5">{routes.length} routes configured</p>
            </div>
          </div>
          <button
            onClick={() => { setEditingRoute(null); setShowRouteModal(true); }}
            className="bg-teal-500 hover:bg-teal-400 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-teal-500/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Route
          </button>
        </div>
      </div>

      {/* Routes List */}
      {routes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm text-center py-16">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <RouteIcon className="w-7 h-7 text-slate-300" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">No Routes Yet</h3>
          <p className="text-sm text-slate-400 mb-6">Create your first route to get started</p>
          <button
            onClick={() => setShowRouteModal(true)}
            className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Route
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {routes.map((route) => (
            <div key={route._id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
              {/* Color bar */}
              <div className={`h-1 ${route.isActive ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : 'bg-slate-200'}`} />
              {/* Route Header */}
              <div
                className="flex items-center justify-between cursor-pointer px-5 py-4"
                onClick={() => setExpandedRoute(expandedRoute === route._id ? null : route._id)}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${route.isActive ? 'bg-teal-50' : 'bg-slate-50'}`}>
                    <RouteIcon className={`w-5 h-5 ${route.isActive ? 'text-teal-600' : 'text-slate-400'}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">{route.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {route.stops?.length || 0} stops · {route.isActive ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/admin/routes/builder/${route._id}`);
                    }}
                    className="p-2 text-teal-600 hover:text-teal-600/80 hover:bg-teal-600/10 rounded-lg transition-colors"
                    title="Open Route Builder"
                  >
                    <Map className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingRoute(route);
                      setShowRouteModal(true);
                    }}
                    className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteRoute(route._id);
                    }}
                    className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {expandedRoute === route._id ? (
                    <ChevronUp className="w-5 h-5 text-slate-500/60" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-500/60" />
                  )}
                </div>
              </div>

              {/* Expanded Stops */}
              {expandedRoute === route._id && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Stops</h4>
                    <button
                      onClick={() => {
                        setSelectedRouteForStop(route._id);
                        setEditingStop(null);
                        setShowStopModal(true);
                      }}
                      className="text-sm text-teal-600 hover:text-teal-600/80 font-semibold flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      Add Stop
                    </button>
                  </div>

                  {(!route.stops || route.stops.length === 0) ? (
                    <p className="text-slate-500/60 text-sm">No stops added yet</p>
                  ) : (
                    <div className="space-y-2">
                      {route.stops.map((stop, index) => (
                        <div
                          key={stop._id}
                          className="flex items-center justify-between p-3 bg-slate-50/50 border border-slate-200 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-teal-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                              {index + 1}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-slate-800">{stop.name}</div>
                              <div className="text-xs text-slate-500/70">
                                {stop.latitude.toFixed(4)}, {stop.longitude.toFixed(4)}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setSelectedRouteForStop(route._id);
                                setEditingStop(stop);
                                setShowStopModal(true);
                              }}
                              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded transition-colors"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteStop(stop._id)}
                              className="p-1.5 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Route Modal */}
      {showRouteModal && (
        <RouteModal
          route={editingRoute}
          onClose={() => setShowRouteModal(false)}
          onSuccess={() => {
            setShowRouteModal(false);
            loadRoutes();
          }}
        />
      )}

      {/* Stop Modal */}
      {showStopModal && selectedRouteForStop && (
        <StopModal
          routeId={selectedRouteForStop}
          stop={editingStop}
          existingStopsCount={routes.find(r => r._id === selectedRouteForStop)?.stops?.length || 0}
          onClose={() => setShowStopModal(false)}
          onSuccess={() => {
            setShowStopModal(false);
            loadRoutes();
          }}
        />
      )}

      {/* Confirm Dialog */}
      {confirm.open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 max-w-sm w-full shadow-2xl">
            <p className="text-slate-800 font-medium mb-6">{confirm.message}</p>
            <div className="flex gap-3">
              <button onClick={closeConfirm} className="btn-secondary h-[46px] flex-1">Cancel</button>
              <button onClick={confirm.onConfirm} className="btn btn-danger h-[46px] flex-1">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface RouteModalProps {
  route: Route | null;
  onClose: () => void;
  onSuccess: () => void;
}

function RouteModal({ route, onClose, onSuccess }: RouteModalProps) {
  const [name, setName] = useState(route?.name || '');
  const [description, setDescription] = useState(route?.description || '');
  const [isActive, setIsActive] = useState(route?.isActive ?? true);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (route) {
        await routesApi.update(route._id, { name, description, isActive });
      } else {
        await routesApi.create({ name, description });
      }
      onSuccess();
    } catch (error) {
      console.error('Failed to save route:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 max-w-md w-full shadow-2xl">
        <h2 className="text-xl font-semibold font-bold text-slate-800 mb-6">
          {route ? 'Edit Route' : 'Create Route'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-2">
              Route Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder="e.g., DHA Phase 5 - Model Town"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-2">
              Description (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input"
              placeholder="e.g., Morning route via main boulevard"
            />
          </div>
          {route && (
            <div>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-200 text-teal-600 focus:ring-teal-500"
                />
                <span className="text-slate-500 group-hover:text-slate-800 transition-colors font-medium">Route is active</span>
              </label>
            </div>
          )}
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary h-[46px] flex-1">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors h-[46px] flex-1">
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface StopModalProps {
  routeId: string;
  stop: Stop | null;
  existingStopsCount: number;
  onClose: () => void;
  onSuccess: () => void;
}

function StopModal({ routeId, stop, existingStopsCount, onClose, onSuccess }: StopModalProps) {
  const [name, setName] = useState(stop?.name || '');
  const [latitude, setLatitude] = useState(stop?.latitude?.toString() || '');
  const [longitude, setLongitude] = useState(stop?.longitude?.toString() || '');
  const [sequence, setSequence] = useState(stop?.sequence?.toString() || existingStopsCount.toString());
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (stop) {
        await stopsApi.update(stop._id, {
          name,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          sequence: parseInt(sequence),
        });
      } else {
        await stopsApi.create({
          name,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          sequence: parseInt(sequence),
          routeId,
        });
      }
      onSuccess();
    } catch (error) {
      console.error('Failed to save stop:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 max-w-md w-full shadow-2xl">
        <h2 className="text-xl font-semibold font-bold text-slate-800 mb-6">
          {stop ? 'Edit Stop' : 'Add Stop'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-2">
              Stop Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder="e.g., Main Gate"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2">
                Latitude
              </label>
              <input
                type="number"
                step="any"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                className="input"
                placeholder="31.5204"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2">
                Longitude
              </label>
              <input
                type="number"
                step="any"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                className="input"
                placeholder="74.3587"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-2">
              Sequence (Order)
            </label>
            <input
              type="number"
              min="0"
              value={sequence}
              onChange={(e) => setSequence(e.target.value)}
              className="input"
              required
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary h-[46px] flex-1">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors h-[46px] flex-1">
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
