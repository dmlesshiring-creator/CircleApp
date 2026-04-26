import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PlansHomeScreen from '../screens/plan/PlansHomeScreen';
import PlanDetailScreen from '../screens/plan/PlanDetailScreen';
import { Routes } from '../constants/routes';

const Stack = createNativeStackNavigator();

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
      <Stack.Screen
        name={Routes.PLAN_DETAIL}
        component={PlanDetailScreen}
        options={({ route }) => ({
          title: route.params?.planTitle || 'Plan Details',
        })}
      />
    </Stack.Navigator>
  );
}
