import { Platform } from 'react-native';

// Dynamic resolution using Expo environment variables
const DEV_MACHINE_IP = process.env.EXPO_PUBLIC_DEV_MACHINE_IP || '192.168.0.101';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || (Platform.OS === 'web'
  ? 'http://localhost:8000'
  : `http://${DEV_MACHINE_IP}:8000`);
