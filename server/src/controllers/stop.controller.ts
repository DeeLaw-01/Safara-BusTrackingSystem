import { Request, Response } from 'express';

import Stop from '../models/stop.model';

export const getAllStops = async (req: Request, res: Response): Promise<void> => {
  try {
    const { routeId } = req.query;

    const filter: Record<string, unknown> = {};
    if (routeId) {
      filter.routeId = routeId;
    }

    const stops = await Stop.find(filter)
      .populate('routeId', 'name')
      .sort({ routeId: 1, sequence: 1 });

    res.json({ success: true, data: stops });
  } catch (error) {
    console.error('Get stops error:', error);
    res.status(500).json({ success: false, error: 'Failed to get stops' });
  }
};

export const getStopById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const stop = await Stop.findById(id).populate('routeId', 'name');

    if (!stop) {
      res.status(404).json({ success: false, error: 'Stop not found' });
      return;
    }

    res.json({ success: true, data: stop });
  } catch (error) {
    console.error('Get stop error:', error);
    res.status(500).json({ success: false, error: 'Failed to get stop' });
  }
};

export const createStop = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, latitude, longitude, sequence, routeId } = req.body;

    const stop = await Stop.create({
      name,
      latitude,
      longitude,
      sequence,
      routeId,
    });

    res.status(201).json({ success: true, data: stop });
  } catch (error) {
    console.error('Create stop error:', error);
    res.status(500).json({ success: false, error: 'Failed to create stop' });
  }
};

export const updateStop = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, latitude, longitude, sequence } = req.body;

    const stop = await Stop.findByIdAndUpdate(
      id,
      { name, latitude, longitude, sequence },
      { new: true, runValidators: true }
    );

    if (!stop) {
      res.status(404).json({ success: false, error: 'Stop not found' });
      return;
    }

    res.json({ success: true, data: stop });
  } catch (error) {
    console.error('Update stop error:', error);
    res.status(500).json({ success: false, error: 'Failed to update stop' });
  }
};

export const deleteStop = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const stop = await Stop.findByIdAndDelete(id);

    if (!stop) {
      res.status(404).json({ success: false, error: 'Stop not found' });
      return;
    }

    res.json({ success: true, message: 'Stop deleted successfully' });
  } catch (error) {
    console.error('Delete stop error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete stop' });
  }
};

export const reorderStops = async (req: Request, res: Response): Promise<void> => {
  try {
    const { stops } = req.body; // Array of { id, sequence }

    const bulkOps = stops.map((stop: { id: string; sequence: number }) => ({
      updateOne: {
        filter: { _id: stop.id },
        update: { sequence: stop.sequence },
      },
    }));

    await Stop.bulkWrite(bulkOps);

    res.json({ success: true, message: 'Stops reordered successfully' });
  } catch (error) {
    console.error('Reorder stops error:', error);
    res.status(500).json({ success: false, error: 'Failed to reorder stops' });
  }
};
