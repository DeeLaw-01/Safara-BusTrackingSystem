// Client -> Server events
export interface ClientToServerEvents {
  // Driver events
  'driver:startTrip': (data: StartTripPayload) => void;
  'driver:location': (data: LocationPayload) => void;
  'driver:endTrip': () => void;

  // Rider events
  'rider:joinRoute': (data: JoinRoutePayload) => void;
  'rider:leaveRoute': (data: LeaveRoutePayload) => void;

  // Common
  'authenticate': (token: string) => void;
}

// Server -> Client events
export interface ServerToClientEvents {
  // Bus updates
  'bus:location': (data: BusLocationPayload) => void;
  'bus:tripStarted': (data: TripStartedPayload) => void;
  'bus:tripEnded': (data: TripEndedPayload) => void;

  // Notifications
  'notification:busApproaching': (data: BusApproachingPayload) => void;

  // Connection
  'authenticated': (data: { userId: string }) => void;
  'error': (data: { message: string }) => void;
}

// Payload types
export interface StartTripPayload {
  busId: string;
  routeId: string;
}

export interface LocationPayload {
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  timestamp?: number;
}

export interface JoinRoutePayload {
  routeId: string;
}

export interface LeaveRoutePayload {
  routeId: string;
}

export interface BusLocationPayload {
  busId: string;
  routeId: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  timestamp: number;
}

export interface TripStartedPayload {
  tripId: string;
  busId: string;
  routeId: string;
  driverId: string;
}

export interface TripEndedPayload {
  tripId: string;
  busId: string;
  routeId: string;
}

export interface BusApproachingPayload {
  busId: string;
  stopId: string;
  estimatedMinutes: number;
}

// Redis location cache structure
export interface CachedBusLocation {
  busId: string;
  tripId: string;
  routeId: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  timestamp: number;
}
