import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { firestore, auth } from './firebase';
import { NavigationContainerRef } from '@react-navigation/native';

export interface NotificationData {
  type: 'new_member' | 'new_plan' | 'rsvp_nudge' | 'plan_reminder' | 'transit_match' | 'archive_prompt';
  circleId?: string;
  planId?: string;
  cardId?: string;
  memberName?: string;
  planTitle?: string;
  planDate?: string;
  routeId?: string;
}

export interface InAppNotification {
  id: string;
  icon: string;
  title: string;
  message: string;
  data: NotificationData;
}

// Callback for showing in-app notifications
let inAppNotificationCallback: ((notification: InAppNotification) => void) | null = null;

// Navigation reference for deep linking
let navigationRef: NavigationContainerRef<any> | null = null;

/**
 * Set the navigation reference for deep linking
 */
export const setNavigationRef = (ref: NavigationContainerRef<any>) => {
  navigationRef = ref;
};

/**
 * Set the callback for showing in-app notifications
 */
export const setInAppNotificationCallback = (
  callback: (notification: InAppNotification) => void
) => {
  inAppNotificationCallback = callback;
};

/**
 * Configure notification handlers
 * Call this once when the app loads
 */
export const configureNotificationHandlers = () => {
  // Set notification handler for when app is in foreground
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      // Show in-app banner instead of OS notification when in foreground
      const data = notification.request.content.data as NotificationData;
      if (inAppNotificationCallback) {
        const inAppNotif = createInAppNotification(
          notification.request.content.title || '',
          notification.request.content.body || '',
          data
        );
        inAppNotificationCallback(inAppNotif);
      }

      return {
        shouldShowAlert: false, // Don't show OS notification in foreground
        shouldPlaySound: true,
        shouldSetBadge: true,
      };
    },
  });

  // Handle notification when user taps on it (background/killed state)
  Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data as NotificationData;
    handleNotificationNavigation(data);
  });

  // Check if app was opened from a notification
  Notifications.getLastNotificationResponseAsync().then((response) => {
    if (response) {
      const data = response.notification.request.content.data as NotificationData;
      handleNotificationNavigation(data);
    }
  });
};

/**
 * Request notification permissions and register push token
 * Call this after user authentication
 */
export const setupPushNotifications = async (): Promise<boolean> => {
  try {
    if (!Device.isDevice) {
      console.log('Push notifications only work on physical devices');
      return false;
    }

    // Request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permission denied');
      return false;
    }

    // Get Expo Push Token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: 'your-expo-project-id', // Replace with your Expo project ID
    });
    const token = tokenData.data;

    // Save token to Firestore
    const currentUser = auth.currentUser;
    if (currentUser) {
      await savePushToken(currentUser.uid, token);
      console.log('Push token saved:', token);
    }

    // Configure notification channel for Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#1A6B5A',
      });
    }

    return true;
  } catch (error) {
    console.error('Error setting up push notifications:', error);
    return false;
  }
};

/**
 * Save push token to Firestore
 */
const savePushToken = async (uid: string, token: string): Promise<void> => {
  try {
    const tokenId = `${Platform.OS}_${Date.now()}`;
    const tokenRef = doc(firestore, 'users', uid, 'pushTokens', tokenId);

    await setDoc(tokenRef, {
      token,
      platform: Platform.OS,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error saving push token:', error);
    throw error;
  }
};

/**
 * Create in-app notification object from notification data
 */
const createInAppNotification = (
  title: string,
  message: string,
  data: NotificationData
): InAppNotification => {
  let icon = '🔔';

  switch (data.type) {
    case 'new_member':
      icon = '👋';
      break;
    case 'new_plan':
      icon = '📅';
      break;
    case 'rsvp_nudge':
      icon = '⏰';
      break;
    case 'plan_reminder':
      icon = '🔔';
      break;
    case 'transit_match':
      icon = '🚂';
      break;
    case 'archive_prompt':
      icon = '✈️';
      break;
  }

  return {
    id: `${Date.now()}_${Math.random()}`,
    icon,
    title,
    message,
    data,
  };
};

/**
 * Handle navigation based on notification type
 */
const handleNotificationNavigation = (data: NotificationData) => {
  if (!navigationRef) {
    console.warn('Navigation ref not set');
    return;
  }

  try {
    switch (data.type) {
      case 'new_member':
        if (data.circleId) {
          navigationRef.navigate('CircleScreen', { circleId: data.circleId });
        }
        break;

      case 'new_plan':
      case 'rsvp_nudge':
      case 'plan_reminder':
        if (data.circleId && data.planId) {
          navigationRef.navigate('PlanDetailScreen', {
            circleId: data.circleId,
            planId: data.planId,
          });
        }
        break;

      case 'transit_match':
        if (data.cardId) {
          // Navigate to FeedScreen and highlight the card
          navigationRef.navigate('FeedScreen', {
            highlightCardId: data.cardId,
          });
        }
        break;

      case 'archive_prompt':
        // This is handled by ArchivePromptHandler component
        // No navigation needed, modal will show automatically
        break;

      default:
        console.warn('Unknown notification type:', data.type);
    }
  } catch (error) {
    console.error('Error handling notification navigation:', error);
  }
};

/**
 * Send a local notification (for testing)
 */
export const sendLocalNotification = async (
  title: string,
  body: string,
  data: NotificationData
): Promise<void> => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data as any,
      sound: true,
    },
    trigger: null, // Send immediately
  });
};

/**
 * Cancel all scheduled notifications
 */
export const cancelAllNotifications = async (): Promise<void> => {
  await Notifications.cancelAllScheduledNotificationsAsync();
};

/**
 * Get notification badge count
 */
export const getBadgeCount = async (): Promise<number> => {
  return await Notifications.getBadgeCountAsync();
};

/**
 * Set notification badge count
 */
export const setBadgeCount = async (count: number): Promise<void> => {
  await Notifications.setBadgeCountAsync(count);
};

/**
 * Clear notification badge
 */
export const clearBadge = async (): Promise<void> => {
  await Notifications.setBadgeCountAsync(0);
};

/**
 * Remove push token from Firestore (call on logout)
 */
export const removePushToken = async (uid: string): Promise<void> => {
  try {
    // Get all tokens for this user
    const tokensRef = collection(firestore, 'users', uid, 'pushTokens');
    // Note: In production, you'd query and delete specific tokens
    // For now, we'll just log
    console.log('Push tokens should be removed on logout');
  } catch (error) {
    console.error('Error removing push token:', error);
  }
};

/**
 * Format notification message based on type
 */
export const formatNotificationMessage = (data: NotificationData): { title: string; body: string } => {
  switch (data.type) {
    case 'new_member':
      return {
        title: 'New Member',
        body: `${data.memberName} joined your circle`,
      };

    case 'new_plan':
      return {
        title: 'New Plan',
        body: `${data.memberName} created a plan — ${data.planTitle}`,
      };

    case 'rsvp_nudge':
      return {
        title: 'RSVP Reminder',
        body: `Don't forget to RSVP for ${data.planTitle}`,
      };

    case 'plan_reminder':
      return {
        title: 'Plan Tomorrow',
        body: `${data.planTitle} is tomorrow!`,
      };

    case 'transit_match':
      return {
        title: 'New Transit Circle',
        body: `A new circle was posted for ${data.routeId}`,
      };

    case 'archive_prompt':
      return {
        title: 'Journey Complete',
        body: 'Your circle has been archived',
      };

    default:
      return {
        title: 'Notification',
        body: 'You have a new notification',
      };
  }
};
