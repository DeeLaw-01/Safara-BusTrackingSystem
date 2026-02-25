export interface IStop {
    _id: string;
    name: string;
    latitude: number;
    longitude: number;
    sequence: number;
    routeId: string;
    estimatedArrivalTime?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface IStopCreate {
    name: string;
    latitude: number;
    longitude: number;
    sequence: number;
    routeId: string;
    estimatedArrivalTime?: string;
}
export interface IRoute {
    _id: string;
    name: string;
    description?: string;
    stops: IStop[];
    path?: [number, number][];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface IRouteCreate {
    name: string;
    description?: string;
    isActive?: boolean;
}
export interface IRouteUpdate {
    name?: string;
    description?: string;
    isActive?: boolean;
}
export interface IBus {
    _id: string;
    plateNumber: string;
    name: string;
    capacity: number;
    routeId?: string;
    driverId?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface IBusCreate {
    plateNumber: string;
    name: string;
    capacity: number;
    routeId?: string;
    driverId?: string;
    isActive?: boolean;
}
export interface IBusUpdate {
    plateNumber?: string;
    name?: string;
    capacity?: number;
    routeId?: string;
    driverId?: string;
    isActive?: boolean;
}
export interface ITrip {
    _id: string;
    busId: string;
    driverId: string;
    routeId: string;
    status: 'ongoing' | 'completed';
    startTime: Date;
    endTime?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface ITripCreate {
    busId: string;
    driverId: string;
    routeId: string;
}
export interface ILocationUpdate {
    _id: string;
    tripId: string;
    busId: string;
    latitude: number;
    longitude: number;
    speed?: number;
    heading?: number;
    timestamp: Date;
}
export interface IReminder {
    _id: string;
    userId: string;
    stopId: string;
    routeId: string;
    minutesBefore: number;
    isActive: boolean;
    notificationType: 'push' | 'sms' | 'both';
    createdAt: Date;
    updatedAt: Date;
}
export interface IReminderCreate {
    stopId: string;
    routeId: string;
    minutesBefore: number;
    notificationType: 'push' | 'sms' | 'both';
}
//# sourceMappingURL=route.types.d.ts.map