import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '../../firebaseConfig';
import { API_BASE_URL } from '../config';

interface UserContextType {
  mongoUserId: string | null;
  hasProfile: boolean;
  token: string | null;
  firebaseUser: any | null; // Can be FirebaseUser or mock user object
  authLoading: boolean;
  refreshUser: () => Promise<void>;
  simulateGoogleLogin: () => Promise<any>;
  simulatePhoneLogin: (phoneNumber: string) => Promise<any>;
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [mongoUserId, setMongoUserId] = useState<string | null>(null);
  const [hasProfile, setHasProfile] = useState<boolean>(false);
  const [token, setToken] = useState<string | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<any | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  const fetchMongoUser = async (user: any, idToken: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMongoUserId(data.user._id);
        setHasProfile(data.hasProfile);
      } else {
        console.error('Failed to verify user on backend:', response.status);
      }
    } catch (error) {
      console.error('Failed to verify user on backend:', error);
    }
  };

  const refreshUser = async () => {
    if (firebaseUser) {
      setAuthLoading(true);
      try {
        const idToken = firebaseUser.uid === 'google_expo_go_mock_uid_urajveer7'
          ? 'mock_token_urajveer7'
          : await firebaseUser.getIdToken(true);
        setToken(idToken);
        await fetchMongoUser(firebaseUser, idToken);
      } catch (err) {
        console.error('Error refreshing token/user:', err);
      } finally {
        setAuthLoading(false);
      }
    }
  };

  const simulateGoogleLogin = async () => {
    setAuthLoading(true);
    try {
      const mockUser = {
        uid: 'google_expo_go_mock_uid_urajveer7',
        email: 'urajveer7@gmail.com',
      };
      setFirebaseUser(mockUser);
      const mockToken = 'mock_token_urajveer7';
      setToken(mockToken);
      await fetchMongoUser(mockUser, mockToken);
    } catch (err) {
      console.error('Simulation Google login failed:', err);
    } finally {
      setAuthLoading(false);
    }
  };

  const simulatePhoneLogin = async (phoneNumber: string) => {
    setAuthLoading(true);
    try {
      const mockUser = {
        uid: `phone_expo_go_mock_uid_${phoneNumber.replace(/[^0-9]/g, '')}`,
        phoneNumber: phoneNumber,
      };
      setFirebaseUser(mockUser);
      const mockToken = 'mock_token_urajveer7';
      setToken(mockToken);
      
      const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mockToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMongoUserId(data.user._id);
        setHasProfile(data.hasProfile);
        return data;
      } else {
        throw new Error('Verification failed');
      }
    } catch (err) {
      console.error('Simulation Phone login failed:', err);
      throw err;
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = async () => {
    setMongoUserId(null);
    setHasProfile(false);
    setToken(null);
    setFirebaseUser(null);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // If we already have a mock user in simulation mode, don't overwrite it automatically
      // unless Firebase explicitly signs in a real user or mock logout is called.
      if (firebaseUser?.uid === 'google_expo_go_mock_uid_urajveer7' && !user) {
        setAuthLoading(false);
        return;
      }

      setAuthLoading(true);
      if (user) {
        setFirebaseUser(user);
        try {
          const idToken = await user.getIdToken();
          setToken(idToken);
          await fetchMongoUser(user, idToken);
        } catch (e) {
          console.error('Error getting ID token:', e);
        }
      } else {
        setFirebaseUser(null);
        setMongoUserId(null);
        setHasProfile(false);
        setToken(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, [firebaseUser]);

  return (
    <UserContext.Provider
      value={{
        mongoUserId,
        hasProfile,
        token,
        firebaseUser,
        authLoading,
        refreshUser,
        simulateGoogleLogin,
        simulatePhoneLogin,
        logout,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
