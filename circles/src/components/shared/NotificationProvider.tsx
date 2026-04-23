import React, { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  configureNotificationHandlers,
  setupPushNotifications,
  setNavigationRef,
} from '../../services/notification.service';
import { InAppNotificationBanner } from './InAppNotificationBanner';
import { ArchivePromptHandler } from './ArchivePromptHandler';
import { useInAppNotifications } from '../../hooks/useInAppNotifications';
import { auth } from '../../services/firebase';

/**
 * NotificationProvider component
 * 
 * Place this component at the root of your navigation tree.
 * It handles:
 * - Push notification setup
 * - In-app notification banner
 * - Archive prompt modal
 * - Navigation from notifications
 * 
 * Usage in App.tsx or RootNavigator.tsx:
 * 
 * <NavigationContainer ref={navigationRef}>
 *   <NotificationProvider />
 *   <YourNavigationStack />
 * </NavigationContainer>
 */
export const NotificationProvider: React.FC = () => {
  const navigation = useNavigation();
  const {
    currentNotification,
    handleNotificationPress,
    dismissNotification,
  } = useInAppNotifications();

  useEffect(() => {
    // Configure notification handlers on mount
    configureNotificationHandlers();

    // Set navigation reference for deep linking
    setNavigationRef(navigation as any);

    // Set up push notifications when user is authenticated
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setupPushNotifications().then((success) => {
          if (success) {
            console.log('Push notifications set up successfully');
          } else {
            console.log('Failed to set up push notifications');
          }
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [navigation]);

  return (
    <>
      {/* In-app notification banner */}
      <InAppNotificationBanner
        notification={currentNotification}
        onDismiss={dismissNotification}
        onPress={handleNotificationPress}
      />

      {/* Archive prompt modal */}
      <ArchivePromptHandler />
    </>
  );
};
