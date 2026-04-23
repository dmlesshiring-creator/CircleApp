import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View } from 'react-native';
import FeedStackNavigator from './FeedStackNavigator';
import CircleStackNavigator from './CircleStackNavigator';
import PlansStackNavigator from './PlansStackNavigator';
import ProfileScreen from '../screens/main/ProfileScreen';
import { Routes } from '../constants/routes';

// Icon components (placeholder - use MaterialCommunityIcons or similar in real implementation)
const FeedIcon = ({ color }) => (
  <View
    style={{
      width: 24,
      height: 24,
      backgroundColor: color,
      borderRadius: 4,
    }}
  />
);

const CirclesIcon = ({ color }) => (
  <View
    style={{
      width: 24,
      height: 24,
      borderWidth: 2,
      borderColor: color,
      borderRadius: 4,
    }}
  />
);

const PlansIcon = ({ color }) => (
  <View
    style={{
      width: 20,
      height: 20,
      borderWidth: 2,
      borderColor: color,
      borderRadius: 2,
    }}
  />
);

const ProfileIcon = ({ color }) => (
  <View
    style={{
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: color,
    }}
  />
);

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#f0f0f0',
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarActiveTintColor: '#0066CC', // Primary colour
        tabBarInactiveTintColor: '#999',
        tabBarLabelStyle: {
          fontSize: 11,
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen
        name={Routes.FEED_TAB}
        component={FeedStackNavigator}
        options={{
          title: 'Discover',
          tabBarIcon: ({ color }) => <FeedIcon color={color} />,
        }}
      />

      <Tab.Screen
        name={Routes.CIRCLES_TAB}
        component={CircleStackNavigator}
        options={{
          title: 'Circles',
          tabBarIcon: ({ color }) => <CirclesIcon color={color} />,
          tabBarBadge: null, // Will be set by Zustand store in real implementation
        }}
      />

      <Tab.Screen
        name={Routes.PLANS_TAB}
        component={PlansStackNavigator}
        options={{
          title: 'Plans',
          tabBarIcon: ({ color }) => <PlansIcon color={color} />,
        }}
      />

      <Tab.Screen
        name={Routes.PROFILE_TAB}
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <ProfileIcon color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}
