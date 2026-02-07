// ============================================
// NOTIFICATION SERVICE - Push Notifications
// ============================================

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ==========================================
// Register for Push Notifications
// ==========================================
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

  // Skip on web - push notifications not fully supported
  if (Platform.OS === 'web') {
    console.log('Push notifications not supported on web');
    return null;
  }

  // Check if physical device (required for push notifications)
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  // Check and request permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission not granted');
    return null;
  }

  try {
    // Get Expo push token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: 'nursejob-th', // Firebase/Expo project ID (NurseGo)
    });
    token = tokenData.data;
    console.log('Push token:', token);
  } catch (error) {
    console.error('Error getting push token:', error);
    return null;
  }

  // Configure Android channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF6B6B',
    });

    // Create separate channels for different notification types
    await Notifications.setNotificationChannelAsync('messages', {
      name: 'ข้อความ',
      description: 'การแจ้งเตือนข้อความใหม่',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4ECDC4',
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('jobs', {
      name: 'งานใหม่',
      description: 'การแจ้งเตือนเมื่อมีงานใหม่',
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: '#FF6B6B',
    });

    await Notifications.setNotificationChannelAsync('applications', {
      name: 'ผู้สมัครงาน',
      description: 'การแจ้งเตือนเมื่อมีผู้สนใจงาน',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#45B7D1',
    });
  }

  return token;
}

// ==========================================
// Save Push Token to User Profile
// ==========================================
export async function savePushTokenToUser(userId: string, token: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      pushToken: token,
      pushTokenUpdatedAt: new Date(),
    });
    console.log('Push token saved to user profile');
  } catch (error) {
    console.error('Error saving push token:', error);
  }
}

// ==========================================
// Local Notifications (for testing)
// ==========================================
export async function sendLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>,
  channelId: string = 'default'
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: 'default',
    },
    trigger: null, // null = immediate
  });
}

// ==========================================
// Send New Message Notification
// ==========================================
export async function sendMessageNotification(
  senderName: string,
  messagePreview: string,
  conversationId: string
): Promise<void> {
  await sendLocalNotification(
    `ข้อความจาก ${senderName}`,
    messagePreview,
    { type: 'message', conversationId },
    'messages'
  );
}

// ==========================================
// Send New Job Notification
// ==========================================
export async function sendNewJobNotification(
  jobTitle: string,
  location: string,
  jobId: string
): Promise<void> {
  await sendLocalNotification(
    'งานใหม่',
    `${jobTitle} - ${location}`,
    { type: 'job', jobId },
    'jobs'
  );
}

// ==========================================
// Send Application Notification (for job posters)
// ==========================================
export async function sendApplicationNotification(
  applicantName: string,
  jobTitle: string,
  applicationId: string
): Promise<void> {
  await sendLocalNotification(
    'มีผู้สนใจงาน',
    `${applicantName} สนใจงาน "${jobTitle}"`,
    { type: 'application', applicationId },
    'applications'
  );
}

// ==========================================
// Notification Listeners
// ==========================================
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
) {
  return Notifications.addNotificationReceivedListener(callback);
}

export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
) {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

// ==========================================
// Get Badge Count
// ==========================================
export async function getBadgeCount(): Promise<number> {
  return await Notifications.getBadgeCountAsync();
}

export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}

// ==========================================
// Clear All Notifications
// ==========================================
export async function clearAllNotifications(): Promise<void> {
  await Notifications.dismissAllNotificationsAsync();
  await setBadgeCount(0);
}
