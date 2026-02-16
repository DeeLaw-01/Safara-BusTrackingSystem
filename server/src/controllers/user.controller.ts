import { Request, Response } from 'express';

import User from '../models/user.model';

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    const { name, phone, homeStop, fcmToken } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { name, phone, homeStop, fcmToken },
      { new: true, runValidators: true }
    );

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, error: 'Failed to update profile' });
  }
};

export const setHomeStop = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    const { stopId } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { homeStop: stopId },
      { new: true }
    );

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Set home stop error:', error);
    res.status(500).json({ success: false, error: 'Failed to set home stop' });
  }
};

export const updateFcmToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    const { fcmToken } = req.body;

    await User.findByIdAndUpdate(userId, { fcmToken });

    res.json({ success: true, message: 'FCM token updated' });
  } catch (error) {
    console.error('Update FCM token error:', error);
    res.status(500).json({ success: false, error: 'Failed to update FCM token' });
  }
};
