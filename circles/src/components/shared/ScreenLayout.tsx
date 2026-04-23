import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { OfflineBanner } from './OfflineBanner';
import { Colors } from '../../constants/colors';

interface ScreenLayoutProps {
  children: React.ReactNode;
  style?: ViewStyle;
  showOfflineBanner?: boolean;
}

/**
 * Screen Layout Wrapper
 * 
 * Wraps screen content and adds offline banner
 * Use this as the root component for all main screens
 * 
 * Usage:
 * <ScreenLayout>
 *   <YourScreenContent />
 * </ScreenLayout>
 */
export const ScreenLayout: React.FC<ScreenLayoutProps> = ({
  children,
  style,
  showOfflineBanner = true,
}) => {
  return (
    <View style={[styles.container, style]}>
      {showOfflineBanner && <OfflineBanner />}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
