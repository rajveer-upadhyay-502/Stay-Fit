import express from 'express';
import User from '../models/User';
import Profile from '../models/Profile';

const router = express.Router();

// Mock verify endpoint for MVP to register/login a user
// In a real app, you would verify the Firebase token using firebase-admin here.
router.post('/verify', async (req, res) => {
  try {
    const { firebaseUid, phoneNumber, email } = req.body;

    if (!firebaseUid) {
      return res.status(400).json({ error: 'firebaseUid is required' });
    }

    // Build search queries for existing users using OR matching
    const searchConditions: any[] = [{ firebaseUid }];
    if (email) searchConditions.push({ email });
    if (phoneNumber) searchConditions.push({ phoneNumber });

    let user = await User.findOne({ $or: searchConditions });
    let hasProfile = false;

    if (!user) {
      user = new User({ firebaseUid, phoneNumber, email });
      await user.save();
    } else {
      // Update values if provider changed or expanded
      let modified = false;
      if (user.firebaseUid !== firebaseUid) {
        user.firebaseUid = firebaseUid;
        modified = true;
      }
      if (email && !user.email) {
        user.email = email;
        modified = true;
      }
      if (phoneNumber && !user.phoneNumber) {
        user.phoneNumber = phoneNumber;
        modified = true;
      }
      
      if (modified) {
        await user.save();
      }

      // Check if this user already has a profile in the DB
      const profile = await Profile.findOne({ userId: user._id });
      if (profile) {
        hasProfile = true;
      }
    }

    return res.status(200).json({ 
      message: 'Verification successful', 
      user, 
      hasProfile 
    });
  } catch (error) {
    console.error('Error verifying user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
