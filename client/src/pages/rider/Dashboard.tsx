import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
  Circle,
} from "react-leaflet";
import L from "leaflet";
import {
  Bus,
  ArrowLeft,
  Loader2,
  Phone,
  Menu,
  X,
  Settings,
  User,
  LogOut,
  HelpCircle,
  Bell as BellIcon,
  Shield,
  ChevronRight,
  MapPin,
  Navigation,
  Zap,
  Radio,
} from "lucide-react";
import { routesApi, busesApi, remindersApi } from "@/services/api";
import { socketService } from "@/services/socket";
import { useBusStore } from "@/store/busStore";
import { useAuthStore } from "@/store/authStore";
import UserAvatar from "@/components/ui/UserAvatar";
import type { Route, Stop, BusLocation, Reminder } from "@/types";
import "./Dashboard.css";

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: () => void })
  ._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

function createBusIcon(label: string, isActive = false) {
  return L.divIcon({
    className: "",
    html: `<div style="position:relative;width:48px;height:56px;"><div style="width:48px;height:48px;background:${isActive ? "#f95f5f" : "#fbbf24"};border-radius:12px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,0.2);border:3px solid white;"><svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/></svg></div><div style="position:absolute;top:-8px;right:-8px;width:24px;height:24px;background:#38bdf8;border:2px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:white;box-shadow:0 2px 6px rgba(0,0,0,0.2);">${label}</div></div>`,
    iconSize: [48, 56],
    iconAnchor: [24, 48],
  });
}
const stopIcon = L.divIcon({
  className: "",
  html: `<div style="width:14px;height:14px;background:#6366f1;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(99,102,241,0.4);"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});
const userIcon = L.divIcon({
  className: "",
  html: `<div style="width:20px;height:20px;background:#3b82f6;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(59,130,246,0.5);"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

type ViewState = "select" | "preview" | "tracking";
interface BusWithRoute {
  _id: string;
  plateNumber: string;
  name: string;
  capacity: number;
  isActive: boolean;
  routeId: { _id: string; name: string } | string;
  driverId?:
    | { _id: string; name: string; email: string; phone?: string }
    | string;
}

function MapController({
  center,
  zoom,
  bounds,
}: {
  center?: [number, number];
  zoom?: number;
  bounds?: L.LatLngBoundsExpression;
}) {
  const map = useMap();
  useEffect(() => {
    if (bounds) map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    else if (center && zoom) map.setView(center, zoom);
  }, [map, center, zoom, bounds]);
  return null;
}

export default function RiderDashboard() {
  const { busLocations, updateBusLocation, removeBus } = useBusStore();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [view, setView] = useState<ViewState>("select");
  const [sheetExpanded, setSheetExpanded] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [buses, setBuses] = useState<BusWithRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBus, setSelectedBus] = useState<BusWithRoute | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null,
  );
  const defaultCenter: [number, number] = [31.5204, 74.3587];

  useEffect(() => {
    loadData();
    getUserLocation();
  }, []);

  const loadData = async () => {
    try {
      const [routesRes, busesRes] = await Promise.all([
        routesApi.getAll(true),
        busesApi.getAll({ active: true }),
      ]);
      setRoutes(routesRes.data.data);
      setBuses(busesRes.data.data);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getUserLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
      (err) => console.log("Geolocation not available:", err.message),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) socketService.connect(token);
    const unsubLocation = socketService.onBusLocation((data) =>
      updateBusLocation(data),
    );
    const unsubTripEnded = socketService.onTripEnded((data) =>
      removeBus(data.busId),
    );
    return () => {
      unsubLocation();
      unsubTripEnded();
    };
  }, [updateBusLocation, removeBus]);

  useEffect(() => {
    const joinAll = () => routes.forEach((r) => socketService.joinRoute(r._id));
    joinAll();
    const unsubConnected = socketService.onConnected(() => {
      joinAll();
    });
    return () => {
      routes.forEach((r) => socketService.leaveRoute(r._id));
      unsubConnected();
    };
  }, [routes]);

  const handleSelectBus = (bus: BusWithRoute) => {
    setSelectedBus(bus);
    const routeId =
      typeof bus.routeId === "object" ? bus.routeId._id : bus.routeId;
    const route = routes.find((r) => r._id === routeId);
    if (route) setSelectedRoute(route);
    setView("preview");
    setSheetExpanded(true);
  };
  const handleViewStops = () => {
    if (!selectedBus || !selectedRoute) return;
    setView("tracking");
    setSheetExpanded(true);
  };
  const handleBack = () => {
    if (view === "tracking") {
      setView("preview");
    } else if (view === "preview") {
      setView("select");
      setSelectedBus(null);
      setSelectedRoute(null);
    }
  };
  const getLiveBusLocation = (busId: string): BusLocation | undefined =>
    busLocations.get(busId);
  const getMapBounds = (): L.LatLngBoundsExpression | undefined => {
    if (view === "preview" || view === "tracking") {
      if (selectedRoute && selectedRoute.stops?.length > 0) {
        const points: [number, number][] = selectedRoute.stops.map((s) => [
          s.latitude,
          s.longitude,
        ]);
        if (selectedBus) {
          const live = getLiveBusLocation(selectedBus._id);
          if (live) points.push([live.latitude, live.longitude]);
        }
        if (userLocation) points.push(userLocation);
        return points as L.LatLngBoundsExpression;
      }
    }
    const points: [number, number][] = [];
    busLocations.forEach((loc) => points.push([loc.latitude, loc.longitude]));
    if (userLocation) points.push(userLocation);
    if (points.length >= 2) return points as L.LatLngBoundsExpression;
    return undefined;
  };
  const getRouteName = (bus: BusWithRoute): string => {
    if (typeof bus.routeId === "object" && bus.routeId) return bus.routeId.name;
    return routes.find((r) => r._id === bus.routeId)?.name || "";
  };
  const getBusLabel = (index: number): string =>
    String.fromCharCode(65 + (index % 26));
  const getDriverInfo = (
    bus: BusWithRoute,
  ): { name: string; phone?: string } | null => {
    if (typeof bus.driverId === "object" && bus.driverId)
      return { name: bus.driverId.name, phone: bus.driverId.phone };
    return null;
  };

  if (loading) {
    return (
      <div className="db-loading">
        <div className="db-loading-icon">
          <Bus size={28} color="#fff" />
        </div>
        <Loader2 size={20} color="#6366f1" className="animate-spin" />
        <span className="db-loading-text">Loading transit data…</span>
      </div>
    );
  }

  const mapBounds = getMapBounds();
  const mapCenter = userLocation || defaultCenter;

  const mapContent = (
    <MapContainer
      center={mapCenter}
      zoom={13}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      {mapBounds && <MapController bounds={mapBounds} />}
      {!mapBounds && <MapController center={mapCenter} zoom={13} />}
      {userLocation && (
        <>
          <Circle
            center={userLocation}
            radius={100}
            pathOptions={{
              color: "#3b82f6",
              fillColor: "#3b82f6",
              fillOpacity: 0.1,
              weight: 1,
            }}
          />
          <Marker position={userLocation} icon={userIcon}>
            <Popup>
              <span style={{ fontSize: 12, fontWeight: 600 }}>
                Your location
              </span>
            </Popup>
          </Marker>
        </>
      )}
      {(view === "preview" || view === "tracking") &&
        selectedRoute &&
        (selectedRoute.path && selectedRoute.path.length > 1 ? (
          <Polyline
            positions={selectedRoute.path}
            color="#0ea5e9"
            weight={5}
            opacity={0.9}
          />
        ) : selectedRoute.stops?.length > 1 ? (
          <Polyline
            positions={selectedRoute.stops.map(
              (s) => [s.latitude, s.longitude] as [number, number],
            )}
            color="#0ea5e9"
            weight={5}
            opacity={0.9}
          />
        ) : null)}
      {(view === "preview" || view === "tracking") &&
        selectedRoute?.stops?.map((stop) => (
          <Marker
            key={stop._id}
            position={[stop.latitude, stop.longitude]}
            icon={stopIcon}
          >
            <Popup>
              <div style={{ fontSize: 12 }}>
                <div style={{ fontWeight: 600 }}>{stop.name}</div>
                <div style={{ color: "#94a3b8" }}>
                  Stop #{stop.sequence + 1}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      {view === "select" &&
        buses.map((bus, idx) => {
          const live = getLiveBusLocation(bus._id);
          if (!live) return null;
          return (
            <Marker
              key={bus._id}
              position={[live.latitude, live.longitude]}
              icon={createBusIcon(getBusLabel(idx))}
              eventHandlers={{ click: () => handleSelectBus(bus) }}
            >
              <Popup>
                <div style={{ fontSize: 12 }}>
                  <div style={{ fontWeight: 600 }}>{bus.name}</div>
                  <div style={{ color: "#94a3b8" }}>{getRouteName(bus)}</div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      {(view === "preview" || view === "tracking") &&
        selectedBus &&
        (() => {
          const live = getLiveBusLocation(selectedBus._id);
          const idx = buses.findIndex((b) => b._id === selectedBus._id);
          if (!live) return null;
          return (
            <Marker
              position={[live.latitude, live.longitude]}
              icon={createBusIcon(getBusLabel(idx >= 0 ? idx : 0), true)}
            >
              <Popup>
                <div style={{ fontSize: 12 }}>
                  <div style={{ fontWeight: 600 }}>{selectedBus.name}</div>
                  {live.speed && (
                    <div style={{ color: "#94a3b8" }}>
                      {Math.round(live.speed)} km/h
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })()}
    </MapContainer>
  );

  const panelContent = (
    <>
      {view === "select" && (
        <BusSelectView
          buses={buses}
          getRouteName={getRouteName}
          getLiveBusLocation={getLiveBusLocation}
          onSelectBus={handleSelectBus}
        />
      )}
      {view === "preview" && selectedRoute && selectedBus && (
        <RoutePreviewView
          bus={selectedBus}
          route={selectedRoute}
          onViewStops={handleViewStops}
        />
      )}
      {view === "tracking" && selectedRoute && selectedBus && (
        <ActiveTrackingView
          bus={selectedBus}
          route={selectedRoute}
          getLiveBusLocation={getLiveBusLocation}
          getDriverInfo={getDriverInfo}
        />
      )}
    </>
  );

  const liveBusCount = buses.filter((b) => getLiveBusLocation(b._id)).length;

  const panelHead = (
    <div className="db-panel-head-row">
      <div className="db-panel-head-icon">
        {view === "select" ? (
          <Radio size={16} color="#6366f1" />
        ) : view === "preview" ? (
          <MapPin size={16} color="#6366f1" />
        ) : (
          <Navigation size={16} color="#6366f1" />
        )}
      </div>
      <div>
        <div className="db-panel-head-title">
          {view === "select"
            ? "Live Fleet"
            : view === "preview"
              ? "Route Preview"
              : "Live Tracking"}
        </div>
        <div className="db-panel-head-sub">
          {view === "select"
            ? `${liveBusCount} bus${liveBusCount !== 1 ? "es" : ""} active`
            : view === "preview" && selectedBus
              ? selectedBus.name
              : view === "tracking" && selectedBus
                ? selectedBus.name
                : "Safara Transit"}
        </div>
      </div>
      {view === "select" && liveBusCount > 0 && (
        <div className="db-live-badge">
          <div className="db-live-dot" />
          Live
        </div>
      )}
    </div>
  );

  return (
    <>
      <div className="db-root">
        <SidebarDrawer
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          user={user}
          onLogout={logout}
        />

        {/* Full-screen map */}
        <div className="db-map-bg">{mapContent}</div>

        {/* ── Top bar ── */}
        <header className="db-topbar">
          {view !== "select" ? (
            <button
              className="db-topbar-back-btn"
              onClick={handleBack}
              aria-label="Go back"
            >
              <ArrowLeft size={16} />
            </button>
          ) : (
            <button
              className="db-topbar-icon-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={18} />
            </button>
          )}

          <div className="db-topbar-logo">
            <div className="db-topbar-logo-icon">
              <Bus size={16} color="#fff" />
            </div>
            <span className="db-topbar-logo-text">Safara</span>
          </div>

          {view !== "select" && (
            <span className="db-topbar-subtitle">
              {view === "preview" ? selectedBus?.name : "Tracking"}
            </span>
          )}

          <div className="db-topbar-spacer" />

          <nav className="db-desk-nav">
            {(
              [
                { label: "Account", path: "/account", Icon: User },
                {
                  label: "Notifications",
                  path: "/notifications",
                  Icon: BellIcon,
                },
                { label: "Settings", path: "/settings", Icon: Settings },
              ] as const
            ).map(({ label, path, Icon }) => (
              <button
                key={path}
                className="db-desk-nav-btn"
                onClick={() => navigate(path)}
              >
                <Icon size={13} />
                {label}
              </button>
            ))}
            <button className="db-logout-btn" onClick={logout}>
              <LogOut size={13} />
              Logout
            </button>
          </nav>

          <button
            className="db-desk-user-chip"
            onClick={() => navigate("/account")}
          >
            <UserAvatar name={user?.name} avatar={user?.avatar} size="sm" />
            <span className="db-desk-user-name">
              {user?.name?.split(" ")[0] ?? "Account"}
            </span>
          </button>
        </header>

        {/* ── Mobile: floating bottom sheet ── */}
        <div className="db-sheet-wrap">
          <div
            className="db-sheet"
            style={{ maxHeight: sheetExpanded ? "62vh" : "90px" }}
          >
            <div
              className="db-sheet-handle-row"
              onClick={() => setSheetExpanded(!sheetExpanded)}
            >
              <div className="db-sheet-handle" />
            </div>
            <div className="db-sheet-body">{panelContent}</div>
          </div>
        </div>

        {/* ── Desktop: floating left panel ── */}
        <div className="db-panel-wrap">
          <div className="db-panel">
            <div className="db-panel-head">{panelHead}</div>
            <div className="db-panel-body">{panelContent}</div>
          </div>
        </div>
      </div>
    </>
  );
}

function BusSelectView({
  buses,
  getRouteName,
  getLiveBusLocation,
  onSelectBus,
}: {
  buses: BusWithRoute[];
  getRouteName: (bus: BusWithRoute) => string;
  getLiveBusLocation: (busId: string) => BusLocation | undefined;
  onSelectBus: (bus: BusWithRoute) => void;
}) {
  const liveBuses = buses.filter((b) => getLiveBusLocation(b._id));
  const inactiveBuses = buses.filter((b) => !getLiveBusLocation(b._id));

  if (buses.length === 0) {
    return (
      <div className="db-empty">
        <div className="db-empty-icon">
          <Bus size={24} color="#6366f1" />
        </div>
        <div className="db-empty-title">No buses available</div>
        <div className="db-empty-sub">Check back later for active routes</div>
      </div>
    );
  }

  return (
    <div className="db-bus-list">
      {liveBuses.length > 0 && (
        <>
          <div className="db-section-label">On-route now</div>
          {liveBuses.map((bus) => (
            <button
              key={bus._id}
              className="db-bus-card db-bus-card-live"
              onClick={() => onSelectBus(bus)}
            >
              <div className="db-bus-card-icon">
                <Bus size={18} color="#6366f1" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="db-bus-name">{bus.name}</div>
                <div className="db-bus-status-row">
                  <div className="db-bus-pulse">
                    <div className="db-bus-pulse-dot" />
                    <div className="db-bus-pulse-ring" />
                  </div>
                  <span className="db-bus-live-label">Live · On route</span>
                </div>
              </div>
              {getRouteName(bus) && (
                <span className="db-bus-route-badge">{getRouteName(bus)}</span>
              )}
              <ChevronRight
                size={15}
                color="#6366f1"
                style={{ flexShrink: 0 }}
              />
            </button>
          ))}
        </>
      )}
      {inactiveBuses.length > 0 && (
        <>
          <div className="db-section-label">Inactive</div>
          {inactiveBuses.map((bus) => (
            <button
              key={bus._id}
              className="db-bus-card db-bus-card-inactive"
              onClick={() => onSelectBus(bus)}
            >
              <div className="db-bus-card-icon db-bus-card-icon-inactive">
                <Bus size={18} color="#334155" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className={`db-bus-name db-bus-name-inactive`}>
                  {bus.name}
                </div>
                <div style={{ fontSize: 12, color: "#334155" }}>
                  Not currently active
                </div>
              </div>
              {getRouteName(bus) && (
                <span
                  className={`db-bus-route-badge db-bus-route-badge-inactive`}
                >
                  {getRouteName(bus)}
                </span>
              )}
            </button>
          ))}
        </>
      )}
    </div>
  );
}

function RoutePreviewView({
  bus,
  route,
  onViewStops,
}: {
  bus: BusWithRoute;
  route: Route;
  onViewStops: () => void;
}) {
  const stops = route.stops || [];
  return (
    <div style={{ paddingTop: 8, paddingBottom: 8 }}>
      <div className="db-preview-head">
        <div className="db-preview-bus-icon">
          <Bus size={18} color="#6366f1" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="db-preview-bus-name">{bus.name}</div>
          <div className="db-preview-route-name">{route.name}</div>
        </div>
        <span className="db-stops-badge">{stops.length} stops</span>
      </div>

      {stops.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "24px 0",
            color: "#475569",
            fontSize: 13,
          }}
        >
          No stops on this route
        </div>
      ) : (
        <div className="db-timeline">
          <div className="db-timeline-line" />
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {stops.map((stop, index) => {
              const isFirst = index === 0;
              const isLast = index === stops.length - 1;
              const dotSize = isFirst || isLast ? 16 : 12;
              const dotStyle: React.CSSProperties = {
                width: dotSize,
                height: dotSize,
                background: isFirst ? "#fff" : isLast ? "#ef4444" : "#0ea5e9",
                border: isFirst
                  ? "3px solid #6366f1"
                  : isLast
                    ? "3px solid #ef4444"
                    : "2px solid #0ea5e9",
                boxShadow: isFirst ? "0 0 0 3px rgba(99,102,241,0.15)" : "none",
                marginLeft: isFirst || isLast ? -1 : 1,
                marginTop: isFirst || isLast ? 0 : 2,
              };
              return (
                <div key={stop._id} className="db-timeline-row">
                  <div
                    className="db-timeline-dot-wrap"
                    style={{ top: isFirst || isLast ? 4 : 6 }}
                  >
                    <div className="db-timeline-dot" style={dotStyle} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      className={
                        isFirst
                          ? "db-timeline-name-first"
                          : isLast
                            ? "db-timeline-name-last"
                            : "db-timeline-name"
                      }
                    >
                      {stop.name}
                    </div>
                    {stop.estimatedArrivalTime && (
                      <div
                        style={{
                          fontSize: 11.5,
                          color: "#334155",
                          marginTop: 1,
                        }}
                      >
                        {stop.estimatedArrivalTime}
                      </div>
                    )}
                  </div>
                  {isFirst && (
                    <span
                      className="db-timeline-tag"
                      style={{
                        background: "rgba(99,102,241,0.15)",
                        color: "#a5b4fc",
                      }}
                    >
                      Start
                    </span>
                  )}
                  {isLast && stops.length > 1 && (
                    <span
                      className="db-timeline-tag"
                      style={{
                        background: "rgba(239,68,68,0.12)",
                        color: "#f87171",
                      }}
                    >
                      End
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <button className="db-track-btn" onClick={onViewStops}>
        <Zap size={15} /> Track Live
      </button>
    </div>
  );
}

function ActiveTrackingView({
  bus,
  route,
  getLiveBusLocation,
  getDriverInfo,
}: {
  bus: BusWithRoute;
  route: Route;
  getLiveBusLocation: (busId: string) => BusLocation | undefined;
  getDriverInfo: (bus: BusWithRoute) => { name: string; phone?: string } | null;
}) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [reminderPopup, setReminderPopup] = useState<string | null>(null);
  const [reminderMinutes, setReminderMinutes] = useState(5);
  const [savingReminder, setSavingReminder] = useState(false);

  useEffect(() => {
    loadReminders();
  }, []);

  const loadReminders = async () => {
    try {
      const res = await remindersApi.getMyReminders();
      setReminders(res.data.data || []);
    } catch {}
  };

  const handleSetReminder = async (stopId: string, minutesBefore: number) => {
    setSavingReminder(true);
    try {
      const existing = reminders.find((r) => {
        const sId =
          typeof r.stopId === "object" ? (r.stopId as Stop)._id : r.stopId;
        return sId === stopId;
      });
      if (existing) {
        await remindersApi.update(existing._id, { minutesBefore });
      } else {
        await remindersApi.create({
          stopId,
          routeId: route._id,
          minutesBefore,
        });
      }
      await loadReminders();
      setReminderPopup(null);
    } catch {
    } finally {
      setSavingReminder(false);
    }
  };

  const handleRemoveReminder = async (stopId: string) => {
    try {
      const existing = reminders.find((r) => {
        const sId =
          typeof r.stopId === "object" ? (r.stopId as Stop)._id : r.stopId;
        return sId === stopId;
      });
      if (existing) {
        await remindersApi.delete(existing._id);
        await loadReminders();
        setReminderPopup(null);
      }
    } catch {}
  };

  const busLocation = getLiveBusLocation(bus._id);
  const driver = getDriverInfo(bus);
  const stops = route.stops || [];
  const routePath = route.path;
  const currentIdx = getCurrentStopIndex(stops, busLocation, routePath);
  const etaMinutes = estimateETA(stops, currentIdx);
  const etaDisplay = formatETA(etaMinutes);

  return (
    <div style={{ paddingTop: 8, paddingBottom: 20 }}>
      {driver && (
        <div className="db-driver-card">
          <div>
            <div className="db-driver-label">Driver</div>
            <div className="db-driver-name">{driver.name}</div>
          </div>
          {driver.phone && (
            <a href={`tel:${driver.phone}`} className="db-call-btn">
              <Phone size={13} />
              {driver.phone}
            </a>
          )}
        </div>
      )}

      <div className="db-eta-card">
        <div style={{ flex: 1 }}>
          <div className="db-eta-label">Estimated Arrival</div>
          <div className="db-eta-time">{etaDisplay}</div>
          <div className="db-eta-hint">
            {etaMinutes === 0 ? "Arriving now" : `~${etaMinutes} min away`}
          </div>
        </div>
        {busLocation?.speed != null && (
          <div className="db-speed-chip">
            <div className="db-speed-val">{Math.round(busLocation.speed)}</div>
            <div className="db-speed-unit">km/h</div>
          </div>
        )}
      </div>

      <div className="db-stops-label">Stops</div>
      <div>
        {stops.map((stop, index) => {
          const isCurrent = index === currentIdx;
          const isPassed = index < currentIdx;
          const reminderData = reminders.find((r) => {
            const sId =
              typeof r.stopId === "object" ? (r.stopId as Stop)._id : r.stopId;
            return sId === stop._id;
          });
          const hasReminder = !!reminderData;
          return (
            <div key={stop._id} className="db-stop-row">
              <div className="db-stop-spine">
                <div
                  className={
                    isCurrent
                      ? "db-stop-dot-current"
                      : isPassed
                        ? "db-stop-dot-passed"
                        : "db-stop-dot-future"
                  }
                />
                {index < stops.length - 1 && (
                  <div
                    className={
                      isPassed ? "db-stop-line-passed" : "db-stop-line-future"
                    }
                  />
                )}
              </div>
              <div className="db-stop-content">
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <div>
                    <div
                      className={
                        isCurrent
                          ? "db-stop-name-current"
                          : isPassed
                            ? "db-stop-name-passed"
                            : "db-stop-name-future"
                      }
                    >
                      {stop.name}
                    </div>
                    {isCurrent && (
                      <div className="db-stop-here-tag">Bus is here</div>
                    )}
                    {hasReminder && (
                      <div className="db-stop-reminder-tag">
                        Alert {reminderData?.minutesBefore} min before
                      </div>
                    )}
                    {stop.estimatedArrivalTime && (
                      <div className="db-stop-eta-tag">
                        ETA: {stop.estimatedArrivalTime}
                      </div>
                    )}
                  </div>
                  {!isPassed && (
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      <button
                        onClick={() => {
                          if (reminderPopup === stop._id)
                            setReminderPopup(null);
                          else {
                            setReminderMinutes(
                              reminderData?.minutesBefore || 5,
                            );
                            setReminderPopup(stop._id);
                          }
                        }}
                        title={hasReminder ? "Edit reminder" : "Set reminder"}
                        className={`db-bell-btn ${hasReminder ? "db-bell-btn-active" : "db-bell-btn-idle"}`}
                      >
                        <BellIcon size={14} />
                      </button>
                      {reminderPopup === stop._id && (
                        <div className="db-reminder-popup">
                          <div className="db-reminder-title">Set Alert</div>
                          <div className="db-reminder-sub">
                            Notify when bus is approaching this stop.
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              color: "#475569",
                              marginBottom: 8,
                            }}
                          >
                            Minutes before arrival
                          </div>
                          <div className="db-reminder-opts">
                            {[2, 5, 10, 15].map((m) => (
                              <button
                                key={m}
                                onClick={() => setReminderMinutes(m)}
                                className={`db-reminder-opt-btn ${reminderMinutes === m ? "db-reminder-opt-active" : "db-reminder-opt-idle"}`}
                              >
                                {m}m
                              </button>
                            ))}
                          </div>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button
                              onClick={() =>
                                handleSetReminder(stop._id, reminderMinutes)
                              }
                              disabled={savingReminder}
                              className="db-reminder-save-btn"
                              style={{ opacity: savingReminder ? 0.7 : 1 }}
                            >
                              {savingReminder
                                ? "Saving..."
                                : hasReminder
                                  ? "Update"
                                  : "Set Alert"}
                            </button>
                            {hasReminder && (
                              <button
                                onClick={() => handleRemoveReminder(stop._id)}
                                className="db-reminder-remove-btn"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SidebarDrawer({
  open,
  onClose,
  user,
  onLogout,
}: {
  open: boolean;
  onClose: () => void;
  user: ReturnType<typeof useAuthStore.getState>["user"];
  onLogout: () => void;
}) {
  const navigate = useNavigate();
  const menuItems = [
    { icon: User, label: "My Account", path: "/account" },
    { icon: BellIcon, label: "Notifications", path: "/notifications" },
    { icon: Settings, label: "Settings", path: "/settings" },
    { icon: HelpCircle, label: "Help & Support", path: "/help" },
    { icon: Shield, label: "Privacy Policy", path: "/privacy" },
  ];
  return (
    <>
      <div
        className="db-sidebar-overlay"
        onClick={onClose}
        style={{ opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none" }}
      />
      <div
        className="db-sidebar"
        style={{ transform: open ? "translateX(0)" : "translateX(-100%)" }}
      >
        <div className="db-sidebar-hero">
          <button className="db-sidebar-close" onClick={onClose}>
            <X size={16} />
          </button>
          <UserAvatar name={user?.name} avatar={user?.avatar} size="lg" />
          <div className="db-sidebar-name">{user?.name || "User"}</div>
          <div className="db-sidebar-email">{user?.email}</div>
          <span className="db-sidebar-role">{user?.role || "Rider"}</span>
        </div>
        <nav className="db-sidebar-nav">
          {menuItems.map(({ icon: Icon, label, path }) => (
            <button
              key={path}
              className="db-sidebar-item"
              onClick={() => {
                navigate(path);
                onClose();
              }}
            >
              <Icon size={17} color="#334155" />
              <span className="db-sidebar-item-label">{label}</span>
              <ChevronRight size={14} color="#1e293b" />
            </button>
          ))}
        </nav>
        <div className="db-sidebar-footer">
          <button
            className="db-sidebar-logout"
            onClick={() => {
              onLogout();
              onClose();
            }}
          >
            <LogOut size={16} />
            <span>Log out</span>
          </button>
        </div>
        <div className="db-sidebar-version">Safara v1.0.0</div>
      </div>
    </>
  );
}

function findClosestPointIndex(
  path: [number, number][],
  pos: [number, number],
): number {
  let minDist = Infinity,
    closestIdx = 0;
  for (let i = 0; i < path.length; i++) {
    const dist = haversineDistance(pos[0], pos[1], path[i][0], path[i][1]);
    if (dist < minDist) {
      minDist = dist;
      closestIdx = i;
    }
  }
  return closestIdx;
}

function getCurrentStopIndex(
  stops: Stop[],
  busLocation?: BusLocation,
  routePath?: [number, number][],
): number {
  if (!busLocation || stops.length === 0) return 0;
  const busPos: [number, number] = [
    busLocation.latitude,
    busLocation.longitude,
  ];
  if (routePath && routePath.length > 1) {
    const busPathIdx = findClosestPointIndex(routePath, busPos);
    let currentStopIdx = 0;
    for (let i = 0; i < stops.length; i++) {
      const stopPathIdx = findClosestPointIndex(routePath, [
        stops[i].latitude,
        stops[i].longitude,
      ]);
      const distToStop = haversineDistance(
        busLocation.latitude,
        busLocation.longitude,
        stops[i].latitude,
        stops[i].longitude,
      );
      if (busPathIdx > stopPathIdx && distToStop > 200) {
        currentStopIdx = Math.min(i + 1, stops.length - 1);
      } else break;
    }
    return currentStopIdx;
  }
  const NEAR_THRESHOLD = 500;
  let closestIndex = 0,
    minDist = Infinity;
  stops.forEach((stop, index) => {
    const dist = haversineDistance(
      busLocation.latitude,
      busLocation.longitude,
      stop.latitude,
      stop.longitude,
    );
    if (dist < minDist) {
      minDist = dist;
      closestIndex = index;
    }
  });
  if (minDist > NEAR_THRESHOLD) return 0;
  return closestIndex;
}

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371e3;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1),
    dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function estimateETA(stops: Stop[], currentIndex: number): number {
  return Math.max(0, stops.length - 1 - currentIndex) * 3;
}

function formatETA(minutes: number): string {
  const hrs = Math.floor(minutes / 60),
    mins = minutes % 60;
  return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}
