import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMap,
  Popup,
} from "react-leaflet";
import L from "leaflet";
import {
  Navigation,
  Square,
  MapPin,
  Loader2,
  AlertCircle,
  Gauge,
  Locate,
  Bus,
} from "lucide-react";
import { tripsApi, routesApi } from "@/services/api";
import { socketService } from "@/services/socket";
import type { Bus as BusType, Route, Stop } from "@/types";

// â”€â”€â”€ CSS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const CSS = `
  @keyframes at-pulse {
    0% { transform: translate(-50%,-50%) scale(1); opacity: 0.6; }
    100% { transform: translate(-50%,-50%) scale(2.5); opacity: 0; }
  }
  @keyframes at-fade-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }

  /* â”€â”€ Root: full screen â”€â”€ */
  .at-root { position: fixed; inset: 0; display: flex; flex-direction: column; overflow: hidden; background: #f5f7fa; }

  /* â”€â”€ Top bar â”€â”€ */
  .at-topbar {
    height: 60px; display: flex; align-items: center; gap: 12px; padding: 0 16px;
    background: #fff; border-bottom: 1px solid #e8edf2;
    box-shadow: 0 1px 8px rgba(0,0,0,0.06); flex-shrink: 0; z-index: 100;
  }
  .at-topbar-icon-nav {
    width: 38px; height: 38px; border-radius: 12px; flex-shrink: 0;
    background: linear-gradient(135deg, #6366f1 0%, #818cf8 100%);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 12px rgba(99,102,241,0.3);
  }
  .at-topbar-icon-bus {
    width: 38px; height: 38px; border-radius: 12px; flex-shrink: 0;
    background: #eef2ff; border: 1px solid #c7d2fe;
    display: flex; align-items: center; justify-content: center;
  }
  .at-topbar-label { font-size: 10.5px; font-weight: 600; color: #94a3b8; }
  .at-topbar-val { font-size: 14px; font-weight: 700; color: #0f172a; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .at-topbar-dist { font-size: 15px; font-weight: 800; color: #6366f1; }
  .at-topbar-speed { font-size: 11.5px; color: #94a3b8; display: flex; align-items: center; gap: 3px; margin-top: 2px; }
  .at-start-btn {
    display: flex; align-items: center; gap: 7px; padding: 9px 18px;
    border-radius: 12px; border: none; flex-shrink: 0;
    background: linear-gradient(135deg, #6366f1 0%, #818cf8 100%);
    color: #fff; font-size: 13px; font-weight: 700; cursor: pointer;
    box-shadow: 0 4px 14px rgba(99,102,241,0.35); transition: opacity 0.15s;
  }
  .at-start-btn:hover { opacity: 0.9; }
  .at-start-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  /* â”€â”€ Map area â”€â”€ */
  .at-map-area { flex: 1; position: relative; overflow: hidden; }

  /* â”€â”€ Alerts â”€â”€ */
  .at-alert {
    position: absolute; top: 12px; left: 12px; right: 12px; z-index: 1001;
    padding: 10px 14px; border-radius: 12px; font-size: 13px; font-weight: 600;
    background: #fff5f5; border: 1px solid #fecaca; color: #ef4444;
    box-shadow: 0 4px 16px rgba(0,0,0,0.1); animation: at-fade-in 0.2s ease;
  }
  .at-alert-warn { background: #fffbeb; border-color: #fde68a; color: #b45309; }

  /* â”€â”€ Re-center button â”€â”€ */
  .at-recenter {
    position: absolute; bottom: 172px; right: 14px; z-index: 1001;
    width: 44px; height: 44px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; box-shadow: 0 2px 12px rgba(0,0,0,0.12);
    border: 1px solid #e2e8f0; transition: background 0.15s;
  }
  .at-recenter-on { background: #6366f1; border-color: #6366f1; color: #fff; }
  .at-recenter-off { background: #fff; color: #475569; }

  /* â”€â”€ Mobile: bottom stop strip â”€â”€ */
  .at-strip {
    position: absolute; bottom: 0; left: 0; right: 0; z-index: 1001;
    background: #fff; border-top: 1px solid #e8edf2;
    box-shadow: 0 -4px 24px rgba(0,0,0,0.08);
    padding: 12px 16px 22px; animation: at-fade-in 0.3s ease;
  }
  .at-strip-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
  .at-strip-label { font-size: 10.5px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; }
  .at-end-btn {
    display: flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 10px;
    background: #fff5f5; border: 1px solid #fecaca; color: #ef4444;
    font-size: 12.5px; font-weight: 700; cursor: pointer; transition: background 0.15s;
  }
  .at-end-btn:hover { background: #fee2e2; }
  .at-end-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .at-stop-chip {
    display: flex; align-items: center; gap: 5px;
    padding: 7px 12px; border-radius: 10px; flex-shrink: 0; font-size: 12.5px; font-weight: 600;
  }
  .at-stop-chip-next { background: #eef2ff; border: 1px solid #c7d2fe; color: #4f46e5; }
  .at-stop-chip-future { background: #f8fafc; border: 1px solid #e2e8f0; color: #475569; }

  /* â”€â”€ Desktop: floating left panel â”€â”€ */
  .at-panel { display: none; }

  @media (min-width: 768px) {
    .at-topbar { height: 64px; padding: 0 28px; }
    .at-recenter { bottom: 24px; right: 24px; }
    .at-strip { display: none; }
    .at-panel {
      display: flex; flex-direction: column;
      position: absolute; top: 16px; left: 16px; bottom: 16px; z-index: 1001;
      width: 340px; pointer-events: none;
    }
    .at-panel-inner {
      pointer-events: auto; flex: 1; display: flex; flex-direction: column;
      background: #fff; border-radius: 20px; border: 1px solid #e8edf2;
      box-shadow: 0 8px 40px rgba(0,0,0,0.1); overflow: hidden;
    }
    .at-panel-head {
      padding: 18px 20px; border-bottom: 1px solid rgba(99,102,241,0.1);
      flex-shrink: 0;
      background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f2a4a 100%);
    }
    .at-panel-bus-row { display: flex; align-items: center; gap: 10px; }
    .at-panel-bus-icon {
      width: 38px; height: 38px; border-radius: 11px; flex-shrink: 0;
      background: rgba(99,102,241,0.2); border: 1px solid rgba(99,102,241,0.3);
      display: flex; align-items: center; justify-content: center;
    }
    .at-panel-bus-name { font-size: 15px; font-weight: 800; color: #f1f5f9; }
    .at-panel-bus-sub { font-size: 12px; color: #64748b; margin-top: 1px; }
    .at-panel-body { flex: 1; overflow-y: auto; padding: 14px 16px 16px; }
  }
  @media (min-width: 1200px) {
    .at-panel { width: 380px; left: 24px; }
  }

  /* â”€â”€ Panel cards â”€â”€ */
  .at-next-card {
    border-radius: 14px; padding: 14px 16px; margin-bottom: 12px;
    background: #eef2ff; border: 1px solid #c7d2fe;
  }
  .at-next-label { font-size: 10px; font-weight: 700; color: #6366f1; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px; }
  .at-next-name { font-size: 15px; font-weight: 800; color: #0f172a; }
  .at-next-sub { font-size: 12px; color: #94a3b8; margin-top: 3px; }
  .at-metrics { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px; }
  .at-metric {
    background: #f8fafc; border: 1px solid #e8edf2;
    border-radius: 12px; padding: 10px 12px;
  }
  .at-metric-label { font-size: 10px; font-weight: 600; color: #94a3b8; margin-bottom: 3px; }
  .at-metric-val { font-size: 18px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em; }
  .at-metric-unit { font-size: 10px; font-weight: 600; color: #94a3b8; }
  .at-stops-label {
    font-size: 10.5px; font-weight: 700; color: #94a3b8;
    text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;
  }
  .at-pstop-row {
    display: flex; align-items: flex-start; gap: 10px;
    padding: 8px 0; border-bottom: 1px solid #f8fafc;
  }
  .at-pstop-row:last-child { border-bottom: none; }
  .at-pstop-dot-next {
    width: 10px; height: 10px; border-radius: 50%; background: #6366f1;
    border: 2px solid #c7d2fe; flex-shrink: 0; margin-top: 3px;
  }
  .at-pstop-dot-future {
    width: 8px; height: 8px; border-radius: 50%; background: transparent;
    border: 2px solid #e2e8f0; flex-shrink: 0; margin-top: 4px;
  }
  .at-pstop-name-next { font-size: 13px; font-weight: 700; color: #4f46e5; }
  .at-pstop-name-future { font-size: 13px; font-weight: 500; color: #475569; }
  .at-panel-end-btn {
    display: flex; align-items: center; justify-content: center; gap: 7px;
    width: 100%; padding: 12px 0; border-radius: 13px; cursor: pointer;
    background: #fff5f5; border: 1px solid #fecaca; color: #ef4444;
    font-size: 13.5px; font-weight: 700; margin-top: 12px; transition: background 0.15s;
  }
  .at-panel-end-btn:hover { background: #fee2e2; }
  .at-panel-end-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .at-panel-start-btn {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    width: 100%; padding: 13px 0; border-radius: 13px; border: none; cursor: pointer;
    background: linear-gradient(135deg, #6366f1 0%, #818cf8 100%);
    color: #fff; font-size: 14px; font-weight: 700; margin-top: 12px;
    box-shadow: 0 4px 16px rgba(99,102,241,0.35); transition: opacity 0.15s;
  }
  .at-panel-start-btn:hover { opacity: 0.9; }
  .at-panel-start-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .at-panel-no-route {
    background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px;
    padding: 12px 14px; font-size: 13px; color: #92400e; margin-top: 10px;
  }

  /* â”€â”€ Loading / error states â”€â”€ */
  .at-loading {
    position: fixed; inset: 0; display: flex; align-items: center; justify-content: center;
    background: #f5f7fa;
  }
  .at-no-bus {
    position: fixed; inset: 0; display: flex; flex-direction: column;
    align-items: center; justify-content: center; background: #f5f7fa;
    padding: 32px; text-align: center; gap: 12px;
  }
  .at-no-bus-icon {
    width: 64px; height: 64px; border-radius: 20px; margin-bottom: 8px;
    background: #eef2ff; border: 1px solid #c7d2fe;
    display: flex; align-items: center; justify-content: center;
  }
  .at-no-bus-title { font-size: 20px; font-weight: 800; color: #0f172a; }
  .at-no-bus-sub { font-size: 14px; color: #94a3b8; }
`;

// â”€â”€â”€ Custom Icons â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function createDriverIcon(heading: number) {
  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative;width:48px;height:48px;">
        <div style="
          position:absolute;top:-12px;left:50%;transform:translateX(-50%) rotate(${heading}deg);
          width:0;height:0;
          border-left:16px solid transparent;
          border-right:16px solid transparent;
          border-bottom:24px solid rgba(99,102,241,0.25);
          transform-origin:bottom center;
        "></div>
        <div style="
          position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
          width:24px;height:24px;
          background:#6366f1;
          border-radius:50%;
          border:4px solid white;
          box-shadow:0 2px 12px rgba(99,102,241,0.5);
        "></div>
        <div style="
          position:absolute;top:50%;left:50%;
          width:40px;height:40px;
          border-radius:50%;
          border:2px solid rgba(99,102,241,0.3);
          animation:at-pulse 2s ease-out infinite;
        "></div>
      </div>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
  });
}

const stopIcon = L.divIcon({
  className: "",
  html: `<div style="width:14px;height:14px;background:white;border-radius:50%;border:3px solid #0ea5e9;box-shadow:0 2px 6px rgba(0,0,0,0.2);"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const nextStopIcon = L.divIcon({
  className: "",
  html: `<div style="width:22px;height:22px;background:#6366f1;border-radius:50%;border:4px solid white;box-shadow:0 2px 8px rgba(99,102,241,0.5);"></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

// â”€â”€â”€ Auto-follow map helper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function AutoFollowMap({
  position,
  heading,
  followMode,
}: {
  position: [number, number];
  heading: number;
  followMode: boolean;
}) {
  const map = useMap();
  useEffect(() => {
    if (followMode && position) {
      map.setView(position, Math.max(map.getZoom(), 16), { animate: true });
    }
  }, [map, position, followMode, heading]);
  return null;
}

// â”€â”€â”€ Geometry helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371e3;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function findClosestPointOnPath(
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

function getNextStopIndex(
  stops: Stop[],
  position: [number, number],
  routePath?: [number, number][],
): number {
  if (!position || stops.length === 0) return 0;
  if (routePath && routePath.length > 1) {
    const busPathIdx = findClosestPointOnPath(routePath, position);
    let nextIdx = 0;
    for (let i = 0; i < stops.length; i++) {
      const stopPathIdx = findClosestPointOnPath(routePath, [
        stops[i].latitude,
        stops[i].longitude,
      ]);
      const distToStop = haversineDistance(
        position[0],
        position[1],
        stops[i].latitude,
        stops[i].longitude,
      );
      if (busPathIdx > stopPathIdx && distToStop > 150) {
        nextIdx = Math.min(i + 1, stops.length - 1);
      } else {
        break;
      }
    }
    return nextIdx;
  }
  let closestIdx = 0,
    minDist = Infinity;
  stops.forEach((stop, idx) => {
    const dist = haversineDistance(
      position[0],
      position[1],
      stop.latitude,
      stop.longitude,
    );
    if (dist < minDist) {
      minDist = dist;
      closestIdx = idx;
    }
  });
  if (minDist > 500) return 0;
  if (minDist < 100 && closestIdx < stops.length - 1) return closestIdx + 1;
  return closestIdx;
}

// â”€â”€â”€ Main Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function ActiveTrip() {
  const navigate = useNavigate();
  const [bus, setBus] = useState<BusType | null>(null);
  const [route, setRoute] = useState<Route | null>(null);
  const [tripActive, setTripActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [ending, setEnding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [followMode, setFollowMode] = useState(true);

  const [position, setPosition] = useState<[number, number] | null>(null);
  const [speed, setSpeed] = useState<number>(0);
  const [heading, setHeading] = useState<number>(0);
  const [locationError, setLocationError] = useState<string | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const sendIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const latestPositionRef = useRef<[number, number] | null>(null);
  const latestSpeedRef = useRef(0);
  const latestHeadingRef = useRef(0);
  const lastSendTimeRef = useRef(0);

  useEffect(() => {
    loadData();

    const unsubTripEnded = socketService.onTripEnded((data) => {
      console.log("Trip ended event received:", data);
      stopLocationTracking();
      setTripActive(false);
      navigate("/driver");
    });

    const handleError = (error: unknown) => {
      const err = error as { message?: string };
      console.error("Socket error:", err.message || "Unknown error");
      setError(err.message || "An error occurred");
    };
    socketService.on("error", handleError);

    return () => {
      stopLocationTracking();
      unsubTripEnded();
      socketService.off("error", handleError);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      const [busRes, tripRes] = await Promise.all([
        tripsApi.getMyBus().catch(() => ({ data: { data: null } })),
        tripsApi.getCurrent(),
      ]);
      setBus(busRes.data.data);
      if (busRes.data.data?.routeId) {
        const routeId =
          typeof busRes.data.data.routeId === "object"
            ? (busRes.data.data.routeId as { _id: string })._id
            : busRes.data.data.routeId;
        const routeRes = await routesApi.getById(routeId);
        setRoute(routeRes.data.data);
      }
      if (tripRes.data.data) {
        setTripActive(true);
        startLocationTracking();
      }
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  };

  const startLocationTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported");
      return;
    }
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const newPos: [number, number] = [
          pos.coords.latitude,
          pos.coords.longitude,
        ];
        setPosition(newPos);
        latestPositionRef.current = newPos;
        const spd = pos.coords.speed ? pos.coords.speed * 3.6 : 0;
        setSpeed(spd);
        latestSpeedRef.current = spd;
        const hdg = pos.coords.heading || 0;
        setHeading(hdg);
        latestHeadingRef.current = hdg;
        setLocationError(null);
        const now = Date.now();
        if (now - lastSendTimeRef.current >= 3000) {
          lastSendTimeRef.current = now;
          socketService.sendLocation(newPos[0], newPos[1], spd, hdg);
        }
      },
      (err) => setLocationError(err.message),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
    sendIntervalRef.current = setInterval(() => {
      if (latestPositionRef.current) {
        const now = Date.now();
        if (now - lastSendTimeRef.current >= 3000) {
          lastSendTimeRef.current = now;
          socketService.sendLocation(
            latestPositionRef.current[0],
            latestPositionRef.current[1],
            latestSpeedRef.current,
            latestHeadingRef.current,
          );
        }
      }
    }, 5000);
  }, []);

  const stopLocationTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (sendIntervalRef.current) {
      clearInterval(sendIntervalRef.current);
      sendIntervalRef.current = null;
    }
  };

  const handleStartTrip = async () => {
    if (!bus) return;
    const routeId =
      typeof bus.routeId === "object"
        ? (bus.routeId as { _id: string })._id
        : bus.routeId;
    if (!routeId) {
      setError("No route assigned to your bus");
      return;
    }
    setStarting(true);
    setError(null);
    try {
      socketService.startTrip(bus._id, routeId);
      setTripActive(true);
      startLocationTracking();
    } catch (err) {
      setError("Failed to start trip");
      console.error(err);
    } finally {
      setStarting(false);
    }
  };

  const handleEndTrip = async () => {
    if (!confirm("Are you sure you want to end this trip?")) return;
    setEnding(true);
    try {
      socketService.endTrip();
      stopLocationTracking();
      setTripActive(false);
      navigate("/driver");
    } catch (err) {
      setError("Failed to end trip");
      console.error(err);
    } finally {
      setEnding(false);
    }
  };

  // â”€â”€â”€ Derived data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const stops = useMemo(() => route?.stops || [], [route]);
  const routePath: [number, number][] = useMemo(() => {
    if (route?.path && route.path.length > 1) return route.path;
    if (stops.length > 1)
      return stops.map((s) => [s.latitude, s.longitude] as [number, number]);
    return [];
  }, [route, stops]);

  const nextStopIdx = useMemo(
    () => (position ? getNextStopIndex(stops, position, routePath) : 0),
    [stops, position, routePath],
  );
  const nextStop = stops[nextStopIdx] || null;
  const distToNextStop = useMemo(() => {
    if (!position || !nextStop) return null;
    return Math.round(
      haversineDistance(
        position[0],
        position[1],
        nextStop.latitude,
        nextStop.longitude,
      ),
    );
  }, [position, nextStop]);

  const { coveredPath, remainingPath } = useMemo(() => {
    if (!position || routePath.length === 0)
      return {
        coveredPath: [] as [number, number][],
        remainingPath: routePath,
      };
    const closestIdx = findClosestPointOnPath(routePath, position);
    return {
      coveredPath: routePath.slice(0, closestIdx + 1),
      remainingPath: routePath.slice(closestIdx),
    };
  }, [routePath, position]);

  const driverIcon = useMemo(() => createDriverIcon(heading), [heading]);

  // â”€â”€â”€ Loading / no-bus states â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  if (loading) {
    return (
      <>
        <style>{CSS}</style>
        <div className="at-loading">
          <Loader2 size={28} color="#6366f1" className="animate-spin" />
        </div>
      </>
    );
  }

  if (!bus) {
    return (
      <>
        <style>{CSS}</style>
        <div className="at-no-bus">
          <div className="at-no-bus-icon">
            <AlertCircle size={28} color="#6366f1" />
          </div>
          <div className="at-no-bus-title">No Bus Assigned</div>
          <div className="at-no-bus-sub">
            You need a bus assigned to start a trip.
          </div>
        </div>
      </>
    );
  }

  const center: [number, number] =
    position ||
    (stops.length > 0
      ? [stops[0].latitude, stops[0].longitude]
      : [31.5204, 74.3587]);

  const distLabel =
    distToNextStop !== null
      ? distToNextStop > 1000
        ? `${(distToNextStop / 1000).toFixed(1)} km`
        : `${distToNextStop} m`
      : null;

  return (
    <>
      <style>{CSS}</style>
      <div className="at-root">
        {/* â”€â”€ Top bar â”€â”€ */}
        {tripActive && nextStop ? (
          <div className="at-topbar">
            <div className="at-topbar-icon-nav">
              <Navigation size={18} color="white" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="at-topbar-label">Next stop</div>
              <div className="at-topbar-val">{nextStop.name}</div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              {distLabel && <div className="at-topbar-dist">{distLabel}</div>}
              {speed > 0 && (
                <div className="at-topbar-speed">
                  <Gauge size={12} />
                  {Math.round(speed)} km/h
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="at-topbar">
            <div className="at-topbar-icon-bus">
              <Bus size={18} color="#6366f1" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="at-topbar-val">{bus.name}</div>
              <div className="at-topbar-label">
                {bus.plateNumber} Â·{" "}
                {route ? `${stops.length} stops` : "No route assigned"}
              </div>
            </div>
            {!tripActive && (
              <button
                onClick={handleStartTrip}
                disabled={starting || !route}
                className="at-start-btn"
              >
                {starting ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Navigation size={15} />
                )}
                Start Trip
              </button>
            )}
          </div>
        )}

        {/* â”€â”€ Map + overlays â”€â”€ */}
        <div className="at-map-area">
          {error && <div className="at-alert">{error}</div>}
          {locationError && tripActive && (
            <div className="at-alert at-alert-warn">
              Location error: {locationError}
            </div>
          )}

          <MapContainer
            center={center}
            zoom={16}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
            }}
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />

            {position && tripActive && (
              <AutoFollowMap
                position={position}
                heading={heading}
                followMode={followMode}
              />
            )}

            {tripActive && coveredPath.length > 1 && (
              <Polyline
                positions={coveredPath}
                color="#94a3b8"
                weight={5}
                opacity={0.4}
              />
            )}
            {remainingPath.length > 1 && (
              <Polyline
                positions={remainingPath}
                color="#6366f1"
                weight={5}
                opacity={0.9}
              />
            )}
            {!tripActive && routePath.length > 1 && (
              <Polyline
                positions={routePath}
                color="#6366f1"
                weight={4}
                opacity={0.7}
              />
            )}

            {stops.map((stop, index) => (
              <Marker
                key={stop._id}
                position={[stop.latitude, stop.longitude]}
                icon={
                  tripActive && index === nextStopIdx ? nextStopIcon : stopIcon
                }
              >
                <Popup>
                  <div style={{ fontSize: 12 }}>
                    <div style={{ fontWeight: 700 }}>{stop.name}</div>
                    <div style={{ color: "#64748b" }}>
                      Stop #{index + 1}
                      {tripActive && index === nextStopIdx && " â€” Next"}
                      {tripActive && index < nextStopIdx && " â€” Passed"}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

            {position && (
              <Marker position={position} icon={driverIcon}>
                <Popup>
                  <div style={{ fontSize: 12 }}>
                    <div style={{ fontWeight: 700 }}>You are here</div>
                    {speed > 0 && (
                      <div style={{ color: "#64748b" }}>
                        {Math.round(speed)} km/h
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>

          {/* Re-center button */}
          {tripActive && (
            <button
              onClick={() => setFollowMode(true)}
              className={`at-recenter ${followMode ? "at-recenter-on" : "at-recenter-off"}`}
              title="Re-center on your location"
            >
              <Locate size={18} />
            </button>
          )}

          {/* â”€â”€ Mobile: bottom stop strip â”€â”€ */}
          {tripActive && (
            <div className="at-strip">
              <div className="at-strip-header">
                <span className="at-strip-label">Upcoming stops</span>
                <button
                  onClick={handleEndTrip}
                  disabled={ending}
                  className="at-end-btn"
                >
                  {ending ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Square size={13} />
                  )}
                  End Trip
                </button>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  overflowX: "auto",
                  paddingBottom: 4,
                }}
              >
                {stops.slice(nextStopIdx).map((stop, i) => (
                  <div
                    key={stop._id}
                    className={`at-stop-chip ${i === 0 ? "at-stop-chip-next" : "at-stop-chip-future"}`}
                  >
                    <MapPin size={13} style={{ flexShrink: 0 }} />
                    <span style={{ whiteSpace: "nowrap" }}>{stop.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* â”€â”€ Desktop: floating left panel â”€â”€ */}
          <div className="at-panel">
            <div className="at-panel-inner">
              {/* Panel header */}
              <div className="at-panel-head">
                <div className="at-panel-bus-row">
                  <div className="at-panel-bus-icon">
                    <Bus size={18} color="#a5b4fc" />
                  </div>
                  <div>
                    <div className="at-panel-bus-name">{bus.name}</div>
                    <div className="at-panel-bus-sub">
                      {bus.plateNumber} Â·{" "}
                      {route ? `${stops.length} stops` : "No route"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Panel body */}
              <div className="at-panel-body">
                {tripActive ? (
                  <>
                    {/* Next stop card */}
                    {nextStop && (
                      <div className="at-next-card">
                        <div className="at-next-label">Next Stop</div>
                        <div className="at-next-name">{nextStop.name}</div>
                        <div className="at-next-sub">
                          {distLabel ? `${distLabel} away` : "Calculatingâ€¦"}
                        </div>
                      </div>
                    )}

                    {/* Metrics */}
                    <div className="at-metrics">
                      <div className="at-metric">
                        <div className="at-metric-label">Speed</div>
                        <div className="at-metric-val">
                          {Math.round(speed)}
                          <span className="at-metric-unit"> km/h</span>
                        </div>
                      </div>
                      <div className="at-metric">
                        <div className="at-metric-label">Stops left</div>
                        <div className="at-metric-val">
                          {stops.length - nextStopIdx}
                          <span className="at-metric-unit"> stops</span>
                        </div>
                      </div>
                    </div>

                    {/* Stop list */}
                    {stops.slice(nextStopIdx).length > 0 && (
                      <>
                        <div className="at-stops-label">Upcoming Stops</div>
                        {stops.slice(nextStopIdx).map((stop, i) => (
                          <div key={stop._id} className="at-pstop-row">
                            <span
                              className={
                                i === 0
                                  ? "at-pstop-dot-next"
                                  : "at-pstop-dot-future"
                              }
                            />
                            <span
                              className={
                                i === 0
                                  ? "at-pstop-name-next"
                                  : "at-pstop-name-future"
                              }
                            >
                              {stop.name}
                            </span>
                          </div>
                        ))}
                      </>
                    )}

                    {/* End trip */}
                    <button
                      onClick={handleEndTrip}
                      disabled={ending}
                      className="at-panel-end-btn"
                    >
                      {ending ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <Square size={15} />
                      )}
                      End Trip
                    </button>
                  </>
                ) : (
                  <>
                    {/* Route preview stop list */}
                    {stops.length > 0 && (
                      <>
                        <div className="at-stops-label">Route Stops</div>
                        {stops.map((stop, i) => (
                          <div key={stop._id} className="at-pstop-row">
                            <span
                              className={
                                i === 0
                                  ? "at-pstop-dot-next"
                                  : "at-pstop-dot-future"
                              }
                            />
                            <span
                              className={
                                i === 0
                                  ? "at-pstop-name-next"
                                  : "at-pstop-name-future"
                              }
                            >
                              {stop.name}
                            </span>
                          </div>
                        ))}
                      </>
                    )}
                    {!route && (
                      <div className="at-panel-no-route">
                        No route assigned to this bus.
                      </div>
                    )}

                    {/* Start trip */}
                    <button
                      onClick={handleStartTrip}
                      disabled={starting || !route}
                      className="at-panel-start-btn"
                    >
                      {starting ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <Navigation size={15} />
                      )}
                      Start Trip
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
