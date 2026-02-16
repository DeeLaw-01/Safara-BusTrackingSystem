import { Router } from 'express';

import {
  getDriverTrips,
  getCurrentTrip,
  getDriverAssignedBus,
  getTripById,
  getTripLocations,
  getAllTrips,
} from '../controllers/trip.controller';
import { authenticate, requireDriver, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Driver routes
router.get('/my-trips', authenticate, requireDriver, getDriverTrips);
router.get('/current', authenticate, requireDriver, getCurrentTrip);
router.get('/my-bus', authenticate, requireDriver, getDriverAssignedBus);

// Trip details (any authenticated user can view)
router.get('/:id', authenticate, getTripById);
router.get('/:id/locations', authenticate, getTripLocations);

// Admin routes
router.get('/', authenticate, requireAdmin, getAllTrips);

export default router;
