import { Router } from 'express';
import { body } from 'express-validator';

import {
  getAllRoutes,
  getRouteById,
  getRouteStops,
  getActiveBusesOnRouteHandler,
  createRoute,
  updateRoute,
  deleteRoute,
} from '../controllers/route.controller';
import { validate } from '../middleware/validation.middleware';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Public routes (still require auth for security)
router.get('/', authenticate, getAllRoutes);
router.get('/:id', authenticate, getRouteById);
router.get('/:id/stops', authenticate, getRouteStops);
router.get('/:id/buses', authenticate, getActiveBusesOnRouteHandler);

// Admin only routes
router.post(
  '/',
  authenticate,
  requireAdmin,
  validate([
    body('name').trim().notEmpty().withMessage('Route name is required'),
    body('description').optional().trim(),
  ]),
  createRoute
);

router.patch(
  '/:id',
  authenticate,
  requireAdmin,
  validate([
    body('name').optional().trim().notEmpty().withMessage('Route name cannot be empty'),
    body('description').optional().trim(),
    body('isActive').optional().isBoolean(),
  ]),
  updateRoute
);

router.delete('/:id', authenticate, requireAdmin, deleteRoute);

export default router;
