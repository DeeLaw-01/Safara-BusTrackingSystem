import { Router } from 'express';
import { body } from 'express-validator';

import { updateProfile, setHomeStop, updateFcmToken } from '../controllers/user.controller';
import { validate } from '../middleware/validation.middleware';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Update profile
router.patch(
  '/profile',
  validate([
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('phone').optional().trim(),
  ]),
  updateProfile
);

// Set home stop
router.patch(
  '/home-stop',
  validate([body('stopId').isMongoId().withMessage('Valid stop ID is required')]),
  setHomeStop
);

// Update FCM token
router.patch(
  '/fcm-token',
  validate([body('fcmToken').notEmpty().withMessage('FCM token is required')]),
  updateFcmToken
);

export default router;
