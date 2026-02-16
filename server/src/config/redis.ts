import Redis from 'ioredis';

let redisClient: Redis | null = null;
let redisPub: Redis | null = null;
let redisSub: Redis | null = null;

export async function connectRedis(): Promise<void> {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  try {
    // Main client for caching
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      lazyConnect: true,
    });

    // Publisher for Socket.io adapter
    redisPub = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    // Subscriber for Socket.io adapter
    redisSub = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    // Connect all clients
    await Promise.all([
      redisClient.connect(),
      redisPub.connect(),
      redisSub.connect(),
    ]);

    // Error handlers
    redisClient.on('error', (err) => console.error('Redis Client Error:', err));
    redisPub.on('error', (err) => console.error('Redis Pub Error:', err));
    redisSub.on('error', (err) => console.error('Redis Sub Error:', err));

  } catch (error) {
    console.error('Redis connection failed:', error);
    throw error;
  }
}

export function getRedisClient(): Redis {
  if (!redisClient) {
    throw new Error('Redis client not initialized');
  }
  return redisClient;
}

export function getRedisPub(): Redis {
  if (!redisPub) {
    throw new Error('Redis publisher not initialized');
  }
  return redisPub;
}

export function getRedisSub(): Redis {
  if (!redisSub) {
    throw new Error('Redis subscriber not initialized');
  }
  return redisSub;
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient) await redisClient.quit();
  if (redisPub) await redisPub.quit();
  if (redisSub) await redisSub.quit();
}

// Location cache helpers
const LOCATION_TTL = 30; // seconds

export interface BusLocationCache {
  busId: string;
  tripId: string;
  routeId: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  timestamp: number;
}

export async function setBusLocation(busId: string, location: BusLocationCache): Promise<void> {
  const client = getRedisClient();
  const key = `bus:${busId}:location`;
  await client.setex(key, LOCATION_TTL, JSON.stringify(location));
}

export async function getBusLocation(busId: string): Promise<BusLocationCache | null> {
  const client = getRedisClient();
  const key = `bus:${busId}:location`;
  const data = await client.get(key);
  return data ? JSON.parse(data) : null;
}

export async function setActiveBus(busId: string, tripId: string): Promise<void> {
  const client = getRedisClient();
  const key = `bus:${busId}:active`;
  await client.set(key, tripId);
}

export async function getActiveBus(busId: string): Promise<string | null> {
  const client = getRedisClient();
  const key = `bus:${busId}:active`;
  return await client.get(key);
}

export async function removeActiveBus(busId: string): Promise<void> {
  const client = getRedisClient();
  const key = `bus:${busId}:active`;
  const locationKey = `bus:${busId}:location`;
  await client.del(key, locationKey);
}

export async function getAllActiveBusLocations(): Promise<BusLocationCache[]> {
  const client = getRedisClient();
  const keys = await client.keys('bus:*:location');
  
  if (keys.length === 0) return [];

  const locations: BusLocationCache[] = [];
  for (const key of keys) {
    const data = await client.get(key);
    if (data) {
      locations.push(JSON.parse(data));
    }
  }
  
  return locations;
}

export async function getActiveBusesOnRoute(routeId: string): Promise<BusLocationCache[]> {
  const allLocations = await getAllActiveBusLocations();
  return allLocations.filter(loc => loc.routeId === routeId);
}
