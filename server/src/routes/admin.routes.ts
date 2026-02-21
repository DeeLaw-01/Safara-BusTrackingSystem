import { Router } from 'express';

import {
  getAllUsers,
  getPendingDrivers,
  approveDriver,
  rejectDriver,
  deleteUser,
  changeUserRole,
  getDashboardStats,
  getRecentTrips,
  getLiveBuses,
  createInvitation,
  createBatchInvitations,
  listInvitations,
  revokeInvitation,
  resendInvitation,
} from '../controllers/admin.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// All routes require admin authentication
router.use(authenticate, requireAdmin);

// User management
router.get('/users', getAllUsers);
router.get('/drivers/pending', getPendingDrivers);
router.patch('/users/:id/approve', approveDriver);
router.patch('/users/:id/role', changeUserRole);
router.delete('/users/:id/reject', rejectDriver);
router.delete('/users/:id', deleteUser);

// Invitations
router.post('/invitations', createInvitation);
router.post('/invitations/batch', createBatchInvitations);
router.get('/invitations', listInvitations);
router.post('/invitations/:id/resend', resendInvitation);
router.delete('/invitations/:id', revokeInvitation);

// Dashboard & Analytics
router.get('/dashboard', getDashboardStats);
router.get('/trips/recent', getRecentTrips);
router.get('/buses/live', getLiveBuses);

export default router;
