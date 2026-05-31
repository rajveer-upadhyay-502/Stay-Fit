import express from 'express';
import Activity from '../models/Activity';

const router = express.Router();

// Record / Upsert activity details for a specific day
router.post('/', async (req, res) => {
  try {
    const { userId, steps, distance, stepLength, flights, asymmetry, date } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Normalize date to start of UTC day to ensure uniqueness per day
    const activityDate = date ? new Date(date) : new Date();
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
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit } = req.query;

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
