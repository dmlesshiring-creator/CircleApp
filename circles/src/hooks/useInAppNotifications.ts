import { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  setInAppNotificationCallback,
  handleNotificationNavigation,
  type InAppNotification,
  type NotificationData,
} from '../services/notification.service';

/**
 * Hook to manage in-app notification banner
 * Use this in your root App component or RootNavigator
 */
export const useInAppNotifications = () => {
  const [currentNotification, setCurrentNotification] = useState<InAppNotification | null>(null);
  const navigation = useNavigation();

  useEffect(() => {
    // Set up the callback for showing in-app notifications
    setInAppNotificationCallback((notification) => {
      setCurrentNotification(notification);
    });

    return () => {
      setInAppNotificationCallback(() => {});
    };
  }, []);

  const handleNotificationPress = (notification: InAppNotification) => {
    // Handle navigation based on notification type
    const data = notification.data;

    try {
      switch (data.type) {
        case 'new_member':
          if (data.circleId) {
            navigation.navigate('CircleScreen' as never, { circleId: data.circleId } as never);
          }
          break;

        case 'new_plan':
        case 'rsvp_nudge':
        case 'plan_reminder':
          if (data.circleId && data.planId) {
            navigation.navigate('PlanDetailScreen' as never, {
              circleId: data.circleId,
              planId: data.planId,
            } as never);
          }
          break;

        case 'transit_match':
          if (data.cardId) {
            navigation.navigate('FeedScreen' as never, {
              highlightCardId: data.cardId,
            } as never);
          }
          break;

        case 'archive_prompt':
          // Handled by ArchivePromptHandler
          break;

        default:
          console.warn('Unknown notification type:', data.type);
      }
    } catch (error) {
      console.error('Error handling notification press:', error);
    }
  };

  const dismissNotification = () => {
    setCurrentNotification(null);
  };

  return {
    currentNotification,
    handleNotificationPress,
    dismissNotification,
  };
};
