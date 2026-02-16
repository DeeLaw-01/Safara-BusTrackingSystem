import { Router } from 'express';

import {
  getAllUsers,
  getPendingDrivers,
  approveDriver,
  rejectDriver,
  deleteUser,
  getDashboardStats,
  getRecentTrips,
  getLiveBuses,
} from '../controllers/admin.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// All routes require admin authentication
router.use(authenticate, requireAdmin);

// User management
router.get('/users', getAllUsers);
router.get('/drivers/pending', getPendingDrivers);
router.patch('/users/:id/approve', approveDriver);
router.delete('/users/:id/reject', rejectDriver);
router.delete('/users/:id', deleteUser);

// Dashboard & Analytics
router.get('/dashboard', getDashboardStats);
router.get('/trips/recent', getRecentTrips);
router.get('/buses/live', getLiveBuses);

export default router;
