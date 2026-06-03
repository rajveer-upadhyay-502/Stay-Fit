import express from 'express';
import mongoose from 'mongoose';
import Profile from '../models/Profile';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

// Create a new profile
router.post('/', authMiddleware as any, async (req: AuthenticatedRequest, res) => {
  try {
    const { userId } = req.body;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid or missing userId' });
    }

    // Authorization: Ensure authenticated user matches target userId
    if (!req.mongoUser || req.mongoUser._id.toString() !== userId) {
      return res.status(403).json({ error: 'Forbidden: Access denied' });
    }

    const profileData = req.body;
    const newProfile = new Profile(profileData);
    await newProfile.save();
    res.status(201).json(newProfile);
  } catch (error) {
    console.error('Error creating profile:', error);
    res.status(500).json({ error: 'Failed to create profile' });
  }
});

// Get profiles by userId
router.get('/:userId', authMiddleware as any, async (req: AuthenticatedRequest, res) => {
  try {
    const { userId } = req.params;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId as string)) {
      return res.status(400).json({ error: 'Invalid userId format' });
    }

    // Authorization: Ensure authenticated user matches target userId
    if (!req.mongoUser || req.mongoUser._id.toString() !== userId) {
      return res.status(403).json({ error: 'Forbidden: Access denied' });
    }

    const profiles = await Profile.find({ userId });
    res.status(200).json(profiles);
  } catch (error) {
    console.error('Error fetching profiles:', error);
    res.status(500).json({ error: 'Failed to fetch profiles' });
  }
});

export default router;
