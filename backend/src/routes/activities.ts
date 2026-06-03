import express from 'express';
import mongoose from 'mongoose';
import Activity from '../models/Activity';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

// Record / Upsert activity details for a specific day
router.post('/', authMiddleware as any, async (req: AuthenticatedRequest, res) => {
  try {
    const { userId, steps, distance, stepLength, flights, asymmetry, date } = req.body;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid or missing userId' });
    }

    // Authorization: Ensure authenticated user matches target userId
    if (!req.mongoUser || req.mongoUser._id.toString() !== userId) {
      return res.status(403).json({ error: 'Forbidden: Access denied' });
    }

    // Normalize date to start of UTC day to ensure uniqueness per day
    const activityDate = date ? new Date(date) : new Date();
    if (isNaN(activityDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }
    activityDate.setUTCHours(0, 0, 0, 0);

    const updateFields = {
      steps: steps !== undefined ? Number(steps) : 0,
      distance: distance !== undefined ? Number(distance) : 0,
      stepLength: stepLength !== undefined ? Number(stepLength) : 0,
      flights: flights !== undefined ? Number(flights) : 0,
      asymmetry: asymmetry !== undefined ? Number(asymmetry) : 0,
    };

    // Upsert: Find by user & date, update fields, create if doesn't exist
    const activity = await Activity.findOneAndUpdate(
      { userId, date: activityDate },
      { $set: updateFields },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json(activity);
  } catch (error) {
    console.error('Error logging activity:', error);
    res.status(500).json({ error: 'Failed to record activity' });
  }
});

// Get user's activities (defaulting to the last 7 days)
router.get('/:userId', authMiddleware as any, async (req: AuthenticatedRequest, res) => {
  try {
    const { userId } = req.params;
    const { limit } = req.query;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId as string)) {
      return res.status(400).json({ error: 'Invalid userId format' });
    }

    // Authorization: Ensure authenticated user matches target userId
    if (!req.mongoUser || req.mongoUser._id.toString() !== userId) {
      return res.status(403).json({ error: 'Forbidden: Access denied' });
    }

    const queryLimit = limit ? parseInt(limit as string, 10) : 7;

    const activities = await Activity.find({ userId })
      .sort({ date: -1 })
      .limit(queryLimit);

    res.status(200).json(activities);
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

export default router;
