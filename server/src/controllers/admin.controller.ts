import { Request, Response } from 'express';
import crypto from 'crypto';

import User from '../models/user.model';
import Trip from '../models/trip.model';
import Bus from '../models/bus.model';
import Route from '../models/route.model';
import Invitation from '../models/invitation.model';
import { UserRole } from '../../../shared/src/user.types';
import { getAllActiveBusLocations } from '../config/redis';
import { sendInvitationEmail } from '../services/email.service';

// User Management
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { role, approved, search, limit = 20, page = 1 } = req.query;

    const filter: Record<string, unknown> = {};
    if (role) filter.role = role;
    if (approved !== undefined) filter.isApproved = approved === 'true';
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      User.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, error: 'Failed to get users' });
  }
};

export const getPendingDrivers = async (req: Request, res: Response): Promise<void> => {
  try {
    const drivers = await User.find({
      role: UserRole.DRIVER,
      isApproved: false,
    })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: drivers });
  } catch (error) {
    console.error('Get pending drivers error:', error);
    res.status(500).json({ success: false, error: 'Failed to get pending drivers' });
  }
};

export const approveDriver = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await User.findOneAndUpdate(
      { _id: id, role: UserRole.DRIVER },
      { isApproved: true },
      { new: true }
    ).select('-password');

    if (!user) {
      res.status(404).json({ success: false, error: 'Driver not found' });
      return;
    }

    res.json({ success: true, data: user, message: 'Driver approved successfully' });
  } catch (error) {
    console.error('Approve driver error:', error);
    res.status(500).json({ success: false, error: 'Failed to approve driver' });
  }
};

export const rejectDriver = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Delete the driver account
    const user = await User.findOneAndDelete({
      _id: id,
      role: UserRole.DRIVER,
      isApproved: false,
    });

    if (!user) {
      res.status(404).json({ success: false, error: 'Pending driver not found' });
      return;
    }

    res.json({ success: true, message: 'Driver rejected and removed' });
  } catch (error) {
    console.error('Reject driver error:', error);
    res.status(500).json({ success: false, error: 'Failed to reject driver' });
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Prevent self-deletion
    if (req.user?._id.toString() === id) {
      res.status(400).json({ success: false, error: 'Cannot delete your own account' });
      return;
    }

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    // Remove driver from any assigned buses
    await Bus.updateMany({ driverId: id }, { $unset: { driverId: 1 } });

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete user' });
  }
};

// Analytics & Dashboard
export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      totalDrivers,
      totalRiders,
      pendingDrivers,
      totalBuses,
      activeBuses,
      totalRoutes,
      activeRoutes,
      todayTrips,
      ongoingTrips,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: UserRole.DRIVER }),
      User.countDocuments({ role: UserRole.RIDER }),
      User.countDocuments({ role: UserRole.DRIVER, isApproved: false }),
      Bus.countDocuments(),
      Bus.countDocuments({ isActive: true }),
      Route.countDocuments(),
      Route.countDocuments({ isActive: true }),
      Trip.countDocuments({ startTime: { $gte: today } }),
      Trip.countDocuments({ status: 'ongoing' }),
    ]);

    // Get live bus locations
    const liveBusLocations = await getAllActiveBusLocations();

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          drivers: totalDrivers,
          riders: totalRiders,
          pendingDrivers,
        },
        buses: {
          total: totalBuses,
          active: activeBuses,
          live: liveBusLocations.length,
        },
        routes: {
          total: totalRoutes,
          active: activeRoutes,
        },
        trips: {
          today: todayTrips,
          ongoing: ongoingTrips,
        },
        liveLocations: liveBusLocations,
      },
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to get dashboard stats' });
  }
};

export const getRecentTrips = async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = 10 } = req.query;

    const trips = await Trip.find()
      .populate('busId', 'name plateNumber')
      .populate('driverId', 'name')
      .populate('routeId', 'name')
      .sort({ startTime: -1 })
      .limit(Number(limit));

    res.json({ success: true, data: trips });
  } catch (error) {
    console.error('Get recent trips error:', error);
    res.status(500).json({ success: false, error: 'Failed to get recent trips' });
  }
};

export const getLiveBuses = async (req: Request, res: Response): Promise<void> => {
  try {
    const locations = await getAllActiveBusLocations();
    res.json({ success: true, data: locations });
  } catch (error) {
    console.error('Get live buses error:', error);
    res.status(500).json({ success: false, error: 'Failed to get live buses' });
  }
};

// ─── Invitations ─────────────────────────────────────────────────────────────

const INVITATION_EXPIRY_DAYS = 7;

export const createInvitation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    const adminId = req.user?._id;

    if (!email) {
      res.status(400).json({ success: false, error: 'Email is required' });
      return;
    }

    // Check if user already exists and is verified
    const existingUser = await User.findOne({ email: email.toLowerCase(), isEmailVerified: true });
    if (existingUser) {
      res.status(400).json({ success: false, error: 'A user with this email already exists' });
      return;
    }

    // Check if there's already a pending invitation for this email
    const existingInvite = await Invitation.findOne({
      email: email.toLowerCase(),
      status: 'pending',
      expiresAt: { $gt: new Date() },
    });
    if (existingInvite) {
      res.status(400).json({ success: false, error: 'A pending invitation already exists for this email' });
      return;
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    const invitation = await Invitation.create({
      email: email.toLowerCase(),
      invitedBy: adminId,
      token,
      expiresAt,
      status: 'pending',
    });

    // Send invitation email
    await sendInvitationEmail(email, token);

    res.status(201).json({
      success: true,
      data: invitation,
      message: `Invitation sent to ${email}`,
    });
  } catch (error) {
    console.error('Create invitation error:', error);
    res.status(500).json({ success: false, error: 'Failed to create invitation' });
  }
};

