import { Server, Socket } from 'socket.io';

import Trip from '../../models/trip.model';
import Bus from '../../models/bus.model';
import { 
  setBusLocation, 
  setActiveBus, 
  removeActiveBus,
  BusLocationCache 
} from '../../config/redis';

import type { 
  ClientToServerEvents, 
  ServerToClientEvents,
  StartTripPayload,
  LocationPayload,
} from '../../../../shared/src/socket.types';

interface AuthenticatedSocket extends Socket<ClientToServerEvents, ServerToClientEvents> {
  userId?: string;
  userRole?: string;
  currentTripId?: string;
  currentBusId?: string;
  currentRouteId?: string;
}

export function driverHandlers(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  socket: AuthenticatedSocket
): void {
  // Start Trip
  socket.on('driver:startTrip', async (data: StartTripPayload) => {
    try {
      const { busId, routeId } = data;
      const driverId = socket.userId!;

      // Validate bus assignment
      const bus = await Bus.findById(busId);
      if (!bus) {
        socket.emit('error', { message: 'Bus not found' });
        return;
      }

      if (bus.driverId?.toString() !== driverId) {
        socket.emit('error', { message: 'You are not assigned to this bus' });
        return;
      }

      // Check if there's already an ongoing trip for this bus
      const existingTrip = await Trip.findOne({ busId, status: 'ongoing' });
      if (existingTrip) {
        socket.emit('error', { message: 'This bus already has an ongoing trip' });
        return;
      }

      // Create new trip
      const trip = await Trip.create({
        busId,
        driverId,
        routeId,
        status: 'ongoing',
        startTime: new Date(),
      });

      // Store in Redis
      await setActiveBus(busId, trip._id.toString());

      // Store trip info in socket for later use
      socket.currentTripId = trip._id.toString();
      socket.currentBusId = busId;
      socket.currentRouteId = routeId;

      // Join the route room
      socket.join(`route:${routeId}`);
      socket.join(`bus:${busId}`);

      // Notify riders on this route
      io.to(`route:${routeId}`).emit('bus:tripStarted', {
        tripId: trip._id.toString(),
        busId,
        routeId,
        driverId,
      });

      console.log(`Trip started: ${trip._id} by driver ${driverId}`);
    } catch (error) {
      console.error('Error starting trip:', error);
      socket.emit('error', { message: 'Failed to start trip' });
    }
  });

  // Location Update
  socket.on('driver:location', async (data: LocationPayload) => {
    try {
      if (!socket.currentTripId || !socket.currentBusId || !socket.currentRouteId) {
        socket.emit('error', { message: 'No active trip. Please start a trip first.' });
        return;
      }

      const { latitude, longitude, speed, heading } = data;
      const timestamp = data.timestamp || Date.now();

      // Store location in Redis
      const locationCache: BusLocationCache = {
        busId: socket.currentBusId,
        tripId: socket.currentTripId,
        routeId: socket.currentRouteId,
        latitude,
        longitude,
        speed,
        heading,
        timestamp,
      };

      await setBusLocation(socket.currentBusId, locationCache);

      // Broadcast to all riders watching this route
      io.to(`route:${socket.currentRouteId}`).emit('bus:location', {
        busId: socket.currentBusId,
        routeId: socket.currentRouteId,
        latitude,
        longitude,
        speed,
        heading,
        timestamp,
      });

    } catch (error) {
      console.error('Error updating location:', error);
    }
  });

  // End Trip
  socket.on('driver:endTrip', async () => {
    try {
      if (!socket.currentTripId || !socket.currentBusId || !socket.currentRouteId) {
        socket.emit('error', { message: 'No active trip to end' });
        return;
      }

      // Update trip in database
      await Trip.findByIdAndUpdate(socket.currentTripId, {
        status: 'completed',
        endTime: new Date(),
      });

      // Remove from Redis
      await removeActiveBus(socket.currentBusId);

      // Notify riders
      io.to(`route:${socket.currentRouteId}`).emit('bus:tripEnded', {
        tripId: socket.currentTripId,
        busId: socket.currentBusId,
        routeId: socket.currentRouteId,
      });

      // Leave rooms
      socket.leave(`route:${socket.currentRouteId}`);
      socket.leave(`bus:${socket.currentBusId}`);

      console.log(`Trip ended: ${socket.currentTripId}`);

      // Clear socket state
      socket.currentTripId = undefined;
      socket.currentBusId = undefined;
      socket.currentRouteId = undefined;

    } catch (error) {
      console.error('Error ending trip:', error);
      socket.emit('error', { message: 'Failed to end trip' });
    }
  });

  // Handle disconnect - end trip if active
  socket.on('disconnect', async () => {
    if (socket.currentTripId && socket.currentBusId && socket.currentRouteId) {
      try {
        // Don't automatically end trip - just leave rooms
        // The trip will continue if driver reconnects
        console.log(`Driver ${socket.userId} disconnected with active trip ${socket.currentTripId}`);
      } catch (error) {
        console.error('Error handling driver disconnect:', error);
      }
    }
  });
}
