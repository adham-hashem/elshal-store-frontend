import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);

// Request notification permission and get FCM token
export async function requestNotificationPermission(): Promise<string | null> {
  try {
    // Check current permission state
    const permission = Notification.permission;
    if (permission === 'granted') {
      console.log('Notification permission already granted.');
    } else if (permission === 'denied') {
      console.warn('Notification permission denied. User must enable it in browser settings.');
      return null;
    } else {
      // Request permission if not yet determined
      const newPermission = await Notification.requestPermission();
      if (newPermission !== 'granted') {
        console.warn('Notification permission not granted:', newPermission);
        return null;
      }
      console.log('Notification permission granted.');
    }

    // Retrieve FCM token
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      console.error('VITE_FIREBASE_VAPID_KEY is not defined in environment variables.');
      return null;
    }

    const token = await getToken(messaging, { vapidKey });
    if (!token) {
      console.warn('No FCM token retrieved.');
      return null;
    }

    console.log('FCM Token:', token);
    // Send token to backend for admin notifications
    await registerTokenWithBackend(token);
    return token;
  } catch (error) {
    console.error('Error retrieving FCM token:', error);
    return null;
  }
}

// Register token with backend
async function registerTokenWithBackend(token: string): Promise<void> {
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  try {
    const response = await fetch(`${apiUrl}/api/notification/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, userType: 'admin' }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to register token: ${response.statusText}`);
    }
    console.log('Token registered with backend successfully');
  } catch (error) {
    console.error('Error registering token with backend:', error);
    throw error; // Re-throw to allow caller to handle
  }
}

// Handle foreground messages
export function onForegroundMessage(callback: (payload: any) => void) {
  onMessage(messaging, (payload) => {
    console.log('Foreground message received:', payload);
    callback(payload);
  });
}