export const createBatchInvitations = async (req: Request, res: Response): Promise<void> => {
  try {
    const { emails } = req.body;
    const adminId = req.user?._id;

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      res.status(400).json({ success: false, error: 'Emails array is required and must not be empty' });
      return;
    }

    if (emails.length > 100) {
      res.status(400).json({ success: false, error: 'Maximum 100 emails allowed per batch' });
      return;
    }

    const results: {
      success: Array<{ email: string; invitationId: string }>;
      failed: Array<{ email: string; reason: string }>;
    } = {
      success: [],
      failed: [],
    };

    // Process emails in parallel batches to avoid overwhelming the system
    const BATCH_SIZE = 10;
    const normalizedEmails = emails.map((e: string) => e.toLowerCase().trim()).filter(Boolean);

    // Remove duplicates
    const uniqueEmails = [...new Set(normalizedEmails)];

    for (let i = 0; i < uniqueEmails.length; i += BATCH_SIZE) {
      const batch = uniqueEmails.slice(i, i + BATCH_SIZE);
      
      await Promise.all(
        batch.map(async (email: string) => {
          try {
            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
              results.failed.push({ email, reason: 'Invalid email format' });
              return;
            }

            // Check if user already exists and is verified
            const existingUser = await User.findOne({ email, isEmailVerified: true });
            if (existingUser) {
              results.failed.push({ email, reason: 'User already exists' });
              return;
            }

            // Check if there's already a pending invitation for this email
            const existingInvite = await Invitation.findOne({
              email,
              status: 'pending',
              expiresAt: { $gt: new Date() },
            });
            if (existingInvite) {
              results.failed.push({ email, reason: 'Pending invitation already exists' });
              return;
            }

            // Create invitation
            const token = crypto.randomBytes(32).toString('hex');
            const expiresAt = new Date(Date.now() + INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

            const invitation = await Invitation.create({
              email,
              invitedBy: adminId,
              token,
              expiresAt,
              status: 'pending',
            });

            // Send invitation email (don't await to speed up batch processing)
            sendInvitationEmail(email, token).catch((err) => {
              console.error(`Failed to send invitation email to ${email}:`, err);
            });

            results.success.push({ email, invitationId: invitation._id.toString() });
          } catch (error) {
            console.error(`Error processing invitation for ${email}:`, error);
            results.failed.push({ email, reason: 'Internal server error' });
          }
        })
      );
    }

    res.status(201).json({
      success: true,
      data: {
        total: uniqueEmails.length,
        successful: results.success.length,
        failed: results.failed.length,
        results,
      },
      message: `Processed ${uniqueEmails.length} emails: ${results.success.length} successful, ${results.failed.length} failed`,
    });
  } catch (error) {
    console.error('Create batch invitations error:', error);
    res.status(500).json({ success: false, error: 'Failed to create batch invitations' });
  }
};

export const listInvitations = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, limit = 20, page = 1 } = req.query;

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [invitations, total] = await Promise.all([
      Invitation.find(filter)
        .populate('invitedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Invitation.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: invitations,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('List invitations error:', error);
    res.status(500).json({ success: false, error: 'Failed to list invitations' });
  }
};

export const revokeInvitation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const invitation = await Invitation.findOneAndUpdate(
      { _id: id, status: 'pending' },
      { status: 'revoked' },
      { new: true }
    );

    if (!invitation) {
      res.status(404).json({ success: false, error: 'Pending invitation not found' });
      return;
    }

    res.json({ success: true, message: 'Invitation revoked' });
  } catch (error) {
    console.error('Revoke invitation error:', error);
    res.status(500).json({ success: false, error: 'Failed to revoke invitation' });
  }
};

export const resendInvitation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const invitation = await Invitation.findOne({ _id: id, status: 'pending' });
    if (!invitation) {
      res.status(404).json({ success: false, error: 'Pending invitation not found' });
      return;
    }

    // Refresh expiry
    invitation.expiresAt = new Date(Date.now() + INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    await invitation.save();

    await sendInvitationEmail(invitation.email, invitation.token);

    res.json({ success: true, message: `Invitation resent to ${invitation.email}` });
  } catch (error) {
    console.error('Resend invitation error:', error);
    res.status(500).json({ success: false, error: 'Failed to resend invitation' });
  }
};

// ─── Role Management ─────────────────────────────────────────────────────────

export const changeUserRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !Object.values(UserRole).includes(role)) {
      res.status(400).json({ success: false, error: 'Invalid role' });
      return;
    }

    if (role === UserRole.ADMIN) {
      res.status(403).json({ success: false, error: 'Cannot assign admin role' });
      return;
    }

    // Prevent changing own role
    if (req.user?._id.toString() === id) {
      res.status(400).json({ success: false, error: 'Cannot change your own role' });
      return;
    }

    const user = await User.findById(id).select('-password');
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    if (user.role === UserRole.ADMIN) {
      res.status(403).json({ success: false, error: 'Cannot change an admin\'s role' });
      return;
    }

    user.role = role;
    // Auto-approve riders, drivers need separate approval
    user.isApproved = role === UserRole.RIDER ? true : user.isApproved;
    await user.save();

    res.json({ success: true, data: user, message: `User role changed to ${role}` });
  } catch (error) {
    console.error('Change user role error:', error);
    res.status(500).json({ success: false, error: 'Failed to change user role' });
  }
};
