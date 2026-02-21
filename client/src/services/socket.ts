import { io, Socket } from 'socket.io-client'
import type { BusLocation } from '@/types'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';

type SocketCallback = (data: unknown) => void;

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<SocketCallback>> = new Map();

  connect(token: string): void {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected');
      // Notify listeners so they can rejoin rooms after reconnection
      this.emit('socket:connected', {});
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    this.socket.on('error', (error: { message: string }) => {
      console.error('Socket error:', error.message);
      this.emit('error', error);
    });

    this.socket.on('authenticated', (data: { userId: string }) => {
      console.log('Socket authenticated:', data.userId);
    });

    // Set up event forwarding
    this.socket.on('bus:location', (data) => this.emit('bus:location', data));
    this.socket.on('bus:tripStarted', (data) => this.emit('bus:tripStarted', data));
    this.socket.on('bus:tripEnded', (data) => this.emit('bus:tripEnded', data));
    this.socket.on('notification:busApproaching', (data) => this.emit('notification:busApproaching', data));
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
  }

  // Driver methods
  startTrip(busId: string, routeId: string): void {
    this.socket?.emit('driver:startTrip', { busId, routeId });
  }

  sendLocation(latitude: number, longitude: number, speed?: number, heading?: number): void {
    this.socket?.emit('driver:location', {
      latitude,
      longitude,
      speed,
      heading,
      timestamp: Date.now(),
    });
  }

  endTrip(): void {
    this.socket?.emit('driver:endTrip');
  }

  // Rider methods
  joinRoute(routeId: string): void {
    this.socket?.emit('rider:joinRoute', { routeId });
  }

  leaveRoute(routeId: string): void {
    this.socket?.emit('rider:leaveRoute', { routeId });
  }

  // Event handling
  on(event: string, callback: SocketCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: SocketCallback): void {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: unknown): void {
    this.listeners.get(event)?.forEach(callback => callback(data));
  }

  // Typed event methods for convenience
  onBusLocation(callback: (data: BusLocation) => void): () => void {
    this.on('bus:location', callback as SocketCallback);
    return () => this.off('bus:location', callback as SocketCallback);
  }

  onTripStarted(callback: (data: { tripId: string; busId: string; routeId: string }) => void): () => void {
    this.on('bus:tripStarted', callback as SocketCallback);
    return () => this.off('bus:tripStarted', callback as SocketCallback);
  }

  onTripEnded(callback: (data: { tripId: string; busId: string }) => void): () => void {
    this.on('bus:tripEnded', callback as SocketCallback);
    return () => this.off('bus:tripEnded', callback as SocketCallback);
  }

  onConnected(callback: () => void): () => void {
    this.on('socket:connected', callback as SocketCallback);
    return () => this.off('socket:connected', callback as SocketCallback);
  }
}

export const socketService = new SocketService()
export default socketService
