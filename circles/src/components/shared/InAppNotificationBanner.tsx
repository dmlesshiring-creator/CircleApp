import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  PanResponder,
  Platform,
} from 'react-native';
import { Colors } from '../../constants/colors';
import type { InAppNotification } from '../../services/notification.service';

interface InAppNotificationBannerProps {
  notification: InAppNotification | null;
  onDismiss: () => void;
  onPress: (notification: InAppNotification) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_HEIGHT = 100;
const AUTO_DISMISS_DURATION = 4000; // 4 seconds

export const InAppNotificationBanner: React.FC<InAppNotificationBannerProps> = ({
  notification,
  onDismiss,
  onPress,
}) => {
  const translateY = useRef(new Animated.Value(-BANNER_HEIGHT)).current;
  const dismissTimer = useRef<NodeJS.Timeout | null>(null);

  // Pan responder for swipe up gesture
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to vertical swipes
        return Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      },
      onPanResponderMove: (_, gestureState) => {
        // Only allow upward swipes
        if (gestureState.dy < 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        // If swiped up more than 50px, dismiss
        if (gestureState.dy < -50) {
          dismissBanner();
        } else {
          // Otherwise, snap back to visible position
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 65,
            friction: 11,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (notification) {
      showBanner();
    } else {
      hideBanner();
    }

    return () => {
      if (dismissTimer.current) {
        clearTimeout(dismissTimer.current);
      }
    };
  }, [notification]);

  const showBanner = () => {
    // Clear any existing timer
    if (dismissTimer.current) {
      clearTimeout(dismissTimer.current);
    }

    // Slide down animation
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();

    // Auto-dismiss after 4 seconds
    dismissTimer.current = setTimeout(() => {
      dismissBanner();
    }, AUTO_DISMISS_DURATION);
  };

  const hideBanner = () => {
    Animated.timing(translateY, {
      toValue: -BANNER_HEIGHT,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const dismissBanner = () => {
    if (dismissTimer.current) {
      clearTimeout(dismissTimer.current);
    }

    Animated.timing(translateY, {
      toValue: -BANNER_HEIGHT,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onDismiss();
    });
  };

  const handlePress = () => {
    if (notification) {
      dismissBanner();
      // Small delay to allow animation to complete before navigation
      setTimeout(() => {
        onPress(notification);
      }, 100);
    }
  };

  if (!notification) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
        },
      ]}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity
        style={styles.banner}
        onPress={handlePress}
        activeOpacity={0.9}
      >
        <View style={styles.content}>
          <Text style={styles.icon}>{notification.icon}</Text>
          <View style={styles.textContainer}>
            <Text style={styles.title} numberOfLines={1}>
              {notification.title}
            </Text>
            <Text style={styles.message} numberOfLines={2}>
              {notification.message}
            </Text>
          </View>
        </View>

        {/* Swipe indicator */}
        <View style={styles.swipeIndicator}>
          <View style={styles.swipeBar} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    ...Platform.select({
      ios: {
        paddingTop: 50, // Account for notch/status bar
      },
      android: {
        paddingTop: 40,
      },
    }),
  },
  banner: {
    backgroundColor: Colors.surface,
    marginHorizontal: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  icon: {
    fontSize: 32,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  swipeIndicator: {
    alignItems: 'center',
    paddingBottom: 8,
  },
  swipeBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
  },
});
