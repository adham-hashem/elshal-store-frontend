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
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('Notification permission granted.');
      const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      });
      console.log('FCM Token:', token);
      // Send token to backend for admin notifications
      await registerTokenWithBackend(token);
      return token;
    } else {
      console.log('Notification permission denied.');
      return null;
    }
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
      body: JSON.stringify({ token, userType: 'admin' }), // Indicate this is for admin
    });
    if (!response.ok) {
      throw new Error(`Failed to register token: ${response.statusText}`);
    }
    console.log('Token registered with backend successfully');
  } catch (error) {
    console.error('Error registering token with backend:', error);
  }
}

// Handle foreground messages
export function onForegroundMessage(callback: (payload: any) => void) {
  onMessage(messaging, (payload) => {
    console.log('Foreground message received:', payload);
    callback(payload);
  });
}