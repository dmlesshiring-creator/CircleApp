import React, { useEffect } from 'react';
import { View, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { doc, getDoc } from 'firebase/firestore';
import { auth, firestore } from '../../services/firebase';
import { Colors } from '../../constants/colors';
import { Routes } from '../../constants/routes';

/**
 * CirclesLogo SVG Component
 * Three overlapping circles in a Venn diagram arrangement
 * Each circle: 40px radius, white, overlapping by ~15px
 */
const CirclesLogo = ({ animatedScale, animatedOpacity }: any) => {
  const circleRadius = 40;

  return (
    <Animated.View
      style={{
        transform: [{ scale: animatedScale }],
        opacity: animatedOpacity,
      }}
    >
      <Svg width="120" height="120" viewBox="0 0 120 120">
        {/* Left circle */}
        <Circle cx="35" cy="60" r={circleRadius} fill={Colors.surface} />
        {/* Right circle */}
        <Circle cx="85" cy="60" r={circleRadius} fill={Colors.surface} />
        {/* Top circle */}
        <Circle cx="60" cy="35" r={circleRadius} fill={Colors.surface} />
      </Svg>
    </Animated.View>
  );
};

/**
 * SplashScreen
 *
 * Initial screen shown on app launch
 * - Displays animated Circles logo (scale + fade in over 600ms)
 * - After 1.5s, checks Firebase Auth state
 * - Routes user based on auth status and Firestore profile
 *
 * Navigation logic:
 * 1. Not authenticated → PhoneEntry (start auth flow)
 * 2. Authenticated but no Firestore doc → DisplayName (complete profile)
 * 3. Authenticated with Firestore doc → RootNavigator auto-switches to MainTabNavigator
 */
export default function SplashScreen({ navigation }: any) {
  const animatedScale = React.useRef(new Animated.Value(0.8)).current;
  const animatedOpacity = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate logo in: scale (0.8 → 1.0) + fade (0 → 1)
    Animated.parallel([
      Animated.timing(animatedScale, {
        toValue: 1.0,
        duration: 600,
        useNativeDriver: false,
      }),
      Animated.timing(animatedOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // After 1.5 seconds, check auth state and navigate
    const timer = setTimeout(() => {
      checkAuthAndNavigate();
    }, 1500);

    return () => clearTimeout(timer);
  }, [navigation]);

  /**
   * Check Firebase Auth state and Firestore user doc
   * Routes based on auth + profile completion status
   */
  const checkAuthAndNavigate = async () => {
    try {
      const currentUser = auth.currentUser;

      if (!currentUser) {
        // User not authenticated → start email sign in flow
        navigation.replace('GoogleSignIn');
        return;
      }

      // User is authenticated, check if Firestore profile doc exists
      const userDocRef = doc(firestore, 'users', currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        // User doc exists = profile complete
        // RootNavigator will auto-switch to MainTabNavigator
        // (no navigation needed here, just wait)
      } else {
        // User authenticated but profile incomplete
        // Route to display name screen to continue onboarding
        navigation.replace(Routes.DISPLAY_NAME);
      }
    } catch (error) {
      console.error('Error checking auth state in splash:', error);
      // On error, fallback to email sign in
      navigation.replace('GoogleSignIn');
    }
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <CirclesLogo animatedScale={animatedScale} animatedOpacity={animatedOpacity} />
    </View>
  );
}
