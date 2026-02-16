import { Router } from 'express';
import { body } from 'express-validator';

import {
  getMyReminders,
  createReminder,
  updateReminder,
  deleteReminder,
  toggleReminder,
} from '../controllers/reminder.controller';
import { validate } from '../middleware/validation.middleware';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get user's reminders
router.get('/', getMyReminders);

// Create reminder
router.post(
  '/',
  validate([
    body('stopId').isMongoId().withMessage('Valid stop ID is required'),
    body('routeId').isMongoId().withMessage('Valid route ID is required'),
    body('minutesBefore').optional().isInt({ min: 1, max: 60 }).withMessage('Minutes must be between 1 and 60'),
    body('notificationType').optional().isIn(['push', 'sms', 'both']),
  ]),
  createReminder
);

// Update reminder
router.patch(
  '/:id',
  validate([
    body('minutesBefore').optional().isInt({ min: 1, max: 60 }),
    body('notificationType').optional().isIn(['push', 'sms', 'both']),
    body('isActive').optional().isBoolean(),
  ]),
  updateReminder
);

// Toggle reminder active status
router.patch('/:id/toggle', toggleReminder);

// Delete reminder
router.delete('/:id', deleteReminder);

export default router;
