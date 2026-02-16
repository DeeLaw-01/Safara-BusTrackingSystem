import { Request, Response } from 'express';

import User from '../models/user.model';
import Trip from '../models/trip.model';
import Bus from '../models/bus.model';
import Route from '../models/route.model';
import { UserRole } from '../../../shared/src/user.types';
import { getAllActiveBusLocations } from '../config/redis';

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
