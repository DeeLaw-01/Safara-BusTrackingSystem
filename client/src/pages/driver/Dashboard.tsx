import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bus,
  Route as RouteIcon,
  Navigation,
  Clock,
  AlertCircle,
  Loader2,
  Users,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Zap,
  TrendingUp,
  Radio,
} from "lucide-react";
import { tripsApi } from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { socketService } from "@/services/socket";
import type { Bus as BusType, Trip } from "@/types";

const CSS = `
  @keyframes dd-pulse {
    0%,100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.5); }
    50% { box-shadow: 0 0 0 6px rgba(34,197,94,0); }
  }
  @keyframes dd-spin { to { transform: rotate(360deg); } }

  .dd-root { min-height: 100%; background: #f0f2f7; }

  /* ── Hero ── */
  .dd-hero {
    background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 55%, #0c1a3a 100%);
    padding: 22px 20px 22px; position: relative; overflow: hidden;
  }
  .dd-hero::before {
    content: ''; position: absolute; top: -60px; right: -60px;
    width: 280px; height: 280px; border-radius: 50%;
    background: radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%);
    pointer-events: none;
  }
  .dd-hero-inner { display: flex; align-items: center; gap: 14px; position: relative; z-index: 1; }
  .dd-hero-icon {
    width: 48px; height: 48px; border-radius: 15px; flex-shrink: 0;
    background: rgba(99,102,241,0.2); border: 1.5px solid rgba(99,102,241,0.4);
    display: flex; align-items: center; justify-content: center;
  }
  .dd-hero-title { font-size: 19px; font-weight: 800; color: #f8fafc; letter-spacing: -0.025em; }
  .dd-hero-sub { font-size: 12.5px; color: #64748b; margin-top: 2px; }
  .dd-hero-badge-active {
    margin-left: auto; display: flex; align-items: center; gap: 6px;
    padding: 7px 13px; border-radius: 99px; flex-shrink: 0;
    background: rgba(34,197,94,0.12); border: 1px solid rgba(34,197,94,0.25);
    font-size: 12.5px; font-weight: 700; color: #4ade80;
  }
  .dd-hero-badge-idle {
    margin-left: auto; display: flex; align-items: center; gap: 6px;
    padding: 7px 13px; border-radius: 99px; flex-shrink: 0;
    background: rgba(99,102,241,0.12); border: 1px solid rgba(99,102,241,0.25);
    font-size: 12.5px; font-weight: 700; color: #a5b4fc;
  }
  .dd-hero-dot-g { width: 7px; height: 7px; border-radius: 50%; background: #22c55e; animation: dd-pulse 2s infinite; }
  .dd-hero-dot-i { width: 7px; height: 7px; border-radius: 50%; background: #818cf8; }

  /* ── KPI row ── */
  .dd-kpi-row {
    display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;
    padding: 14px 16px;
  }
  .dd-kpi {
    background: #fff; border-radius: 16px; border: 1px solid #e8edf2;
    padding: 17px 18px; display: flex; align-items: center; gap: 12px;
    box-shadow: 0 1px 6px rgba(0,0,0,0.04);
  }
  .dd-kpi-icon {
    width: 40px; height: 40px; border-radius: 12px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
  }
  .dd-kpi-icon-indigo { background: #eef2ff; border: 1px solid #c7d2fe; }
  .dd-kpi-icon-sky { background: #f0f9ff; border: 1px solid #bae6fd; }
  .dd-kpi-icon-violet { background: #f5f3ff; border: 1px solid #ddd6fe; }
  .dd-kpi-icon-slate { background: #f8fafc; border: 1px solid #e2e8f0; }
  .dd-kpi-val { font-size: 16px; font-weight: 800; color: #0f172a; line-height: 1.2; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .dd-kpi-label { font-size: 11px; font-weight: 600; color: #94a3b8; margin-top: 2px; }

  /* ── Body ── */
  .dd-body { padding: 4px 16px 32px; display: flex; flex-direction: column; gap: 12px; }

  /* ── Vehicle card ── */
  .dd-vehicle {
    background: #fff; border-radius: 18px; border: 1px solid #e8edf2;
    box-shadow: 0 1px 10px rgba(0,0,0,0.04); overflow: hidden;
    display: flex;
  }
  .dd-vehicle-accent { width: 4px; background: linear-gradient(180deg, #6366f1 0%, #818cf8 100%); flex-shrink: 0; }
  .dd-vehicle-body { flex: 1; padding: 20px 20px; min-width: 0; }
  .dd-vehicle-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
  .dd-vehicle-bus-icon {
    width: 44px; height: 44px; border-radius: 13px; flex-shrink: 0;
    background: linear-gradient(135deg, #6366f1 0%, #818cf8 100%);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 12px rgba(99,102,241,0.3);
  }
  .dd-vehicle-name { font-size: 16px; font-weight: 800; color: #0f172a; letter-spacing: -0.01em; }
  .dd-vehicle-plate {
    font-size: 11.5px; font-weight: 700; color: #6366f1; margin-top: 2px;
    background: #eef2ff; border: 1px solid #c7d2fe;
    padding: 2px 8px; border-radius: 6px; display: inline-block;
  }
  .dd-vehicle-specs { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .dd-vehicle-spec {
    display: flex; align-items: center; gap: 8px;
    padding: 12px 13px; background: #f8fafc;
    border-radius: 10px; border: 1px solid #f1f5f9;
  }
  .dd-vehicle-spec-label { font-size: 10.5px; color: #94a3b8; font-weight: 600; }
  .dd-vehicle-spec-val { font-size: 13px; font-weight: 700; color: #0f172a; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  /* ── No bus ── */
  .dd-no-bus {
    background: #fff; border-radius: 18px; border: 1.5px dashed #fde68a;
    padding: 20px; display: flex; align-items: flex-start; gap: 13px;
    box-shadow: 0 1px 10px rgba(0,0,0,0.04);
  }

  /* ── Trip control card ── */
  .dd-trip-card {
    background: #fff; border-radius: 18px; border: 1px solid #e8edf2;
    box-shadow: 0 1px 10px rgba(0,0,0,0.04); overflow: hidden;
  }
  .dd-trip-card-head {
    padding: 14px 18px 12px; border-bottom: 1px solid #f1f5f9;
    display: flex; align-items: center; gap: 8px;
    font-size: 11px; font-weight: 700; color: #94a3b8;
    text-transform: uppercase; letter-spacing: 0.1em;
  }
  .dd-trip-card-body { padding: 20px; }

  /* Active state */
  .dd-trip-live {
    background: linear-gradient(135deg, #052e16 0%, #14532d 100%);
    border-radius: 14px; padding: 16px 18px; margin-bottom: 14px;
    display: flex; align-items: flex-start; gap: 13px;
  }
  .dd-trip-live-pulse {
    width: 14px; height: 14px; border-radius: 50%; background: #22c55e;
    flex-shrink: 0; margin-top: 2px; animation: dd-pulse 2s infinite;
  }
  .dd-trip-live-label { font-size: 11px; font-weight: 700; color: #4ade80; text-transform: uppercase; letter-spacing: 0.08em; }
  .dd-trip-live-time { font-size: 24px; font-weight: 800; color: #f0fdf4; letter-spacing: -0.02em; margin: 3px 0; line-height: 1; }
  .dd-trip-live-sub { font-size: 12px; color: #86efac; }

  /* Idle state */
  .dd-trip-idle {
    border-radius: 14px; padding: 16px 18px; margin-bottom: 14px;
    background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
    border: 1px solid #c7d2fe;
    display: flex; align-items: center; gap: 14px;
  }
  .dd-trip-idle-icon-wrap {
    width: 44px; height: 44px; border-radius: 13px; flex-shrink: 0;
    background: linear-gradient(135deg, #6366f1 0%, #818cf8 100%);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 10px rgba(99,102,241,0.35);
  }
  .dd-trip-idle-title { font-size: 15px; font-weight: 800; color: #1e1b4b; }
  .dd-trip-idle-sub { font-size: 12px; color: #6366f1; margin-top: 3px; line-height: 1.4; }

  /* CTAs */
  .dd-btn-green {
    display: flex; align-items: center; justify-content: center; gap: 9px;
    width: 100%; padding: 14px 0; border-radius: 13px; border: none;
    background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%);
    color: #fff; font-size: 14px; font-weight: 700; cursor: pointer;
    text-decoration: none; box-shadow: 0 4px 16px rgba(34,197,94,0.3);
    transition: opacity 0.15s, transform 0.1s;
  }
  .dd-btn-green:hover { opacity: 0.92; transform: translateY(-1px); }

  .dd-btn-indigo {
    display: flex; align-items: center; justify-content: center; gap: 9px;
    width: 100%; padding: 14px 0; border-radius: 13px; border: none;
    background: linear-gradient(135deg, #6366f1 0%, #818cf8 100%);
    color: #fff; font-size: 14px; font-weight: 700; cursor: pointer;
    text-decoration: none; box-shadow: 0 4px 16px rgba(99,102,241,0.3);
    transition: opacity 0.15s, transform 0.1s;
  }
  .dd-btn-indigo:hover { opacity: 0.92; transform: translateY(-1px); }

  /* ── Trips history card ── */
  .dd-hist {
    background: #fff; border-radius: 18px; border: 1px solid #e8edf2;
    box-shadow: 0 1px 10px rgba(0,0,0,0.04); overflow: hidden;
  }
  .dd-hist-head {
    padding: 14px 18px; border-bottom: 1px solid #f1f5f9;
    display: flex; align-items: center; justify-content: space-between;
  }
  .dd-hist-head-label { display: flex; align-items: center; gap: 8px; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; }
  .dd-hist-count {
    font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 99px;
    background: #f8fafc; border: 1px solid #e2e8f0; color: #64748b;
  }
  .dd-hist-body { padding: 8px 18px 14px; }
  .dd-trip-row {
    display: flex; align-items: center; gap: 11px;
    padding: 14px 0; border-bottom: 1px solid #f8fafc;
    position: relative;
  }
  .dd-trip-row:last-child { border-bottom: none; }
  .dd-trip-icon {
    width: 36px; height: 36px; border-radius: 11px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
  }
  .dd-trip-icon-done { background: #f8fafc; border: 1px solid #e8edf2; }
  .dd-trip-icon-live { background: #f0fdf4; border: 1px solid #bbf7d0; }
  .dd-trip-name { font-size: 13px; font-weight: 700; color: #0f172a; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .dd-trip-meta { font-size: 11px; color: #94a3b8; margin-top: 2px; display: flex; align-items: center; gap: 5px; flex-wrap: wrap; }
  .dd-badge-live {
    margin-left: auto; flex-shrink: 0; display: flex; align-items: center; gap: 5px;
    font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 99px;
    background: #f0fdf4; border: 1px solid #bbf7d0; color: #16a34a;
  }
  .dd-badge-done {
    margin-left: auto; flex-shrink: 0;
    font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 99px;
    background: #f8fafc; border: 1px solid #e2e8f0; color: #94a3b8;
  }
  .dd-empty { font-size: 13px; color: #94a3b8; padding: 28px 0; text-align: center; }
  .dd-loading { display: flex; align-items: center; justify-content: center; min-height: 60vh; }

  /* ── Desktop layout ── */
  @media (min-width: 768px) {
    .dd-hero { padding: 26px 36px; }
    .dd-kpi-row { grid-template-columns: repeat(4, 1fr); padding: 16px 36px; gap: 12px; }
    .dd-body { padding: 4px 36px 32px; flex-direction: row; align-items: flex-start; gap: 14px; }
    .dd-col-left { flex: 0 0 55%; min-width: 0; display: flex; flex-direction: column; gap: 12px; }
    .dd-col-right { flex: 1; min-width: 0; }
  }
  @media (min-width: 1100px) {
    .dd-hero { padding: 28px 52px; }
    .dd-kpi-row { padding: 18px 52px; }
    .dd-body { padding: 4px 52px 32px; gap: 16px; }
    .dd-col-left { flex: 0 0 56%; }
  }
`;

