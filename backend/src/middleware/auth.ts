import admin from 'firebase-admin';
import { Request, Response, NextFunction } from 'express';
import User from '../models/User';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // Replace escape sequences for newlines in private key
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (projectId && clientEmail && privateKey && privateKey.includes('BEGIN PRIVATE KEY')) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
    console.log('Firebase Admin initialized with service account.');
  } else {
    // Fallback: token verification works using public key metadata from Google without a private key
    admin.initializeApp({
      projectId: projectId || 'stay-fit-cf70f',
    });
    console.log('Firebase Admin initialized with fallback project ID:', projectId || 'stay-fit-cf70f');
  }
}

// Extend Request interface to support req.user and req.mongoUser
export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    phoneNumber?: string;
  };
  mongoUser?: any; // The MongoDB User document
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization header missing or malformed' });
    }

    const token = authHeader.split(' ')[1];

    // Development backdoor/mock token verification (restricted to non-production env)
    const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
    if (isDev && token === 'mock_token_urajveer7') {
      const mockUser = {
        uid: 'google_expo_go_mock_uid_urajveer7',
        email: 'urajveer7@gmail.com',
      };
      req.user = mockUser;

      // Find or create mock user in database to ensure development flows run smoothly
      let user = await User.findOne({ firebaseUid: mockUser.uid });
      if (!user) {
        user = new User({
          firebaseUid: mockUser.uid,
          email: mockUser.email,
        });
        await user.save();
      }
      req.mongoUser = user;
      return next();
    }

    // Verify Firebase ID Token
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      phoneNumber: decodedToken.phone_number,
    };

    // Retrieve matching user from MongoDB
    const user = await User.findOne({ firebaseUid: decodedToken.uid });
    req.mongoUser = user;

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};
