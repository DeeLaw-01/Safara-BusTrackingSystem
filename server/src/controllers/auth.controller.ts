import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { OAuth2Client } from 'google-auth-library'

import User from '../models/user.model'
import Otp from '../models/otp.model'
import { UserRole, IAuthResponse } from '../../../shared/src/user.types'
import { sendOtpEmail } from '../services/email.service'

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

// ─── Helpers ─────────────────────────────────────────────────────────────────

const generateToken = (userId: string, role: string): string => {
  return jwt.sign({ id: userId, role }, process.env.JWT_SECRET || 'secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  })
}

function generateOtp (): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

const OTP_TTL_MINUTES = 10

async function createAndSendOtp (
  email: string,
  type: 'register' | 'forgot-password'
): Promise<void> {
  const otp = generateOtp()
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000)

  // Remove any existing OTPs for this email + type
  await Otp.deleteMany({ email: email.toLowerCase(), type })

  // Hash OTP before storing
  const hashedOtp = await bcrypt.hash(otp, 10)
  await Otp.create({
    email: email.toLowerCase(),
    otp: hashedOtp,
    type,
    expiresAt
  })

  await sendOtpEmail(email, otp, type)
}

async function verifyOtp (
  email: string,
  otp: string,
  type: 'register' | 'forgot-password'
): Promise<boolean> {
  const record = await Otp.findOne({ email: email.toLowerCase(), type })
  if (!record) return false
  if (record.expiresAt < new Date()) {
    await record.deleteOne()
    return false
  }
  const isMatch = await bcrypt.compare(otp, record.otp)
  if (isMatch) await record.deleteOne() // consume OTP
  return isMatch
}

function buildUserPayload (
  user: InstanceType<typeof User>
): Omit<IAuthResponse, 'token'> & { token?: string } {
  return {
    user: {
      _id: user._id.toString(),
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role as UserRole,
      homeStop: user.homeStop?.toString(),
      isApproved: user.isApproved,
      isEmailVerified: user.isEmailVerified,
      avatar: user.avatar,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }
  }
}

// ─── Registration ─────────────────────────────────────────────────────────────

// Step 1 – create unverified user + send OTP
export const sendRegisterOtp = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, name, password, phone, role } = req.body

    if (!email || !name || !password) {
      res
        .status(400)
        .json({
          success: false,
          error: 'Email, name, and password are required'
        })
      return
    }

    if (!Object.values(UserRole).includes(role)) {
      res.status(400).json({ success: false, error: 'Invalid role' })
      return
    }
    if (role === UserRole.ADMIN) {
      res
        .status(403)
        .json({ success: false, error: 'Admin registration not allowed' })
      return
    }

    const existing = await User.findOne({ email: email.toLowerCase() })

    if (existing && existing.isEmailVerified) {
      res
        .status(400)
        .json({ success: false, error: 'Email already registered' })
      return
    }

    if (existing && !existing.isEmailVerified) {
      // Update the unverified user's data (they may have changed fields)
      existing.name = name
      existing.password = password // pre-save hook will hash it
      existing.phone = phone
      existing.role = role
      existing.isApproved = role === UserRole.RIDER
      await existing.save()
    } else {
      // Create new unverified user
      await User.create({
        email,
        password,
        name,
        phone,
        role,
        isApproved: role === UserRole.RIDER,
        isEmailVerified: false
      })
    }

    await createAndSendOtp(email, 'register')
    res.json({ success: true, message: `Verification code sent to ${email}` })
  } catch (error) {
    console.error('sendRegisterOtp error:', error)
    res
      .status(500)
      .json({ success: false, error: 'Failed to send verification code' })
  }
}

// Resend OTP for an existing unverified user (e.g. after login redirect)
export const resendRegisterOtp = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email } = req.body
    if (!email) {
      res.status(400).json({ success: false, error: 'Email is required' })
      return
    }

    const existing = await User.findOne({ email: email.toLowerCase() })
    if (!existing || existing.isEmailVerified) {
      res
        .status(400)
        .json({
          success: false,
          error: 'No pending verification for this email'
        })
      return
    }

    await createAndSendOtp(email, 'register')
    res.json({ success: true, message: `Verification code resent to ${email}` })
  } catch (error) {
    console.error('resendRegisterOtp error:', error)
    res
      .status(500)
      .json({ success: false, error: 'Failed to resend verification code' })
  }
}

// Step 2 – verify OTP → mark user verified → return token
export const verifyRegisterOtp = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, otp } = req.body

    if (!email || !otp) {
      res
        .status(400)
        .json({
          success: false,
          error: 'Email and verification code are required'
        })
      return
    }

    const otpValid = await verifyOtp(email, otp, 'register')
    if (!otpValid) {
      res
        .status(400)
        .json({ success: false, error: 'Invalid or expired verification code' })
      return
    }

    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) {
      res
        .status(404)
        .json({
          success: false,
          error: 'User not found. Please register again.'
        })
      return
    }

    user.isEmailVerified = true
    await user.save()

    const token = generateToken(user._id.toString(), user.role)

    const response: IAuthResponse = {
      ...buildUserPayload(user),
      token
    }

    res.status(200).json({ success: true, data: response })
  } catch (error) {
    console.error('verifyRegisterOtp error:', error)
    res.status(500).json({ success: false, error: 'Verification failed' })
  }
}

