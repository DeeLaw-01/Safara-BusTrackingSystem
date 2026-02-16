import { Router } from 'express';
import { body } from 'express-validator';

import {
  getAllStops,
  getStopById,
  createStop,
  updateStop,
  deleteStop,
  reorderStops,
} from '../controllers/stop.controller';
import { validate } from '../middleware/validation.middleware';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Public routes (require auth)
router.get('/', authenticate, getAllStops);
router.get('/:id', authenticate, getStopById);

// Admin only routes
router.post(
  '/',
  authenticate,
  requireAdmin,
  validate([
    body('name').trim().notEmpty().withMessage('Stop name is required'),
    body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude is required'),
    body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude is required'),
    body('sequence').isInt({ min: 0 }).withMessage('Sequence must be a positive integer'),
    body('routeId').isMongoId().withMessage('Valid route ID is required'),
  ]),
  createStop
);

router.patch(
  '/:id',
  authenticate,
  requireAdmin,
  validate([
    body('name').optional().trim().notEmpty().withMessage('Stop name cannot be empty'),
    body('latitude').optional().isFloat({ min: -90, max: 90 }),
    body('longitude').optional().isFloat({ min: -180, max: 180 }),
    body('sequence').optional().isInt({ min: 0 }),
  ]),
  updateStop
);

router.delete('/:id', authenticate, requireAdmin, deleteStop);

router.post(
  '/reorder',
  authenticate,
  requireAdmin,
  validate([
    body('stops').isArray().withMessage('Stops array is required'),
    body('stops.*.id').isMongoId().withMessage('Valid stop ID is required'),
    body('stops.*.sequence').isInt({ min: 0 }).withMessage('Valid sequence is required'),
  ]),
  reorderStops
);

export default router;
