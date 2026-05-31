import express from 'express';
import Profile from '../models/Profile';

const router = express.Router();

// Create a new profile
router.post('/', async (req, res) => {
  try {
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
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const profiles = await Profile.find({ userId });
    res.status(200).json(profiles);
  } catch (error) {
    console.error('Error fetching profiles:', error);
    res.status(500).json({ error: 'Failed to fetch profiles' });
  }
});

export default router;
