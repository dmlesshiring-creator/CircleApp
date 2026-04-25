import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from '../screens/auth/SplashScreen';
import GoogleSignInScreen from '../screens/auth/GoogleSignInScreen';
import DisplayNameScreen from '../screens/auth/DisplayNameScreen';
import AvatarScreen from '../screens/auth/AvatarScreen';
import BioScreen from '../screens/auth/BioScreen';
import IntentScreen from '../screens/auth/IntentScreen';
import { Routes } from '../constants/routes';

const Stack = createNativeStackNavigator();

export default function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animationEnabled: true,
        cardStyle: { backgroundColor: '#fff' },
        transitionSpec: {
          open: {
            animation: 'timing',
            config: { duration: 300 },
          },
          close: {
            animation: 'timing',
            config: { duration: 300 },
          },
        },
      }}
    >
      <Stack.Screen
        name={Routes.SPLASH}
        component={SplashScreen}
        options={{ animationEnabled: false }}
      />
      <Stack.Screen
        name="GoogleSignIn"
        component={GoogleSignInScreen}
      />
      <Stack.Screen
        name={Routes.DISPLAY_NAME}
        component={DisplayNameScreen}
      />
      <Stack.Screen
        name={Routes.AVATAR}
        component={AvatarScreen}
      />
      <Stack.Screen
        name={Routes.BIO}
        component={BioScreen}
      />
      <Stack.Screen
        name={Routes.INTENT}
        component={IntentScreen}
      />
    </Stack.Navigator>
  );
}
