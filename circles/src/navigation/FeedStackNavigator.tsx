import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import FeedScreen from '../screens/main/FeedScreen';
import OpenCircleDetailScreen from '../screens/feed/OpenCircleDetailScreen';
import CreateOpenCircleScreen from '../screens/feed/CreateOpenCircleScreen';
import { Routes } from '../constants/routes';

const Stack = createNativeStackNavigator();

export default function FeedStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        animationEnabled: true,
      }}
    >
      <Stack.Screen
        name={Routes.FEED}
        component={FeedScreen}
        options={{ title: 'Discover', headerShown: false }}
      />
      <Stack.Screen
        name={Routes.OPEN_CIRCLE_DETAIL}
        component={OpenCircleDetailScreen}
        options={({ route }) => ({
          title: route.params?.circleName || 'Circle',
        })}
      />
      <Stack.Group screenOptions={{ presentation: 'modal' }}>
        <Stack.Screen
          name={Routes.CREATE_OPEN_CIRCLE}
          component={CreateOpenCircleScreen}
          options={{ title: 'Create Open Circle' }}
        />
      </Stack.Group>
    </Stack.Navigator>
  );
}
