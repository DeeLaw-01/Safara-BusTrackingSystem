import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bus, Route as RouteIcon, Navigation, Clock, AlertCircle, Loader2,
  Users as UsersIcon, Activity, ChevronRight, MapPin
} from 'lucide-react';
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
    const unsubTripEnded = socketService.onTripEnded(() => { loadData(); });
    const refreshInterval = setInterval(() => { loadData(); }, 10000);
    return () => { unsubTripEnded(); clearInterval(refreshInterval); };
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
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
          <span className="text-sm text-slate-400">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.name?.split(' ')[0] || 'Driver';
  const routeName = assignedBus && typeof assignedBus.routeId === 'object'
    ? (assignedBus.routeId as { name: string }).name : null;

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ══════════════════════════════════════════════════════════
          HERO — full-width gradient with bus info integrated
         ══════════════════════════════════════════════════════════ */}
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-teal-500/[0.07] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-emerald-500/[0.05] rounded-full blur-[80px]" />

        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
            backgroundSize: '32px 32px'
          }}
        />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-20 relative z-10">
          {/* Greeting */}
          <div className="mb-8">
            <p className="text-slate-500 text-sm">{greeting},</p>
            <h1 className="text-3xl lg:text-4xl font-bold text-white mt-1">
              {firstName}
            </h1>
          </div>

          {/* Bus info inline — or warning */}
          {!assignedBus ? (
            <div className="flex items-center gap-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5">
              <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-300">No Bus Assigned</h3>
                <p className="text-sm text-amber-300/60 mt-0.5">Contact your administrator to get a bus assigned.</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-end gap-6 sm:gap-10">
              {/* Bus identity */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-teal-400/20 to-teal-600/20 rounded-2xl flex items-center justify-center border border-teal-500/20">
                  <Bus className="w-8 h-8 text-teal-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Your Bus</p>
                  <h2 className="text-2xl font-bold text-white">{assignedBus.name}</h2>
                  <p className="text-sm text-slate-400">{assignedBus.plateNumber}</p>
                </div>
              </div>

              {/* Inline stats */}
              <div className="flex gap-6 sm:gap-8 text-sm pb-1">
                <div>
                  <p className="text-slate-500 text-xs">Capacity</p>
                  <p className="text-white font-semibold text-lg">{assignedBus.capacity} <span className="text-slate-500 text-xs font-normal">seats</span></p>
                </div>
                {routeName && (
                  <div>
                    <p className="text-slate-500 text-xs">Route</p>
                    <p className="text-teal-400 font-semibold text-lg flex items-center gap-1.5">
                      <RouteIcon className="w-4 h-4" />
                      {routeName}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-slate-500 text-xs">Status</p>
                  {currentTrip ? (
                    <p className="text-emerald-400 font-semibold flex items-center gap-1.5 text-lg">
                      <span className="w-2 h-2 bg-emerald-400 rounded-full pulse-live" />
                      Live
                    </p>
                  ) : (
                    <p className="text-slate-400 font-semibold text-lg">Idle</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          CONTENT — overlaps the hero slightly
         ══════════════════════════════════════════════════════════ */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20 pb-8 space-y-6">

        {/* ── Trip Action Card (full width, prominent) ── */}
        {assignedBus && (
          <Link
            to="/driver/trip"
            className={`group block rounded-2xl p-6 shadow-lg border transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 ${
              currentTrip
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 border-emerald-400/50 text-white'
                : 'bg-white border-slate-200 hover:border-teal-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                  currentTrip ? 'bg-white/15' : 'bg-teal-50'
                }`}>
                  <Navigation className={`w-7 h-7 ${currentTrip ? 'text-white' : 'text-teal-600'}`} />
                </div>
                <div>
                  {currentTrip ? (
                    <>
                      <div className="flex items-center gap-2 mb-0.5">
                        <div className="w-2 h-2 bg-white rounded-full pulse-live" />
                        <span className="text-sm text-white/70">Broadcasting Live</span>
                      </div>
                      <h3 className="text-xl font-bold">Trip in Progress</h3>
                      <p className="text-sm text-white/60 mt-0.5">Riders can see your location. Tap to view trip details.</p>
                    </>
                  ) : (
                    <>
                      <h3 className="text-xl font-bold text-slate-900">Start a New Trip</h3>
                      <p className="text-sm text-slate-500 mt-0.5">Begin broadcasting your location to riders on your route</p>
                    </>
                  )}
                </div>
              </div>

              <div className={`w-10 h-10 rounded-xl flex items-center justify-center group-hover:translate-x-1 transition-transform ${
                currentTrip ? 'bg-white/10' : 'bg-slate-100 group-hover:bg-teal-50'
              }`}>
                <ChevronRight className={`w-5 h-5 ${currentTrip ? 'text-white' : 'text-slate-400 group-hover:text-teal-600'}`} />
              </div>
            </div>
          </Link>
        )}

        {/* ── Stats Strip ── */}
        {assignedBus && (
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
              <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Navigation className="w-4 h-4 text-teal-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900">{recentTrips.length}</div>
              <div className="text-xs text-slate-400 mt-0.5">Total Trips</div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center mx-auto mb-2">
                <UsersIcon className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900">{assignedBus.capacity}</div>
              <div className="text-xs text-slate-400 mt-0.5">Bus Capacity</div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Activity className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {currentTrip ? <span className="text-emerald-500">ON</span> : <span className="text-slate-300">OFF</span>}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">Live Status</div>
            </div>
          </div>
        )}

        {/* ── Recent Trips Timeline ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-800">Trip History</h3>
            </div>
            <span className="text-xs text-slate-400">{recentTrips.length} trips</span>
          </div>

          {recentTrips.length === 0 ? (
            <div className="text-center py-16 px-6">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-7 h-7 text-slate-300" />
              </div>
              <p className="text-slate-500 font-medium">No trips yet</p>
              <p className="text-sm text-slate-400 mt-1 max-w-xs mx-auto">
                Start your first trip to begin building your history
              </p>
            </div>
          ) : (
            <div className="px-6 py-3">
              {/* Timeline */}
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-[11px] top-3 bottom-3 w-px bg-slate-100" />

                <div className="space-y-0">
                  {recentTrips.map((trip) => {
                    const isOngoing = trip.status === 'ongoing';
                    const routeLabel = typeof trip.routeId === 'object'
                      ? (trip.routeId as { name: string }).name
                      : 'Unknown Route';
                    const date = new Date(trip.startTime);

                    return (
                      <div key={trip._id} className="relative flex gap-4 py-3.5 group">
                        {/* Timeline dot */}
                        <div className="relative z-10 mt-1">
                          <div className={`w-[22px] h-[22px] rounded-full border-[3px] ${
                            isOngoing
                              ? 'bg-emerald-500 border-emerald-200 pulse-live'
                              : 'bg-white border-slate-200 group-hover:border-teal-300'
                          } transition-colors`} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 flex items-center justify-between min-w-0 -mt-0.5">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-slate-700 truncate">{routeLabel}</span>
                              {isOngoing && (
                                <span className="text-[10px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider">Live</span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                              {' · '}
                              {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ml-3 ${
                            isOngoing
                              ? 'bg-emerald-50 text-emerald-600'
                              : 'bg-slate-50 text-slate-400'
                          }`}>
                            {trip.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
