import { Router } from 'express';
import { body } from 'express-validator';

import {
  getAllBuses,
  getBusById,
  getBusLocation,
  createBus,
  updateBus,
  deleteBus,
  assignDriver,
  assignRoute,
} from '../controllers/bus.controller';
import { validate } from '../middleware/validation.middleware';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Public routes (require auth)
router.get('/', authenticate, getAllBuses);
router.get('/:id', authenticate, getBusById);
router.get('/:id/location', authenticate, getBusLocation);

// Admin only routes
router.post(
  '/',
  authenticate,
  requireAdmin,
  validate([
    body('plateNumber').trim().notEmpty().withMessage('Plate number is required'),
    body('name').trim().notEmpty().withMessage('Bus name is required'),
    body('capacity').isInt({ min: 1 }).withMessage('Capacity must be at least 1'),
    body('routeId').optional().isMongoId().withMessage('Valid route ID is required'),
    body('driverId').optional().isMongoId().withMessage('Valid driver ID is required'),
  ]),
  createBus
);

router.patch(
  '/:id',
  authenticate,
  requireAdmin,
  validate([
    body('plateNumber').optional().trim().notEmpty(),
    body('name').optional().trim().notEmpty(),
    body('capacity').optional().isInt({ min: 1 }),
    body('isActive').optional().isBoolean(),
  ]),
  updateBus
);

router.delete('/:id', authenticate, requireAdmin, deleteBus);

router.patch(
  '/:id/driver',
  authenticate,
  requireAdmin,
  validate([body('driverId').optional({ nullable: true }).isMongoId()]),
  assignDriver
);

router.patch(
  '/:id/route',
  authenticate,
  requireAdmin,
  validate([body('routeId').optional({ nullable: true }).isMongoId()]),
  assignRoute
);

export default router;
