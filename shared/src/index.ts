// User types
export * from './user.types';

// Route, Stop, Bus, Trip types
export * from './route.types';

// Socket event types
export * from './socket.types';

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
