import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { useOffline } from '../../hooks/useOffline';

const BANNER_HEIGHT = 32;

/**
 * Offline Banner Component
 * 
 * Shows a thin yellow banner at the top when offline
 * Automatically slides in/out based on connection state
 */
export const OfflineBanner: React.FC = () => {
  const { isOnline } = useOffline();
  const translateY = useRef(new Animated.Value(-BANNER_HEIGHT)).current;

  useEffect(() => {
    if (!isOnline) {
      // Slide down when offline
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      // Slide up when back online
      Animated.timing(translateY, {
        toValue: -BANNER_HEIGHT,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isOnline, translateY]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
        },
      ]}
    >
      <View style={styles.banner}>
        <Text style={styles.icon}>📡</Text>
        <Text style={styles.text}>You're offline — showing cached content</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    ...Platform.select({
      ios: {
        paddingTop: 44, // Status bar height on iOS
      },
      android: {
        paddingTop: 0,
      },
    }),
  },
  banner: {
    height: BANNER_HEIGHT,
    backgroundColor: '#FFC107', // Yellow
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  icon: {
    fontSize: 14,
    marginRight: 8,
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
  },
});
