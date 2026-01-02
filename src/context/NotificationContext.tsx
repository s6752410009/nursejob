// ============================================
// NOTIFICATION CONTEXT - Push Notification Manager
// ============================================

import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import * as Notifications from 'expo-notifications';
import { useAuth } from './AuthContext';
import {
  registerForPushNotificationsAsync,
  savePushTokenToUser,
  addNotificationReceivedListener,
  addNotificationResponseListener,
  clearAllNotifications,
} from '../services/notificationService';

// ==========================================
// Types
// ==========================================
interface NotificationContextType {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  hasPermission: boolean;
  registerForNotifications: () => Promise<void>;
  clearNotifications: () => Promise<void>;
}

// ==========================================
// Context
// ==========================================
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// ==========================================
// Provider
// ==========================================
interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { user } = useAuth();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [hasPermission, setHasPermission] = useState(false);

  const notificationListener = useRef<ReturnType<typeof addNotificationReceivedListener>>();
  const responseListener = useRef<ReturnType<typeof addNotificationResponseListener>>();

  // Register for push notifications when user logs in
  useEffect(() => {
    if (user?.uid) {
      registerForNotifications();
    }
  }, [user?.uid]);

  // Set up notification listeners
  useEffect(() => {
    // Listen for incoming notifications
    notificationListener.current = addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification);
      setNotification(notification);
    });

    // Listen for notification interactions
    responseListener.current = addNotificationResponseListener((response) => {
      console.log('Notification response:', response);
      handleNotificationResponse(response);
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  // Handle notification tap/response
  const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data;
    
    // TODO: Navigate based on notification type
    // This will be handled by the navigation container
    console.log('Notification data:', data);
    
    // Examples:
    // if (data.type === 'message') { navigate to chat }
    // if (data.type === 'job') { navigate to job detail }
    // if (data.type === 'application') { navigate to applicants }
  };

  // Register for push notifications
  const registerForNotifications = async () => {
    try {
      const token = await registerForPushNotificationsAsync();
      
      if (token) {
        setExpoPushToken(token);
        setHasPermission(true);

        // Save token to user profile in Firebase
        if (user?.uid) {
          await savePushTokenToUser(user.uid, token);
        }
      } else {
        setHasPermission(false);
      }
    } catch (error) {
      console.error('Error registering for notifications:', error);
      setHasPermission(false);
    }
  };

  // Clear all notifications
  const handleClearNotifications = async () => {
    await clearAllNotifications();
    setNotification(null);
  };

  const value: NotificationContextType = {
    expoPushToken,
    notification,
    hasPermission,
    registerForNotifications,
    clearNotifications: handleClearNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

// ==========================================
// Hook
// ==========================================
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