function fmtDuration(start: string, end?: string): string {
  const ms = new Date(end ?? Date.now()).getTime() - new Date(start).getTime();
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function DriverDashboard() {
  const [assignedBus, setAssignedBus] = useState<BusType | null>(null);
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);
  const [recentTrips, setRecentTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    loadData();
    const unsubTripEnded = socketService.onTripEnded(() => loadData());
    const refreshInterval = setInterval(() => loadData(), 10000);
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
        tripsApi.getMyTrips({ limit: 10 }),
      ]);
      setAssignedBus(busRes.data.data);
      setCurrentTrip(tripRes.data.data);
      setRecentTrips(recentRes.data.data);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <style>{CSS}</style>
        <div className="dd-loading">
          <Loader2 size={28} color="#6366f1" style={{ animation: "dd-spin 1s linear infinite" }} />
        </div>
      </>
    );
  }

  const routeName =
    assignedBus && typeof assignedBus.routeId === "object"
      ? (assignedBus.routeId as { name: string }).name
      : "—";

  const endedTrips = recentTrips.filter((t) => t.status !== "ongoing").length;

  return (
    <>
      <style>{CSS}</style>
      <div className="dd-root">

        {/* ── Hero ── */}
        <div className="dd-hero">
          <div className="dd-hero-inner">
            <div className="dd-hero-icon">
              <Bus size={24} color="#a5b4fc" />
            </div>
            <div>
              <div className="dd-hero-title">Driver Dashboard</div>
              <div className="dd-hero-sub">Welcome back, {user?.name}</div>
            </div>
            {currentTrip ? (
              <div className="dd-hero-badge-active">
                <div className="dd-hero-dot-g" />
                On Trip
              </div>
            ) : (
              <div className="dd-hero-badge-idle">
                <div className="dd-hero-dot-i" />
                Idle
              </div>
            )}
          </div>
        </div>

        {/* ── KPI row ── */}
        <div className="dd-kpi-row">
          <div className="dd-kpi">
            <div className="dd-kpi-icon dd-kpi-icon-indigo">
              <Bus size={17} color="#6366f1" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div className="dd-kpi-val">{assignedBus?.name ?? "None"}</div>
              <div className="dd-kpi-label">Assigned Bus</div>
            </div>
          </div>
          <div className="dd-kpi">
            <div className="dd-kpi-icon dd-kpi-icon-sky">
              <RouteIcon size={17} color="#0ea5e9" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div className="dd-kpi-val">{routeName}</div>
              <div className="dd-kpi-label">Route</div>
            </div>
          </div>
          <div className="dd-kpi">
            <div className="dd-kpi-icon dd-kpi-icon-violet">
              <Users size={17} color="#7c3aed" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div className="dd-kpi-val">{assignedBus?.capacity ?? "—"}</div>
              <div className="dd-kpi-label">Capacity</div>
            </div>
          </div>
          <div className="dd-kpi">
            <div className="dd-kpi-icon dd-kpi-icon-slate">
              <TrendingUp size={17} color="#64748b" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div className="dd-kpi-val">{endedTrips}</div>
              <div className="dd-kpi-label">Trips Completed</div>
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="dd-body">

          {/* Left col */}
          <div className="dd-col-left">

            {/* No bus */}
            {!assignedBus && (
              <div className="dd-no-bus">
                <AlertCircle size={20} color="#d97706" style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#92400e" }}>No Bus Assigned</div>
                  <div style={{ fontSize: 12, color: "#b45309", marginTop: 3 }}>Contact your administrator to get a bus assigned before starting a trip.</div>
                </div>
              </div>
            )}

            {/* Vehicle card */}
            {assignedBus && (
              <div className="dd-vehicle">
                <div className="dd-vehicle-accent" />
                <div className="dd-vehicle-body">
                  <div className="dd-vehicle-header">
                    <div className="dd-vehicle-bus-icon">
                      <Bus size={22} color="#fff" />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div className="dd-vehicle-name">{assignedBus.name}</div>
                      <div className="dd-vehicle-plate">{assignedBus.plateNumber}</div>
                    </div>
                  </div>
                  <div className="dd-vehicle-specs">
                    <div className="dd-vehicle-spec">
                      <RouteIcon size={14} color="#0ea5e9" />
                      <div style={{ minWidth: 0 }}>
                        <div className="dd-vehicle-spec-label">Route</div>
                        <div className="dd-vehicle-spec-val">{routeName}</div>
                      </div>
                    </div>
                    <div className="dd-vehicle-spec">
                      <Users size={14} color="#7c3aed" />
                      <div>
                        <div className="dd-vehicle-spec-label">Capacity</div>
                        <div className="dd-vehicle-spec-val">{assignedBus.capacity} seats</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Trip control card */}
            {assignedBus && (
              <div className="dd-trip-card">
                <div className="dd-trip-card-head">
                  <Radio size={12} />
                  Trip Control
                </div>
                <div className="dd-trip-card-body">
                  {currentTrip ? (
                    <>
                      <div className="dd-trip-live">
                        <div className="dd-trip-live-pulse" />
                        <div>
                          <div className="dd-trip-live-label">Live · Broadcasting</div>
                          <div className="dd-trip-live-time">{fmtDuration(currentTrip.startTime)}</div>
                          <div className="dd-trip-live-sub">elapsed since trip started</div>
                        </div>
                        <ChevronRight size={18} color="#4ade80" style={{ marginLeft: "auto", flexShrink: 0, marginTop: 6 }} />
                      </div>
                      <Link to="/driver/trip" className="dd-btn-green">
                        <Navigation size={16} />
                        View Active Trip
                      </Link>
                    </>
                  ) : (
                    <>
                      <div className="dd-trip-idle">
                        <div className="dd-trip-idle-icon-wrap">
                          <Zap size={20} color="#fff" />
                        </div>
                        <div>
                          <div className="dd-trip-idle-title">Ready to start?</div>
                          <div className="dd-trip-idle-sub">Begin a trip to broadcast your live location to riders on your route.</div>
                        </div>
                      </div>
                      <Link to="/driver/trip" className="dd-btn-indigo">
                        <Navigation size={16} />
                        Start New Trip
                      </Link>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right col: trip history */}
          <div className="dd-col-right">
            <div className="dd-hist">
              <div className="dd-hist-head">
                <div className="dd-hist-head-label">
                  <Clock size={12} />
                  Trip History
                </div>
                {recentTrips.length > 0 && (
                  <span className="dd-hist-count">{recentTrips.length} trips</span>
                )}
              </div>
              <div className="dd-hist-body">
                {recentTrips.length === 0 ? (
                  <div className="dd-empty">No trips recorded yet</div>
                ) : (
                  recentTrips.map((trip) => {
                    const rName =
                      typeof trip.routeId === "object"
                        ? (trip.routeId as { name: string }).name
                        : "Unknown Route";
                    const isLive = trip.status === "ongoing";
                    return (
                      <div key={trip._id} className="dd-trip-row">
                        <div className={`dd-trip-icon ${isLive ? "dd-trip-icon-live" : "dd-trip-icon-done"}`}>
                          {isLive
                            ? <Navigation size={15} color="#16a34a" />
                            : <CheckCircle2 size={15} color="#94a3b8" />}
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div className="dd-trip-name">{rName}</div>
                          <div className="dd-trip-meta">
                            <Calendar size={10} />
                            {new Date(trip.startTime).toLocaleDateString("en-US", {
                              month: "short", day: "numeric", year: "numeric",
                            })}
                            {!isLive && trip.endTime && (
                              <><span>·</span><Clock size={10} />{fmtDuration(trip.startTime, trip.endTime)}</>
                            )}
                          </div>
                        </div>
                        <span className={isLive ? "dd-badge-live" : "dd-badge-done"}>
                          {isLive ? <><div className="dd-hero-dot-g" style={{ width: 6, height: 6 }} />Live</> : "Ended"}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
