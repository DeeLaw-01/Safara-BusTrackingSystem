// User types
export enum UserRole {
  RIDER = 'rider',
  DRIVER = 'driver',
  ADMIN = 'admin',
}

export interface User {
  _id: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  homeStop?: string;
  isApproved: boolean;
  isEmailVerified: boolean;
  fcmToken?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Route types
export interface Stop {
  _id: string;
  name: string;
  latitude: number;
  longitude: number;
  sequence: number;
  routeId: string;
}

export interface Route {
  _id: string;
  name: string;
  description?: string;
  stops: Stop[];
  isActive: boolean;
}

export interface Bus {
  _id: string;
  plateNumber: string;
  name: string;
  capacity: number;
  routeId?: string | Route;
  driverId?: string | User;
  isActive: boolean;
}

export interface Trip {
  _id: string;
  busId: string | Bus;
  driverId: string | User;
  routeId: string | Route;
  status: 'ongoing' | 'completed';
  startTime: string;
  endTime?: string;
}

export interface Reminder {
  _id: string;
  userId: string;
  stopId: string | Stop;
  routeId: string | Route;
  minutesBefore: number;
  isActive: boolean;
  notificationType: 'push' | 'sms' | 'both';
}

// Socket types
export interface BusLocation {
  busId: string;
  routeId: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  timestamp: number;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Dashboard stats
export interface DashboardStats {
  users: {
    total: number;
    drivers: number;
    riders: number;
    pendingDrivers: number;
  };
  buses: {
    total: number;
    active: number;
    live: number;
  };
  routes: {
    total: number;
    active: number;
  };
  trips: {
    today: number;
    ongoing: number;
  };
  liveLocations: BusLocation[];
}
