import { Server, Socket } from 'socket.io';

import { getActiveBusesOnRoute } from '../../config/redis';

import type { 
  ClientToServerEvents, 
  ServerToClientEvents,
  JoinRoutePayload,
  LeaveRoutePayload,
} from '../../../../shared/src/socket.types';

interface AuthenticatedSocket extends Socket<ClientToServerEvents, ServerToClientEvents> {
  userId?: string;
  userRole?: string;
  watchingRoutes?: Set<string>;
}

export function riderHandlers(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  socket: AuthenticatedSocket
): void {
  // Initialize watching routes set
  socket.watchingRoutes = new Set();

  // Join Route Room
  socket.on('rider:joinRoute', async (data: JoinRoutePayload) => {
    try {
      const { routeId } = data;

      // Join the route room
      socket.join(`route:${routeId}`);
      socket.watchingRoutes?.add(routeId);

      // Send current bus locations on this route
      const activeBuses = await getActiveBusesOnRoute(routeId);
      
      for (const bus of activeBuses) {
        socket.emit('bus:location', {
          busId: bus.busId,
          routeId: bus.routeId,
          latitude: bus.latitude,
          longitude: bus.longitude,
          speed: bus.speed,
          heading: bus.heading,
          timestamp: bus.timestamp,
        });
      }

      console.log(`User ${socket.userId} joined route ${routeId}`);
    } catch (error) {
      console.error('Error joining route:', error);
      socket.emit('error', { message: 'Failed to join route' });
    }
  });

  // Leave Route Room
  socket.on('rider:leaveRoute', (data: LeaveRoutePayload) => {
    try {
      const { routeId } = data;

      socket.leave(`route:${routeId}`);
      socket.watchingRoutes?.delete(routeId);

      console.log(`User ${socket.userId} left route ${routeId}`);
    } catch (error) {
      console.error('Error leaving route:', error);
    }
  });

  // Clean up on disconnect
  socket.on('disconnect', () => {
    socket.watchingRoutes?.clear();
  });
}
