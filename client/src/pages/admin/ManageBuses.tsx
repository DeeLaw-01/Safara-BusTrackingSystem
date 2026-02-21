import { useEffect, useState } from 'react';
import { 
  Bus, 
  Plus, 
  Edit, 
  Trash2, 
  Loader2,
  User,
  Route as RouteIcon
} from 'lucide-react';
import { busesApi, routesApi, adminApi } from '@/services/api'
import type { Bus as BusType, Route, User as UserType } from '@/types'

export default function ManageBuses() {
  const [buses, setBuses] = useState<BusType[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [drivers, setDrivers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBus, setEditingBus] = useState<BusType | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [busesRes, routesRes, driversRes] = await Promise.all([
        busesApi.getAll(),
        routesApi.getAll(),
        adminApi.getUsers({ role: 'driver', approved: true }),
      ]);
      setBuses(busesRes.data.data);
      setRoutes(routesRes.data.data);
      setDrivers(driversRes.data.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBus = async (id: string) => {
    if (!confirm('Are you sure you want to delete this bus?')) return;
    try {
      await busesApi.delete(id);
      loadData();
    } catch (error) {
      console.error('Failed to delete bus:', error);
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold text-white">Manage Buses</h1>
        <button
          onClick={() => {
            setEditingBus(null);
            setShowModal(true);
          }}
          className="btn btn-primary"
        >
          <Plus className="w-5 h-5" />
          Add Bus
        </button>
      </div>

      {/* Buses Grid */}
      {buses.length === 0 ? (
        <div className="card text-center py-12">
          <Bus className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No Buses Yet</h3>
          <p className="text-slate-400 mb-6">Add your first bus to get started</p>
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-primary"
          >
            <Plus className="w-5 h-5" />
            Add Bus
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {buses.map((bus) => {
            const route = typeof bus.routeId === 'object' ? bus.routeId as Route : null;
            const driver = typeof bus.driverId === 'object' ? bus.driverId as UserType : null;

            return (
              <div key={bus._id} className="card">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-2 rounded-lg ${bus.isActive ? 'bg-green-600/20' : 'bg-slate-700'}`}>
                    <Bus className={`w-5 h-5 ${bus.isActive ? 'text-green-400' : 'text-slate-400'}`} />
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingBus(bus);
                        setShowModal(true);
                      }}
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteBus(bus._id)}
                      className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="font-semibold text-white mb-1">{bus.name}</h3>
                <p className="text-sm text-slate-400 mb-4">{bus.plateNumber}</p>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-400">
                    <RouteIcon className="w-4 h-4" />
                    <span>{route?.name || 'No route assigned'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <User className="w-4 h-4" />
                    <span>{driver?.name || 'No driver assigned'}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-700 flex items-center justify-between text-sm">
                  <span className="text-slate-500">Capacity: {bus.capacity}</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    bus.isActive
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-slate-700 text-slate-400'
                  }`}>
                    {bus.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bus Modal */}
      {showModal && (
        <BusModal
          bus={editingBus}
          routes={routes}
          drivers={drivers}
          assignedDriverIds={buses.filter(b => b.driverId).map(b => 
            typeof b.driverId === 'object' ? (b.driverId as UserType)._id : b.driverId
          ).filter(Boolean) as string[]}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}

interface BusModalProps {
  bus: BusType | null;
  routes: Route[];
  drivers: UserType[];
  assignedDriverIds: string[];
  onClose: () => void;
  onSuccess: () => void;
}

function BusModal({ bus, routes, drivers, assignedDriverIds, onClose, onSuccess }: BusModalProps) {
  const [name, setName] = useState(bus?.name || '');
  const [plateNumber, setPlateNumber] = useState(bus?.plateNumber || '');
  const [capacity, setCapacity] = useState(bus?.capacity?.toString() || '40');
  const [routeId, setRouteId] = useState(
    bus?.routeId 
      ? (typeof bus.routeId === 'object' ? (bus.routeId as Route)._id : bus.routeId)
      : ''
  );
  const [driverId, setDriverId] = useState(
    bus?.driverId 
      ? (typeof bus.driverId === 'object' ? (bus.driverId as UserType)._id : bus.driverId)
      : ''
  );
  const [isActive, setIsActive] = useState(bus?.isActive ?? true);
  const [saving, setSaving] = useState(false);

  // Filter out already assigned drivers (except current bus's driver)
  const currentDriverId = bus?.driverId 
    ? (typeof bus.driverId === 'object' ? (bus.driverId as UserType)._id : bus.driverId)
    : null;
  const availableDrivers = drivers.filter(d => 
    !assignedDriverIds.includes(d._id) || d._id === currentDriverId
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (bus) {
        await busesApi.update(bus._id, {
          name,
          plateNumber,
          capacity: parseInt(capacity),
          isActive,
        });
        if (routeId !== (typeof bus.routeId === 'object' ? (bus.routeId as Route)._id : bus.routeId)) {
          await busesApi.assignRoute(bus._id, routeId || null);
        }
        if (driverId !== currentDriverId) {
          await busesApi.assignDriver(bus._id, driverId || null);
        }
      } else {
        await busesApi.create({
          name,
          plateNumber,
          capacity: parseInt(capacity),
          routeId: routeId || undefined,
          driverId: driverId || undefined,
        });
      }
      onSuccess();
    } catch (error) {
      console.error('Failed to save bus:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold text-white mb-6">
          {bus ? 'Edit Bus' : 'Add Bus'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Bus Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder="e.g., Bus 01"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Plate Number
            </label>
            <input
              type="text"
              value={plateNumber}
              onChange={(e) => setPlateNumber(e.target.value)}
              className="input"
              placeholder="e.g., LEA-1234"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Capacity
            </label>
            <input
              type="number"
              min="1"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              className="input"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Assigned Route
            </label>
            <select
              value={routeId}
              onChange={(e) => setRouteId(e.target.value)}
              className="input"
            >
              <option value="">No route assigned</option>
              {routes.map((route) => (
                <option key={route._id} value={route._id}>
                  {route.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Assigned Driver
            </label>
            <select
              value={driverId}
              onChange={(e) => setDriverId(e.target.value)}
              className="input"
            >
              <option value="">No driver assigned</option>
              {availableDrivers.map((driver) => (
                <option key={driver._id} value={driver._id}>
                  {driver.name} ({driver.email})
                </option>
              ))}
            </select>
          </div>
          {bus && (
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-slate-300">Bus is active</span>
              </label>
            </div>
          )}
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn btn-primary flex-1">
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
