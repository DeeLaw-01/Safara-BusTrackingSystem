import { Router } from 'express'
import { body } from 'express-validator'
import passport from 'passport'

import {
  sendRegisterOtp,
  resendRegisterOtp,
  verifyRegisterOtp,
  login,
  forgotPassword,
  resetPassword,
  googleTokenAuth,
  googleCallback,
  getMe
} from '../controllers/auth.controller'
import { validate } from '../middleware/validation.middleware'
import { authenticate } from '../middleware/auth.middleware'

const router = Router()

// ── Validation rules ──────────────────────────────────────────────────────────

const sendRegisterOtpValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('role')
    .isIn(['rider', 'driver'])
    .withMessage('Role must be rider or driver')
]

const verifyRegisterOtpValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('otp').trim().notEmpty().withMessage('Verification code is required')
]

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
]

const emailOnly = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required')
]

const resetPasswordValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('otp').trim().notEmpty().withMessage('Verification code is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
]

// ── Routes ────────────────────────────────────────────────────────────────────

// Registration (2-step: create unverified user + OTP, then verify)
router.post(
  '/send-register-otp',
  validate(sendRegisterOtpValidation),
  sendRegisterOtp
)
router.post('/resend-register-otp', validate(emailOnly), resendRegisterOtp)
router.post(
  '/verify-register-otp',
  validate(verifyRegisterOtpValidation),
  verifyRegisterOtp
)

// Login
router.post('/login', validate(loginValidation), login)

// Forgot / reset password
router.post('/forgot-password', validate(emailOnly), forgotPassword)
router.post('/reset-password', validate(resetPasswordValidation), resetPassword)

// Google OAuth — credential flow (@react-oauth/google sends ID token here)
router.post('/google', googleTokenAuth)

// Google OAuth — redirect flow (kept for backwards compatibility)
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
)
router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: '/login'
  }),
  googleCallback
)

// Get current user
router.get('/me', authenticate, getMe)

export default router
