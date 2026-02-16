import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
  Navigation, 
  Square, 
  MapPin, 
  Loader2, 
  AlertCircle,
  Gauge,
  Compass
} from 'lucide-react';
import { tripsApi, routesApi } from '../../services/api';
import { socketService } from '../../services/socket';
import type { Bus, Route, Stop } from '../../types';
import 'leaflet/dist/leaflet.css';

// Custom bus icon
const busIcon = L.divIcon({
  className: 'bus-marker',
  html: `<div class="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/50 border-3 border-white">
    <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
      <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/>
    </svg>
  </div>`,
  iconSize: [48, 48],
  iconAnchor: [24, 24],
});

// Stop icon
const stopIcon = L.divIcon({
  className: '',
  html: `<div class="w-6 h-6 bg-slate-800 rounded-full flex items-center justify-center border-2 border-primary-400">
    <div class="w-2 h-2 bg-primary-400 rounded-full"></div>
  </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

function MapUpdater({ position }: { position: [number, number] }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(position, map.getZoom());
  }, [map, position]);

  return null;
}

export default function ActiveTrip() {
  const navigate = useNavigate();
  const [bus, setBus] = useState<Bus | null>(null);
  const [route, setRoute] = useState<Route | null>(null);
  const [tripActive, setTripActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [ending, setEnding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Location state
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [speed, setSpeed] = useState<number>(0);
  const [heading, setHeading] = useState<number>(0);
  const [locationError, setLocationError] = useState<string | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const sendIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadData();
    return () => {
      stopLocationTracking();
    };
  }, []);

  const loadData = async () => {
    try {
      const [busRes, tripRes] = await Promise.all([
        tripsApi.getMyBus().catch(() => ({ data: { data: null } })),
        tripsApi.getCurrent(),
      ]);

      setBus(busRes.data.data);

      if (busRes.data.data?.routeId) {
        const routeId = typeof busRes.data.data.routeId === 'object'
          ? (busRes.data.data.routeId as { _id: string })._id
          : busRes.data.data.routeId;
        
        const routeRes = await routesApi.getById(routeId);
        setRoute(routeRes.data.data);
      }

      if (tripRes.data.data) {
        setTripActive(true);
        startLocationTracking();
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const startLocationTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported');
      return;
    }

    // Watch position
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const newPosition: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setPosition(newPosition);
        setSpeed(pos.coords.speed ? pos.coords.speed * 3.6 : 0); // Convert m/s to km/h
        setHeading(pos.coords.heading || 0);
        setLocationError(null);
      },
      (err) => {
        setLocationError(err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    // Send location every 5 seconds
    sendIntervalRef.current = setInterval(() => {
      if (position) {
        socketService.sendLocation(position[0], position[1], speed, heading);
      }
    }, 5000);
  }, [position, speed, heading]);

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

    const routeId = typeof bus.routeId === 'object'
      ? (bus.routeId as { _id: string })._id
      : bus.routeId;

    if (!routeId) {
      setError('No route assigned to your bus');
      return;
    }

    setStarting(true);
    setError(null);

    try {
      socketService.startTrip(bus._id, routeId);
      setTripActive(true);
      startLocationTracking();
    } catch (err) {
      setError('Failed to start trip');
      console.error(err);
    } finally {
      setStarting(false);
    }
  };

  const handleEndTrip = async () => {
    if (!confirm('Are you sure you want to end this trip?')) return;

    setEnding(true);
    try {
      socketService.endTrip();
      stopLocationTracking();
      setTripActive(false);
      navigate('/driver');
    } catch (err) {
      setError('Failed to end trip');
      console.error(err);
    } finally {
      setEnding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  if (!bus) {
    return (
      <div className="max-w-md mx-auto p-4 text-center">
        <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">No Bus Assigned</h2>
        <p className="text-slate-400">You need a bus assigned to start a trip.</p>
      </div>
    );
  }

  const stops = route?.stops || [];
  const routePath: [number, number][] = stops.map((s: Stop) => [s.latitude, s.longitude]);
  const center: [number, number] = position || 
    (stops.length > 0 ? [stops[0].latitude, stops[0].longitude] : [31.5204, 74.3587]);

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Status Bar */}
      <div className={`p-4 ${tripActive ? 'bg-green-600' : 'bg-slate-800'}`}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {tripActive && (
              <span className="w-3 h-3 bg-white rounded-full animate-pulse"></span>
            )}
            <div>
              <div className="text-white font-semibold">
                {tripActive ? 'Trip in Progress' : 'Trip Not Started'}
              </div>
              <div className="text-white/70 text-sm">
                {bus.name} • {bus.plateNumber}
              </div>
            </div>
          </div>

          {tripActive ? (
            <button
              onClick={handleEndTrip}
              disabled={ending}
              className="btn bg-white text-red-600 hover:bg-red-50"
            >
              {ending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Square className="w-5 h-5" />}
              End Trip
            </button>
          ) : (
            <button
              onClick={handleStartTrip}
              disabled={starting}
              className="btn btn-primary"
            >
              {starting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Navigation className="w-5 h-5" />}
              Start Trip
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border-b border-red-500/20 p-3">
          <p className="text-red-400 text-sm text-center">{error}</p>
        </div>
      )}

      {locationError && tripActive && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 p-3">
          <p className="text-amber-400 text-sm text-center">
            Location error: {locationError}
          </p>
        </div>
      )}

      {/* Map */}
      <div className="flex-1 relative">
        <MapContainer
          center={center}
          zoom={15}
          className="h-full w-full"
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Route polyline */}
          {routePath.length > 1 && (
            <Polyline
              positions={routePath}
              color="#0ea5e9"
              weight={4}
              opacity={0.7}
            />
          )}

          {/* Stop markers */}
          {stops.map((stop: Stop, index: number) => (
            <Marker
              key={stop._id}
              position={[stop.latitude, stop.longitude]}
              icon={stopIcon}
            />
          ))}

          {/* Current position marker */}
          {position && (
            <Marker
              position={position}
              icon={busIcon}
            />
          )}

          {position && <MapUpdater position={position} />}
        </MapContainer>

        {/* Stats overlay */}
        {tripActive && position && (
          <div className="absolute bottom-4 left-4 right-4 z-[1000]">
            <div className="glass rounded-xl p-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="flex items-center justify-center gap-1 text-slate-400 text-xs mb-1">
                    <Gauge className="w-3 h-3" />
                    Speed
                  </div>
                  <div className="text-xl font-bold text-white">
                    {Math.round(speed)} <span className="text-sm font-normal">km/h</span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1 text-slate-400 text-xs mb-1">
                    <Compass className="w-3 h-3" />
                    Heading
                  </div>
                  <div className="text-xl font-bold text-white">
                    {Math.round(heading)}°
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1 text-slate-400 text-xs mb-1">
                    <MapPin className="w-3 h-3" />
                    Stops
                  </div>
                  <div className="text-xl font-bold text-white">
                    {stops.length}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
