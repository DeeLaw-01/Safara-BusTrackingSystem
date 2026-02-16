import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import User from '../models/user.model';
import { UserRole, IAuthResponse } from '../../../shared/src/user.types';

const generateToken = (userId: string, role: string): string => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name, phone, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ success: false, error: 'Email already registered' });
      return;
    }

    // Validate role
    if (!Object.values(UserRole).includes(role)) {
      res.status(400).json({ success: false, error: 'Invalid role' });
      return;
    }

    // Don't allow admin registration through this endpoint
    if (role === UserRole.ADMIN) {
      res.status(403).json({ success: false, error: 'Admin registration not allowed' });
      return;
    }

    // Create user
    const user = await User.create({
      email,
      password,
      name,
      phone,
      role,
      isApproved: role === UserRole.RIDER, // Riders auto-approved, drivers need admin approval
    });

    // Generate token
    const token = generateToken(user._id.toString(), user.role);

    const response: IAuthResponse = {
      user: {
        _id: user._id.toString(),
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role as UserRole,
        isApproved: user.isApproved,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      token,
    };

    res.status(201).json({ success: true, data: response });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, error: 'Registration failed' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user with password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
      return;
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
      return;
    }

    // Generate token
    const token = generateToken(user._id.toString(), user.role);

    const response: IAuthResponse = {
      user: {
        _id: user._id.toString(),
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role as UserRole,
        homeStop: user.homeStop?.toString(),
        isApproved: user.isApproved,
        avatar: user.avatar,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      token,
    };

    res.json({ success: true, data: response });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Login failed' });
  }
};

export const googleCallback = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.redirect(`${process.env.CLIENT_URL}/login?error=auth_failed`);
      return;
    }

    // Generate token
    const token = generateToken(user._id.toString(), user.role);

    // Redirect to client with token
    res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}`);
  } catch (error) {
    console.error('Google callback error:', error);
    res.redirect(`${process.env.CLIENT_URL}/login?error=auth_failed`);
  }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
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
        avatar: user.avatar,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ success: false, error: 'Failed to get user info' });
  }
};