// ─── Login ────────────────────────────────────────────────────────────────────

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ email }).select('+password')
    if (!user) {
      res.status(401).json({ success: false, error: 'Invalid credentials' })
      return
    }

    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      res.status(401).json({ success: false, error: 'Invalid credentials' })
      return
    }

    // If user hasn't verified their email, send a fresh OTP and tell the client
    if (!user.isEmailVerified) {
      await createAndSendOtp(email, 'register')
      res.status(403).json({
        success: false,
        error: 'Please verify your email first. A new code has been sent.',
        pendingVerification: true,
        email: user.email
      })
      return
    }

    const token = generateToken(user._id.toString(), user.role)

    const response: IAuthResponse = {
      ...buildUserPayload(user),
      token
    }

    res.json({ success: true, data: response })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ success: false, error: 'Login failed' })
  }
}

// ─── Forgot Password ──────────────────────────────────────────────────────────

// Step 1 – send OTP to the registered email
export const forgotPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email } = req.body
    if (!email) {
      res.status(400).json({ success: false, error: 'Email is required' })
      return
    }

    // Don't reveal whether the email exists – always respond the same way
    const user = await User.findOne({
      email: email.toLowerCase(),
      isEmailVerified: true
    })
    if (user) {
      await createAndSendOtp(email, 'forgot-password')
    }

    res.json({
      success: true,
      message: 'If that email is registered, a reset code has been sent.'
    })
  } catch (error) {
    console.error('forgotPassword error:', error)
    res.status(500).json({ success: false, error: 'Failed to send reset code' })
  }
}

// Step 2 – verify OTP and set new password
export const resetPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, otp, newPassword } = req.body

    if (!email || !otp || !newPassword) {
      res
        .status(400)
        .json({
          success: false,
          error: 'Email, code, and new password are required'
        })
      return
    }

    if (newPassword.length < 6) {
      res
        .status(400)
        .json({
          success: false,
          error: 'Password must be at least 6 characters'
        })
      return
    }

    const otpValid = await verifyOtp(email, otp, 'forgot-password')
    if (!otpValid) {
      res
        .status(400)
        .json({ success: false, error: 'Invalid or expired reset code' })
      return
    }

    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' })
      return
    }

    user.password = newPassword // model pre-save hook will hash it
    await user.save()

    res.json({ success: true, message: 'Password reset successfully' })
  } catch (error) {
    console.error('resetPassword error:', error)
    res.status(500).json({ success: false, error: 'Failed to reset password' })
  }
}

// ─── Google OAuth ─────────────────────────────────────────────────────────────

// POST /api/auth/google — verifies a Google ID token from @react-oauth/google
export const googleTokenAuth = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { credential } = req.body

  if (!credential) {
    res
      .status(400)
      .json({ success: false, error: 'Google credential is required' })
    return
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    })

    const payload = ticket.getPayload()
    if (!payload) {
      res.status(401).json({ success: false, error: 'Invalid Google token' })
      return
    }

    const { sub: googleId, email, name, picture: avatar } = payload

    let user = await User.findOne({ googleId })

    if (!user && email) {
      user = await User.findOne({ email })
      if (user) {
        user.googleId = googleId
        if (avatar) user.avatar = avatar
        user.isEmailVerified = true // Google-verified email
        await user.save()
      }
    }

    if (!user) {
      user = await User.create({
        googleId,
        email,
        name,
        avatar,
        role: UserRole.RIDER,
        isApproved: true,
        isEmailVerified: true // Google-verified email
      })
    }

    const token = generateToken(user._id.toString(), user.role)

    const response: IAuthResponse = {
      ...buildUserPayload(user),
      token
    }

    res.json({ success: true, data: response })
  } catch (error) {
    console.error('Google token auth error:', error)
    res
      .status(401)
      .json({ success: false, error: 'Google authentication failed' })
  }
}

// GET /api/auth/google/callback — redirect-based OAuth (passport)
export const googleCallback = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = req.user
    if (!user) {
      res.redirect(`${process.env.CLIENT_URL}/login?error=auth_failed`)
      return
    }

    const token = generateToken(user._id.toString(), user.role)
    res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}`)
  } catch (error) {
    console.error('Google callback error:', error)
    res.redirect(`${process.env.CLIENT_URL}/login?error=auth_failed`)
  }
}

// ─── Me ───────────────────────────────────────────────────────────────────────

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user
    if (!user) {
      res.status(401).json({ success: false, error: 'Unauthorized' })
      return
    }

    res.json({
      success: true,
      data: {
        _id: user._id.toString(),
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        homeStop: user.homeStop?.toString(),
        isApproved: user.isApproved,
        isEmailVerified: user.isEmailVerified,
        avatar: user.avatar,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    })
  } catch (error) {
    console.error('Get me error:', error)
    res.status(500).json({ success: false, error: 'Failed to get user info' })
  }
}
