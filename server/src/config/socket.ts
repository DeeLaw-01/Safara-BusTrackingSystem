import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import jwt from 'jsonwebtoken';

import { getRedisPub, getRedisSub } from './redis';
import { driverHandlers } from '../socket/handlers/driver.handler';
import { riderHandlers } from '../socket/handlers/rider.handler';

import type { 
  ClientToServerEvents, 
  ServerToClientEvents 
} from '../../../shared/src/socket.types';

let io: Server<ClientToServerEvents, ServerToClientEvents> | null = null;

interface AuthenticatedSocket extends Socket<ClientToServerEvents, ServerToClientEvents> {
  userId?: string;
  userRole?: string;
}

export function initializeSocket(server: HttpServer): void {
  io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Set up Redis adapter for horizontal scaling
  const pubClient = getRedisPub();
  const subClient = getRedisSub();
  io.adapter(createAdapter(pubClient, subClient));

  // Authentication middleware
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as {
        id: string;
        role: string;
      };
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  // Connection handler
  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`User connected: ${socket.userId} (${socket.userRole})`);

    // Emit authenticated event
    socket.emit('authenticated', { userId: socket.userId! });

    // Register handlers based on role
    if (socket.userRole === 'driver') {
      driverHandlers(io!, socket);
    }
    
    // All users can use rider handlers (viewing buses)
    riderHandlers(io!, socket);

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`User disconnected: ${socket.userId} - ${reason}`);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`Socket error for ${socket.userId}:`, error);
    });
  });

  console.log('Socket.io server initialized with Redis adapter');
}

export function getIO(): Server<ClientToServerEvents, ServerToClientEvents> {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
}

// Helper to emit to a specific route room
export function emitToRoute(routeId: string, event: string, data: unknown): void {
  const socketIO = getIO();
  socketIO.to(`route:${routeId}`).emit(event as keyof ServerToClientEvents, data as never);
}

// Helper to emit to a specific user
export function emitToUser(userId: string, event: string, data: unknown): void {
  const socketIO = getIO();
  socketIO.to(`user:${userId}`).emit(event as keyof ServerToClientEvents, data as never);
}
