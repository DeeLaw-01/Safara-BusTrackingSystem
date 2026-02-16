import { Request, Response } from 'express';

import Bus from '../models/bus.model';
import { getBusLocation, getActiveBus } from '../config/redis';

export const getAllBuses = async (req: Request, res: Response): Promise<void> => {
  try {
    const { routeId, active } = req.query;

    const filter: Record<string, unknown> = {};
    if (routeId) {
      filter.routeId = routeId;
    }
    if (active === 'true') {
      filter.isActive = true;
    }

    const buses = await Bus.find(filter)
      .populate('routeId', 'name')
      .populate('driverId', 'name email phone')
      .sort({ name: 1 });

    res.json({ success: true, data: buses });
  } catch (error) {
    console.error('Get buses error:', error);
    res.status(500).json({ success: false, error: 'Failed to get buses' });
  }
};

export const getBusById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const bus = await Bus.findById(id)
      .populate('routeId', 'name description')
      .populate('driverId', 'name email phone');

    if (!bus) {
      res.status(404).json({ success: false, error: 'Bus not found' });
      return;
    }

    res.json({ success: true, data: bus });
  } catch (error) {
    console.error('Get bus error:', error);
    res.status(500).json({ success: false, error: 'Failed to get bus' });
  }
};

export const getBusLocation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const location = await getBusLocation(id);

    if (!location) {
      res.status(404).json({ success: false, error: 'Bus location not available' });
      return;
    }

    res.json({ success: true, data: location });
  } catch (error) {
    console.error('Get bus location error:', error);
    res.status(500).json({ success: false, error: 'Failed to get bus location' });
  }
};

export const createBus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { plateNumber, name, capacity, routeId, driverId, isActive } = req.body;

    // Check if plate number already exists
    const existingBus = await Bus.findOne({ plateNumber: plateNumber.toUpperCase() });
    if (existingBus) {
      res.status(400).json({ success: false, error: 'Plate number already registered' });
      return;
    }

    const bus = await Bus.create({
      plateNumber,
      name,
      capacity,
      routeId,
      driverId,
      isActive,
    });

    res.status(201).json({ success: true, data: bus });
  } catch (error) {
    console.error('Create bus error:', error);
    res.status(500).json({ success: false, error: 'Failed to create bus' });
  }
};

export const updateBus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { plateNumber, name, capacity, routeId, driverId, isActive } = req.body;

    // Check if plate number is being changed and already exists
    if (plateNumber) {
      const existingBus = await Bus.findOne({
        plateNumber: plateNumber.toUpperCase(),
        _id: { $ne: id },
      });
      if (existingBus) {
        res.status(400).json({ success: false, error: 'Plate number already registered' });
        return;
      }
    }

    const bus = await Bus.findByIdAndUpdate(
      id,
      { plateNumber, name, capacity, routeId, driverId, isActive },
      { new: true, runValidators: true }
    );

    if (!bus) {
      res.status(404).json({ success: false, error: 'Bus not found' });
      return;
    }

    res.json({ success: true, data: bus });
  } catch (error) {
    console.error('Update bus error:', error);
    res.status(500).json({ success: false, error: 'Failed to update bus' });
  }
};

export const deleteBus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if bus has an active trip
    const activeTripId = await getActiveBus(id);
    if (activeTripId) {
      res.status(400).json({ success: false, error: 'Cannot delete bus with active trip' });
      return;
    }

    const bus = await Bus.findByIdAndDelete(id);

    if (!bus) {
      res.status(404).json({ success: false, error: 'Bus not found' });
      return;
    }

    res.json({ success: true, message: 'Bus deleted successfully' });
  } catch (error) {
    console.error('Delete bus error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete bus' });
  }
};

export const assignDriver = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { driverId } = req.body;

    const bus = await Bus.findByIdAndUpdate(
      id,
      { driverId },
      { new: true }
    ).populate('driverId', 'name email phone');

    if (!bus) {
      res.status(404).json({ success: false, error: 'Bus not found' });
      return;
    }

    res.json({ success: true, data: bus });
  } catch (error) {
    console.error('Assign driver error:', error);
    res.status(500).json({ success: false, error: 'Failed to assign driver' });
  }
};

export const assignRoute = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { routeId } = req.body;

    const bus = await Bus.findByIdAndUpdate(
      id,
      { routeId },
      { new: true }
    ).populate('routeId', 'name');

    if (!bus) {
      res.status(404).json({ success: false, error: 'Bus not found' });
      return;
    }

    res.json({ success: true, data: bus });
  } catch (error) {
    console.error('Assign route error:', error);
    res.status(500).json({ success: false, error: 'Failed to assign route' });
  }
};
