import { flushLocationsToMongoDB } from '../services/location.service';

const FLUSH_INTERVAL = 30000; // 30 seconds

let flushInterval: NodeJS.Timeout | null = null;

export function startLocationFlushJob(): void {
  if (flushInterval) {
    console.warn('Location flush job already running');
    return;
  }

  console.log(`Starting location flush job (every ${FLUSH_INTERVAL / 1000}s)`);

  flushInterval = setInterval(async () => {
    try {
      const count = await flushLocationsToMongoDB();
      if (count > 0) {
        console.log(`Flushed ${count} locations to MongoDB`);
      }
    } catch (error) {
      console.error('Location flush job error:', error);
    }
  }, FLUSH_INTERVAL);
}

export function stopLocationFlushJob(): void {
  if (flushInterval) {
    clearInterval(flushInterval);
    flushInterval = null;
    console.log('Location flush job stopped');
  }
}
