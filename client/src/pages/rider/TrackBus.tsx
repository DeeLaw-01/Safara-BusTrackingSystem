import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { ArrowLeft, Bus, MapPin, Clock, Loader2 } from 'lucide-react';
import { routesApi } from '../../services/api';
import { socketService } from '../../services/socket';
import { useBusStore } from '../../store/busStore';
import type { Route, BusLocation } from '../../types';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: () => void })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom bus icon
const busIcon = L.divIcon({
  className: 'bus-marker',
  html: `<div class="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center shadow-lg shadow-primary-500/50 border-2 border-white">
    <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
      <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/>
    </svg>
  </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
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

// Map updater component
function MapUpdater({ buses, stops }: { buses: BusLocation[]; stops: { latitude: number; longitude: number }[] }) {
  const map = useMap();

  useEffect(() => {
    const bounds: [number, number][] = [];
    
    buses.forEach(bus => {
      bounds.push([bus.latitude, bus.longitude]);
    });
    
    stops.forEach(stop => {
      bounds.push([stop.latitude, stop.longitude]);
    });

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, buses, stops]);

  return null;
}

export default function TrackBus() {
  const { routeId } = useParams<{ routeId: string }>();
  const [route, setRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState(true);
  const { busLocations, updateBusLocation, removeBus, clearLocations } = useBusStore();

  const buses = Array.from(busLocations.values()).filter(b => b.routeId === routeId);

  useEffect(() => {
    if (!routeId) return;

    loadRoute();
    
    // Join route room for real-time updates
    socketService.joinRoute(routeId);

    // Listen for bus location updates
    const unsubLocation = socketService.onBusLocation((data) => {
      if (data.routeId === routeId) {
        updateBusLocation(data);
      }
    });

    const unsubTripEnded = socketService.onTripEnded((data) => {
      removeBus(data.busId);
    });

    return () => {
      socketService.leaveRoute(routeId);
      unsubLocation();
      unsubTripEnded();
      clearLocations();
    };
  }, [routeId, updateBusLocation, removeBus, clearLocations]);

  const loadRoute = useCallback(async () => {
    if (!routeId) return;
    
    try {
      const [routeRes, busesRes] = await Promise.all([
        routesApi.getById(routeId),
        routesApi.getActiveBuses(routeId),
      ]);
      
      setRoute(routeRes.data.data);
      
      // Load initial bus locations
      busesRes.data.data.forEach((bus: BusLocation) => {
        updateBusLocation(bus);
      });
    } catch (error) {
      console.error('Failed to load route:', error);
    } finally {
      setLoading(false);
    }
  }, [routeId, updateBusLocation]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  if (!route) {
    return (
      <div className="p-4 text-center">
        <p className="text-slate-400">Route not found</p>
        <Link to="/" className="text-primary-400 hover:text-primary-300 mt-2 inline-block">
          Go back home
        </Link>
      </div>
    );
  }

  const stops = route.stops || [];
  const routePath: [number, number][] = stops.map(s => [s.latitude, s.longitude]);
  const center: [number, number] = stops.length > 0 
    ? [stops[0].latitude, stops[0].longitude] 
    : [31.5204, 74.3587]; // Default to Lahore

  return (
    <div className="h-[calc(100vh-4rem)] lg:h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 p-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link to="/" className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-white">{route.name}</h1>
            <p className="text-sm text-slate-400">{stops.length} stops</p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Bus className="w-4 h-4 text-primary-400" />
            <span className="text-white font-medium">{buses.length}</span>
            <span className="text-slate-400">active</span>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <MapContainer
          center={center}
          zoom={13}
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
          {stops.map((stop, index) => (
            <Marker
              key={stop._id}
              position={[stop.latitude, stop.longitude]}
              icon={stopIcon}
            >
              <Popup>
                <div className="text-sm">
                  <div className="font-semibold">{stop.name}</div>
                  <div className="text-slate-500">Stop #{index + 1}</div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Bus markers */}
          {buses.map((bus) => (
            <Marker
              key={bus.busId}
              position={[bus.latitude, bus.longitude]}
              icon={busIcon}
            >
              <Popup>
                <div className="text-sm">
                  <div className="font-semibold flex items-center gap-2">
                    <Bus className="w-4 h-4" />
                    Bus
                  </div>
                  {bus.speed && (
                    <div className="text-slate-500">{Math.round(bus.speed)} km/h</div>
                  )}
                  <div className="text-xs text-slate-400 mt-1">
                    Updated {formatTime(bus.timestamp)}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          <MapUpdater buses={buses} stops={stops} />
        </MapContainer>

        {/* No buses overlay */}
        {buses.length === 0 && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[1000]">
            <div className="text-center p-6">
              <Bus className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No Active Buses</h3>
              <p className="text-slate-400 text-sm">
                There are no buses currently on this route.<br />
                Check back later or set a reminder.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom info bar */}
      <div className="bg-slate-900 border-t border-slate-800 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-slate-400">
              <MapPin className="w-4 h-4" />
              <span>{stops.length} stops on this route</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <Clock className="w-4 h-4" />
              <span>Live tracking</span>
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return new Date(timestamp).toLocaleTimeString();
}
