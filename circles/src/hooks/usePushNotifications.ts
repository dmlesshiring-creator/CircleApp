import { useState, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { firestore, auth } from '../services/firebase';
import Constants from 'expo-constants';

/**
 * Configure notification behavior
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

interface PushNotificationState {
  expoPushToken?: string;
  notification?: Notifications.Notification;
  error?: Error;
}

/**
 * Hook for managing push notifications
 * 
 * Handles:
 * - Permission requests
 * - Token registration
 * - Notification listeners
 * - Badge management
 */
export const usePushNotifications = () => {
  const [state, setState] = useState<PushNotificationState>({});
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    registerForPushNotificationsAsync()
      .then((token) => {
        if (token) {
          setState((prev) => ({ ...prev, expoPushToken: token }));
          savePushTokenToFirestore(token);
        }
      })
      .catch((error) => {
        setState((prev) => ({ ...prev, error }));
        console.error('Error registering for push notifications:', error);
      });

    // Listener for notifications received while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        setState((prev) => ({ ...prev, notification }));
      }
    );

    // Listener for when user taps on notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        handleNotificationResponse(response);
      }
    );

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  return state;
};

/**
 * Register for push notifications and get Expo push token
 */
async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0066CC',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Failed to get push token for push notification!');
      return;
    }

    // Get Expo push token
    token = (
      await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      })
    ).data;

    console.log('Expo push token:', token);
  } else {
    console.warn('Must use physical device for Push Notifications');
  }

  return token;
}

/**
 * Save push token to Firestore user document
 */
async function savePushTokenToFirestore(token: string): Promise<void> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    await updateDoc(doc(firestore, `users/${currentUser.uid}`), {
      pushToken: token,
      pushTokenUpdatedAt: Date.now(),
    });

    console.log('Push token saved to Firestore');
  } catch (error) {
    console.error('Error saving push token:', error);
  }
}

/**
 * Handle notification tap
 */
function handleNotificationResponse(
  response: Notifications.NotificationResponse
): void {
  const data = response.notification.request.content.data;

  console.log('Notification tapped:', data);

  // Handle different notification types
  if (data.type === 'new_message') {
    // Navigate to circle chat
    // navigation.navigate('CircleChat', { circleId: data.circleId });
  } else if (data.type === 'plan_created') {
    // Navigate to plan detail
    // navigation.navigate('PlanDetail', { planId: data.planId });
  } else if (data.type === 'rsvp_reminder') {
    // Navigate to plan detail
    // navigation.navigate('PlanDetail', { planId: data.planId });
  } else if (data.type === 'member_joined') {
    // Navigate to circle
    // navigation.navigate('Circle', { circleId: data.circleId });
  }

  // Note: Navigation should be handled by the app's navigation context
  // This is just a placeholder for the logic
}

/**
 * Schedule a local notification
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: Record<string, any>,
  trigger?: Notifications.NotificationTriggerInput
): Promise<string> {
  return await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: 'notification.wav',
    },
    trigger: trigger || null, // null = immediate
  });
}

/**
 * Cancel a scheduled notification
 */
export async function cancelNotification(
  notificationId: string
): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Set app badge count
 */
export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}

/**
 * Get app badge count
 */
export async function getBadgeCount(): Promise<number> {
  return await Notifications.getBadgeCountAsync();
}

/**
 * Clear all notifications
 */
export async function clearAllNotifications(): Promise<void> {
  await Notifications.dismissAllNotificationsAsync();
}

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * Check if notification permissions are granted
 */
export async function hasNotificationPermissions(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}
