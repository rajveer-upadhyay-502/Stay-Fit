import { Platform } from 'react-native';

// Your computer's local IP address on the Wi-Fi network.
// This allows physical mobile devices (running Expo Go on the same Wi-Fi) to communicate with the local backend server.
const DEV_MACHINE_IP = '192.168.0.101';

export const API_BASE_URL = Platform.OS === 'web'
  ? 'http://localhost:8000'
  : `http://${DEV_MACHINE_IP}:8000`;
