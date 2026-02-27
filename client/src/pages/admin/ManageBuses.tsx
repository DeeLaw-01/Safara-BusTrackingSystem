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
      <div className="">
        <Loader2 className="" />
      </div>
    );
  }

  return (
    <div className="">
      <div className="">
        <h1 className="">Manage Buses</h1>
        <button
          onClick={() => {
            setEditingBus(null);
            setShowModal(true);
          }}
          className=""
        >
          <Plus className="" />
          Add Bus
        </button>
      </div>

      {/* Buses Grid */}
      {buses.length === 0 ? (
        <div className="">
          <Bus className="" />
          <h3 className="">No Buses Yet</h3>
          <p className="">Add your first bus to get started</p>
          <button
            onClick={() => setShowModal(true)}
            className=""
          >
            <Plus className="" />
            Add Bus
          </button>
        </div>
      ) : (
        <div className="">
          {buses.map((bus) => {
            const route = typeof bus.routeId === 'object' ? bus.routeId as Route : null;
            const driver = typeof bus.driverId === 'object' ? bus.driverId as UserType : null;

            return (
              <div key={bus._id} className="">
                <div className="">
                  <div className={`p-2 rounded-lg ${bus.isActive ? 'bg-green-50' : 'bg-app-bg'}`}>
                    <Bus className={`w-5 h-5 ${bus.isActive ? 'text-green-600' : 'text-content-secondary'}`} />
                  </div>
                  <div className="">
                    <button
                      onClick={() => {
                        setEditingBus(bus);
                        setShowModal(true);
                      }}
                      className=""
                    >
                      <Edit className="" />
                    </button>
                    <button
                      onClick={() => handleDeleteBus(bus._id)}
                      className=""
                    >
                      <Trash2 className="" />
                    </button>
                  </div>
                </div>

                <h3 className="">{bus.name}</h3>
                <p className="">{bus.plateNumber}</p>

                <div className="">
                  <div className="">
                    <RouteIcon className="" />
                    <span className="">{route?.name || 'No route assigned'}</span>
                  </div>
                  <div className="">
                    <User className="" />
                    <span className="">{driver?.name || 'No driver assigned'}</span>
                  </div>
                </div>

                <div className="">
                  <span className="">Capacity: {bus.capacity}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                    bus.isActive
                      ? 'bg-green-50 text-green-600 border border-green-100'
                      : 'bg-app-bg text-content-secondary border border-ui-border'
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
    <div className="">
      <div className="">
        <h2 className="">
          {bus ? 'Edit Bus' : 'Add Bus'}
        </h2>
        <form onSubmit={handleSubmit} className="">
          <div>
            <label className="">
              Bus Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className=""
              placeholder="e.g., Bus 01"
              required
            />
          </div>
          <div>
            <label className="">
              Plate Number
            </label>
            <input
              type="text"
              value={plateNumber}
              onChange={(e) => setPlateNumber(e.target.value)}
              className=""
              placeholder="e.g., LEA-1234"
              required
            />
          </div>
          <div>
            <label className="">
              Capacity
            </label>
            <input
              type="number"
              min="1"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              className=""
              required
            />
          </div>
          <div>
            <label className="">
              Assigned Route
            </label>
            <select
              value={routeId}
              onChange={(e) => setRouteId(e.target.value)}
              className=""
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
            <label className="">
              Assigned Driver
            </label>
            <select
              value={driverId}
              onChange={(e) => setDriverId(e.target.value)}
              className=""
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
              <label className="">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className=""
                />
                <span className="">Bus is active</span>
              </label>
            </div>
          )}
          <div className="">
            <button type="button" onClick={onClose} className="">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="">
              {saving ? <Loader2 className="" /> : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

