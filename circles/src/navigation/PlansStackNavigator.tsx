import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text } from 'react-native';
import { Routes } from '../constants/routes';

const Stack = createNativeStackNavigator();

// Placeholder Plans Home Screen
function PlansHomeScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Plans Coming Soon</Text>
    </View>
  );
}

export default function PlansStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        animationEnabled: true,
      }}
    >
      <Stack.Screen
        name={Routes.PLANS_HOME}
        component={PlansHomeScreen}
        options={{ title: 'Upcoming Plans' }}
      />
    </Stack.Navigator>
  );
}
