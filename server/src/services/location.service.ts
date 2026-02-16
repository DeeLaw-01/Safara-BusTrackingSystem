import LocationUpdate from '../models/locationUpdate.model';
import { getAllActiveBusLocations, BusLocationCache } from '../config/redis';

// Batch insert locations from Redis to MongoDB
export async function flushLocationsToMongoDB(): Promise<number> {
  try {
    const locations = await getAllActiveBusLocations();

    if (locations.length === 0) {
      return 0;
    }

    // Convert to MongoDB documents
    const documents = locations.map((loc: BusLocationCache) => ({
      tripId: loc.tripId,
      busId: loc.busId,
      latitude: loc.latitude,
      longitude: loc.longitude,
      speed: loc.speed,
      heading: loc.heading,
      timestamp: new Date(loc.timestamp),
    }));

    // Bulk insert
    await LocationUpdate.insertMany(documents, { ordered: false });

    console.log(`Flushed ${documents.length} location updates to MongoDB`);
    return documents.length;
  } catch (error) {
    console.error('Error flushing locations to MongoDB:', error);
    throw error;
  }
}

// Calculate ETA to a stop based on current location and route
export function calculateETA(
  currentLat: number,
  currentLng: number,
  stopLat: number,
  stopLng: number,
  currentSpeed: number = 30 // default 30 km/h
): number {
  // Calculate distance using Haversine formula
  const R = 6371; // Earth's radius in km
  const dLat = toRad(stopLat - currentLat);
  const dLng = toRad(stopLng - currentLng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(currentLat)) *
      Math.cos(toRad(stopLat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  // Calculate time in minutes
  const speed = currentSpeed > 0 ? currentSpeed : 30;
  const timeInHours = distance / speed;
  const timeInMinutes = Math.round(timeInHours * 60);

  return timeInMinutes;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

// Get distance between two coordinates in meters
export function getDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
