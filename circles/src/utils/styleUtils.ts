import { Platform, ViewStyle } from 'react-native';

/**
 * Platform-appropriate shadow styles
 * iOS uses shadowColor/shadowOffset/shadowOpacity/shadowRadius
 * Android uses elevation
 */
export function shadow(
  depth: 'small' | 'medium' | 'large' = 'medium'
): ViewStyle {
  const shadowConfigs = {
    small: {
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
      },
      android: 2,
    },
    medium: {
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
      },
      android: 4,
    },
    large: {
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.16,
        shadowRadius: 12,
      },
      android: 8,
    },
  };

  const config = shadowConfigs[depth];

  if (Platform.OS === 'ios') {
    return {
      shadowColor: config.ios.shadowColor,
      shadowOffset: config.ios.shadowOffset,
      shadowOpacity: config.ios.shadowOpacity,
      shadowRadius: config.ios.shadowRadius,
    };
  } else {
    return {
      elevation: config.android,
    };
  }
}

/**
 * Helper to combine shadow with custom styles
 */
export function withShadow(
  style: ViewStyle,
  depth: 'small' | 'medium' | 'large' = 'medium'
): ViewStyle {
  return {
    ...style,
    ...shadow(depth),
  };
}
