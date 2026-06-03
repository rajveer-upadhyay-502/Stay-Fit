import express from 'express';
import User from '../models/User';
import Profile from '../models/Profile';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

// Verify Firebase token and register/retrieve matching database user
router.post('/verify', authMiddleware as any, async (req: AuthenticatedRequest, res) => {
  try {
    const { uid: firebaseUid, email, phoneNumber } = req.user!;

    let user = await User.findOne({ firebaseUid });
    let hasProfile = false;

    if (!user) {
      // Safe account linking: if a user with this verified email or phone already exists,
      // update their firebaseUid. This is secure because the claims are verified by Firebase Admin.
      if (email) {
        user = await User.findOne({ email });
      }
      if (!user && phoneNumber) {
        user = await User.findOne({ phoneNumber });
      }

      if (user) {
        user.firebaseUid = firebaseUid;
        await user.save();
      } else {
        user = new User({ firebaseUid, phoneNumber, email });
        await user.save();
      }
    } else {
      // Update values if provider changed or expanded
      let modified = false;
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
    }

    // Check if this user already has a profile in the DB
    const profile = await Profile.findOne({ userId: user._id });
    if (profile) {
      hasProfile = true;
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
