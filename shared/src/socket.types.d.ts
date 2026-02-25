export interface ClientToServerEvents {
    'driver:startTrip': (data: StartTripPayload) => void;
    'driver:location': (data: LocationPayload) => void;
    'driver:endTrip': () => void;
    'rider:joinRoute': (data: JoinRoutePayload) => void;
    'rider:leaveRoute': (data: LeaveRoutePayload) => void;
    'authenticate': (token: string) => void;
}
export interface ServerToClientEvents {
    'bus:location': (data: BusLocationPayload) => void;
    'bus:tripStarted': (data: TripStartedPayload) => void;
    'bus:tripEnded': (data: TripEndedPayload) => void;
    'trip:ended': (data: TripEndedPayload) => void;
    'notification:busApproaching': (data: BusApproachingPayload) => void;
    'authenticated': (data: {
        userId: string;
    }) => void;
    'error': (data: {
        message: string;
    }) => void;
}
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
//# sourceMappingURL=socket.types.d.ts.map