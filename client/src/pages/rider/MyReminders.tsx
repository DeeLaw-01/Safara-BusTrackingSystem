import { useEffect, useState } from 'react';
import { Bell, Plus, Trash2, Loader2, Clock, MapPin, ToggleLeft, ToggleRight } from 'lucide-react';
import { remindersApi, routesApi, stopsApi } from '../../services/api';
import type { Reminder, Route, Stop } from '../../types';

export default function MyReminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadReminders();
  }, []);

  const loadReminders = async () => {
    try {
      const { data } = await remindersApi.getMyReminders();
      setReminders(data.data);
    } catch (error) {
      console.error('Failed to load reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleReminder = async (id: string) => {
    try {
      await remindersApi.toggle(id);
      loadReminders();
    } catch (error) {
      console.error('Failed to toggle reminder:', error);
    }
  };

  const deleteReminder = async (id: string) => {
    if (!confirm('Are you sure you want to delete this reminder?')) return;
    
    try {
      await remindersApi.delete(id);
      loadReminders();
    } catch (error) {
      console.error('Failed to delete reminder:', error);
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
    <div className="max-w-2xl mx-auto p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-white mb-1">
            My Reminders
          </h1>
          <p className="text-slate-400">
            Get notified when your bus is approaching
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn btn-primary"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Add Reminder</span>
        </button>
      </div>

      {/* Reminders List */}
      {reminders.length === 0 ? (
        <div className="card text-center py-12">
          <Bell className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No Reminders Yet</h3>
          <p className="text-slate-400 mb-6">
            Set up reminders to get notified when your bus is approaching
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-primary"
          >
            <Plus className="w-5 h-5" />
            Create Your First Reminder
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {reminders.map((reminder) => {
            const stop = reminder.stopId as Stop;
            const route = reminder.routeId as Route;
            
            return (
              <div
                key={reminder._id}
                className={`card transition-all ${
                  !reminder.isActive ? 'opacity-50' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-primary-400" />
                      <span className="font-semibold text-white">
                        {stop?.name || 'Unknown Stop'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 mb-2">
                      Route: {route?.name || 'Unknown Route'}
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1 text-slate-400">
                        <Clock className="w-4 h-4" />
                        <span>{reminder.minutesBefore} min before</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-400">
                        <Bell className="w-4 h-4" />
                        <span className="capitalize">{reminder.notificationType}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleReminder(reminder._id)}
                      className={`p-2 rounded-lg transition-colors ${
                        reminder.isActive
                          ? 'text-primary-400 hover:bg-primary-400/10'
                          : 'text-slate-500 hover:bg-slate-800'
                      }`}
                      title={reminder.isActive ? 'Disable' : 'Enable'}
                    >
                      {reminder.isActive ? (
                        <ToggleRight className="w-6 h-6" />
                      ) : (
                        <ToggleLeft className="w-6 h-6" />
                      )}
                    </button>
                    <button
                      onClick={() => deleteReminder(reminder._id)}
                      className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Reminder Modal */}
      {showModal && (
        <AddReminderModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            loadReminders();
          }}
        />
      )}
    </div>
  );
}

interface AddReminderModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function AddReminderModal({ onClose, onSuccess }: AddReminderModalProps) {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [stops, setStops] = useState<Stop[]>([]);
  const [selectedRoute, setSelectedRoute] = useState('');
  const [selectedStop, setSelectedStop] = useState('');
  const [minutesBefore, setMinutesBefore] = useState(5);
  const [notificationType, setNotificationType] = useState<'push' | 'sms' | 'both'>('push');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadRoutes();
  }, []);

  useEffect(() => {
    if (selectedRoute) {
      loadStops(selectedRoute);
    } else {
      setStops([]);
      setSelectedStop('');
    }
  }, [selectedRoute]);

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

  const loadStops = async (routeId: string) => {
    try {
      const { data } = await stopsApi.getAll(routeId);
      setStops(data.data);
    } catch (error) {
      console.error('Failed to load stops:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoute || !selectedStop) return;

    setSaving(true);
    try {
      await remindersApi.create({
        routeId: selectedRoute,
        stopId: selectedStop,
        minutesBefore,
        notificationType,
      });
      onSuccess();
    } catch (error) {
      console.error('Failed to create reminder:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold text-white mb-6">Add Reminder</h2>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Route
              </label>
              <select
                value={selectedRoute}
                onChange={(e) => setSelectedRoute(e.target.value)}
                className="input"
                required
              >
                <option value="">Select a route</option>
                {routes.map((route) => (
                  <option key={route._id} value={route._id}>
                    {route.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Stop
              </label>
              <select
                value={selectedStop}
                onChange={(e) => setSelectedStop(e.target.value)}
                className="input"
                required
                disabled={!selectedRoute}
              >
                <option value="">Select a stop</option>
                {stops.map((stop) => (
                  <option key={stop._id} value={stop._id}>
                    {stop.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Notify me when bus is
              </label>
              <select
                value={minutesBefore}
                onChange={(e) => setMinutesBefore(Number(e.target.value))}
                className="input"
              >
                <option value={2}>2 minutes away</option>
                <option value={5}>5 minutes away</option>
                <option value={10}>10 minutes away</option>
                <option value={15}>15 minutes away</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Notification Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['push', 'sms', 'both'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setNotificationType(type)}
                    className={`p-3 rounded-lg border-2 capitalize transition-all ${
                      notificationType === type
                        ? 'border-primary-500 bg-primary-500/10'
                        : 'border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !selectedRoute || !selectedStop}
                className="btn btn-primary flex-1"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
