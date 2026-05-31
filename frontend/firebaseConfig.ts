import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// TODO: Replace with actual Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBT1vmabdJupQCm3ucoExo0V4eWzQe3I-c",
  authDomain: "stay-fit-cf70f.firebaseapp.com",
  projectId: "stay-fit-cf70f",
  storageBucket: "stay-fit-cf70f.firebasestorage.app",
  messagingSenderId: "75962193759",
  appId: "1:75962193759:web:e1406448c4e697a969c8ea",
  measurementId: "G-VL720S9NFN"
};
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
