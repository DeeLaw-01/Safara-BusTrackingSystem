import { Request, Response } from 'express';

import Route from '../models/route.model';
import Stop from '../models/stop.model';
import { getActiveBusesOnRoute } from '../config/redis';

export const getAllRoutes = async (req: Request, res: Response): Promise<void> => {
  try {
    const { active } = req.query;
    
    const filter: Record<string, unknown> = {};
    if (active === 'true') {
      filter.isActive = true;
    }

    const routes = await Route.find(filter)
      .populate('stops')
      .sort({ name: 1 });

    res.json({ success: true, data: routes });
  } catch (error) {
    console.error('Get routes error:', error);
    res.status(500).json({ success: false, error: 'Failed to get routes' });
  }
};

export const getRouteById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const route = await Route.findById(id).populate('stops');

    if (!route) {
      res.status(404).json({ success: false, error: 'Route not found' });
      return;
    }

    res.json({ success: true, data: route });
  } catch (error) {
    console.error('Get route error:', error);
    res.status(500).json({ success: false, error: 'Failed to get route' });
  }
};

export const getRouteStops = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const stops = await Stop.find({ routeId: id }).sort({ sequence: 1 });

    res.json({ success: true, data: stops });
  } catch (error) {
    console.error('Get route stops error:', error);
    res.status(500).json({ success: false, error: 'Failed to get stops' });
  }
};

export const getActiveBusesOnRouteHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const buses = await getActiveBusesOnRoute(id);

    res.json({ success: true, data: buses });
  } catch (error) {
    console.error('Get active buses error:', error);
    res.status(500).json({ success: false, error: 'Failed to get active buses' });
  }
};

export const createRoute = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, isActive } = req.body;

    const route = await Route.create({ name, description, isActive });

    res.status(201).json({ success: true, data: route });
  } catch (error) {
    console.error('Create route error:', error);
    res.status(500).json({ success: false, error: 'Failed to create route' });
  }
};

export const updateRoute = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, isActive } = req.body;

    const route = await Route.findByIdAndUpdate(
      id,
      { name, description, isActive },
      { new: true, runValidators: true }
    );

    if (!route) {
      res.status(404).json({ success: false, error: 'Route not found' });
      return;
    }

    res.json({ success: true, data: route });
  } catch (error) {
    console.error('Update route error:', error);
    res.status(500).json({ success: false, error: 'Failed to update route' });
  }
};

export const deleteRoute = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Delete all stops associated with this route
    await Stop.deleteMany({ routeId: id });

    // Delete the route
    const route = await Route.findByIdAndDelete(id);

    if (!route) {
      res.status(404).json({ success: false, error: 'Route not found' });
      return;
    }

    res.json({ success: true, message: 'Route deleted successfully' });
  } catch (error) {
    console.error('Delete route error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete route' });
  }
};
