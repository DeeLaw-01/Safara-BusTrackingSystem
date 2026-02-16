import { Request, Response } from 'express';

import Trip from '../models/trip.model';
import Bus from '../models/bus.model';
import LocationUpdate from '../models/locationUpdate.model';

export const getDriverTrips = async (req: Request, res: Response): Promise<void> => {
  try {
    const driverId = req.user?._id;
    const { status, limit = 10, page = 1 } = req.query;

    const filter: Record<string, unknown> = { driverId };
    if (status) {
      filter.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [trips, total] = await Promise.all([
      Trip.find(filter)
        .populate('busId', 'name plateNumber')
        .populate('routeId', 'name')
        .sort({ startTime: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Trip.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: trips,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get driver trips error:', error);
    res.status(500).json({ success: false, error: 'Failed to get trips' });
  }
};

export const getCurrentTrip = async (req: Request, res: Response): Promise<void> => {
  try {
    const driverId = req.user?._id;

    const trip = await Trip.findOne({ driverId, status: 'ongoing' })
      .populate('busId', 'name plateNumber')
      .populate('routeId', 'name');

    res.json({ success: true, data: trip });
  } catch (error) {
    console.error('Get current trip error:', error);
    res.status(500).json({ success: false, error: 'Failed to get current trip' });
  }
};

export const getDriverAssignedBus = async (req: Request, res: Response): Promise<void> => {
  try {
    const driverId = req.user?._id;

    const bus = await Bus.findOne({ driverId })
      .populate('routeId', 'name description');

    if (!bus) {
      res.status(404).json({ success: false, error: 'No bus assigned to you' });
      return;
    }

    res.json({ success: true, data: bus });
  } catch (error) {
    console.error('Get assigned bus error:', error);
    res.status(500).json({ success: false, error: 'Failed to get assigned bus' });
  }
};

export const getTripById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const trip = await Trip.findById(id)
      .populate('busId', 'name plateNumber')
      .populate('driverId', 'name')
      .populate('routeId', 'name');

    if (!trip) {
      res.status(404).json({ success: false, error: 'Trip not found' });
      return;
    }

    res.json({ success: true, data: trip });
  } catch (error) {
    console.error('Get trip error:', error);
    res.status(500).json({ success: false, error: 'Failed to get trip' });
  }
};

export const getTripLocations = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const locations = await LocationUpdate.find({ tripId: id })
      .sort({ timestamp: 1 });

    res.json({ success: true, data: locations });
  } catch (error) {
    console.error('Get trip locations error:', error);
    res.status(500).json({ success: false, error: 'Failed to get trip locations' });
  }
};

export const getAllTrips = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, routeId, driverId, busId, limit = 20, page = 1 } = req.query;

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (routeId) filter.routeId = routeId;
    if (driverId) filter.driverId = driverId;
    if (busId) filter.busId = busId;

    const skip = (Number(page) - 1) * Number(limit);

    const [trips, total] = await Promise.all([
      Trip.find(filter)
        .populate('busId', 'name plateNumber')
        .populate('driverId', 'name email')
        .populate('routeId', 'name')
        .sort({ startTime: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Trip.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: trips,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get all trips error:', error);
    res.status(500).json({ success: false, error: 'Failed to get trips' });
  }
};
