/**
 * INTEGRATION EXAMPLE
 * 
 * This file shows how to integrate the notification system into your app.
 * Copy the relevant parts into your actual App.tsx or RootNavigator.tsx
 */

import React, { useRef } from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { NotificationProvider } from './src/components/shared/NotificationProvider';

// Import your screens
import { FeedScreen } from './src/screens/main/FeedScreen';
import { CircleScreen } from './src/screens/circle/CircleScreen';
import { PlanDetailScreen } from './src/screens/plan/PlanDetailScreen';
// ... other screens

const Stack = createStackNavigator();

export default function App() {
  const navigationRef = useRef<NavigationContainerRef<any>>(null);

  return (
    <NavigationContainer ref={navigationRef}>
      {/* 
        NotificationProvider must be inside NavigationContainer
        It handles:
        - Push notification setup
        - In-app notification banner
        - Archive prompt modal
        - Navigation from notifications
      */}
      <NotificationProvider />

      {/* Your navigation stack */}
      <Stack.Navigator>
        <Stack.Screen name="FeedScreen" component={FeedScreen} />
        <Stack.Screen name="CircleScreen" component={CircleScreen} />
        <Stack.Screen name="PlanDetailScreen" component={PlanDetailScreen} />
        {/* ... other screens */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

/**
 * ALTERNATIVE: If you have a more complex navigation structure
 */

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const Tab = createBottomTabNavigator();

export function AppWithTabs() {
  const navigationRef = useRef<NavigationContainerRef<any>>(null);

  return (
    <NavigationContainer ref={navigationRef}>
      <NotificationProvider />

      <Tab.Navigator>
        <Tab.Screen name="Feed" component={FeedScreen} />
        <Tab.Screen name="Circles" component={CirclesScreen} />
        <Tab.Screen name="Plans" component={PlansScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

/**
 * TESTING: Send a test notification
 */

import { sendLocalNotification } from './src/services/notification.service';

export async function testNotification() {
  // Test new member notification
  await sendLocalNotification(
    'New Member',
    'John Doe joined your circle',
    {
      type: 'new_member',
      circleId: 'test-circle-123',
      memberName: 'John Doe',
    }
  );

  // Test new plan notification
  await sendLocalNotification(
    'New Plan',
    'Jane created a plan — Weekend Hike',
    {
      type: 'new_plan',
      circleId: 'test-circle-123',
      planId: 'test-plan-456',
      planTitle: 'Weekend Hike',
      planDate: '2026-05-01',
    }
  );

  // Test RSVP nudge
  await sendLocalNotification(
    'RSVP Reminder',
    "Don't forget to RSVP for Movie Night",
    {
      type: 'rsvp_nudge',
      circleId: 'test-circle-123',
      planId: 'test-plan-789',
      planTitle: 'Movie Night',
    }
  );

  // Test plan reminder
  await sendLocalNotification(
    'Plan Tomorrow',
    'Dinner at Italian Restaurant is tomorrow!',
    {
      type: 'plan_reminder',
      circleId: 'test-circle-123',
      planId: 'test-plan-101',
      planTitle: 'Dinner at Italian Restaurant',
    }
  );

  // Test transit match
  await sendLocalNotification(
    'New Transit Circle',
    'A new circle was posted for 12163 Chennai Express',
    {
      type: 'transit_match',
      cardId: 'test-card-202',
      routeId: '12163',
    }
  );
}

/**
 * DEBUGGING: Check notification setup
 */

import { 
  setupPushNotifications,
  getBadgeCount,
  clearBadge,
} from './src/services/notification.service';
import * as Notifications from 'expo-notifications';

export async function debugNotifications() {
  console.log('=== Notification Debug Info ===');

  // Check permissions
  const { status } = await Notifications.getPermissionsAsync();
  console.log('Permission status:', status);

  // Check if device supports push
  const { isDevice } = await import('expo-device');
  console.log('Is physical device:', isDevice);

  // Try to set up push notifications
  const success = await setupPushNotifications();
  console.log('Setup successful:', success);

  // Get push token
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: 'your-expo-project-id',
    });
    console.log('Push token:', tokenData.data);
  } catch (error) {
    console.error('Error getting push token:', error);
  }

  // Check badge count
  const badgeCount = await getBadgeCount();
  console.log('Current badge count:', badgeCount);

  // Clear badge
  await clearBadge();
  console.log('Badge cleared');

  console.log('=== End Debug Info ===');
}

/**
 * CLEANUP: Remove push token on logout
 */

import { removePushToken } from './src/services/notification.service';
import { auth } from './src/services/firebase';

export async function handleLogout() {
  const currentUser = auth.currentUser;
  
  if (currentUser) {
    // Remove push token
    await removePushToken(currentUser.uid);
    
    // Clear badge
    await clearBadge();
    
    // Sign out
    await auth.signOut();
  }
}

/**
 * CLOUD FUNCTION: Test from mobile app
 */

import { getFunctions, httpsCallable } from 'firebase/functions';

export async function testCloudFunctionNotification() {
  const functions = getFunctions();
  const sendTest = httpsCallable(functions, 'sendTestNotification');

  try {
    const result = await sendTest({
      title: 'Test from App',
      body: 'This is a test notification sent from the mobile app',
      notificationType: 'new_member',
    });

    console.log('Test notification sent:', result.data);
  } catch (error) {
    console.error('Error sending test notification:', error);
  }
}
