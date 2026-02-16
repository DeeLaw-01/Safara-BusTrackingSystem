import { Request, Response } from 'express';

import Reminder from '../models/reminder.model';

export const getMyReminders = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;

    const reminders = await Reminder.find({ userId })
      .populate('stopId', 'name')
      .populate('routeId', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: reminders });
  } catch (error) {
    console.error('Get reminders error:', error);
    res.status(500).json({ success: false, error: 'Failed to get reminders' });
  }
};

export const createReminder = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    const { stopId, routeId, minutesBefore, notificationType } = req.body;

    // Check if reminder already exists
    const existingReminder = await Reminder.findOne({
      userId,
      stopId,
      routeId,
      isActive: true,
    });

    if (existingReminder) {
      res.status(400).json({ success: false, error: 'Reminder already exists for this stop' });
      return;
    }

    const reminder = await Reminder.create({
      userId,
      stopId,
      routeId,
      minutesBefore: minutesBefore || 5,
      notificationType: notificationType || 'push',
      isActive: true,
    });

    const populated = await reminder.populate([
      { path: 'stopId', select: 'name' },
      { path: 'routeId', select: 'name' },
    ]);

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    console.error('Create reminder error:', error);
    res.status(500).json({ success: false, error: 'Failed to create reminder' });
  }
};

export const updateReminder = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    const { id } = req.params;
    const { minutesBefore, notificationType, isActive } = req.body;

    const reminder = await Reminder.findOneAndUpdate(
      { _id: id, userId },
      { minutesBefore, notificationType, isActive },
      { new: true, runValidators: true }
    ).populate([
      { path: 'stopId', select: 'name' },
      { path: 'routeId', select: 'name' },
    ]);

    if (!reminder) {
      res.status(404).json({ success: false, error: 'Reminder not found' });
      return;
    }

    res.json({ success: true, data: reminder });
  } catch (error) {
    console.error('Update reminder error:', error);
    res.status(500).json({ success: false, error: 'Failed to update reminder' });
  }
};

export const deleteReminder = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    const { id } = req.params;

    const reminder = await Reminder.findOneAndDelete({ _id: id, userId });

    if (!reminder) {
      res.status(404).json({ success: false, error: 'Reminder not found' });
      return;
    }

    res.json({ success: true, message: 'Reminder deleted successfully' });
  } catch (error) {
    console.error('Delete reminder error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete reminder' });
  }
};

export const toggleReminder = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    const { id } = req.params;

    const reminder = await Reminder.findOne({ _id: id, userId });

    if (!reminder) {
      res.status(404).json({ success: false, error: 'Reminder not found' });
      return;
    }

    reminder.isActive = !reminder.isActive;
    await reminder.save();

    res.json({ success: true, data: reminder });
  } catch (error) {
    console.error('Toggle reminder error:', error);
    res.status(500).json({ success: false, error: 'Failed to toggle reminder' });
  }
};
