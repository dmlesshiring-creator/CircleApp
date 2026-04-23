import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';
import AuthNavigator from './AuthNavigator';
import MainTabNavigator from './MainTabNavigator';
import { ActivityIndicator, View, Text } from 'react-native';

export default function RootNavigator() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    console.log('RootNavigator: Setting up auth listener');
    
    // Add a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      console.warn('RootNavigator: Auth timeout - proceeding without user');
      setIsLoading(false);
      setUser(null); // Default to no user
    }, 3000); // 3 second timeout
    
    try {
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        console.log('RootNavigator: Auth state changed', currentUser);
        setUser(currentUser);
        setIsLoading(false);
        clearTimeout(timeout);
      }, (error) => {
        console.error('RootNavigator: Auth error', error);
        setIsLoading(false);
        clearTimeout(timeout);
      });

      return () => {
        clearTimeout(timeout);
        unsubscribe();
      };
    } catch (error) {
      console.error('RootNavigator: Setup error', error);
      setIsLoading(false);
      clearTimeout(timeout);
      return () => clearTimeout(timeout);
    }
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' }}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 16, color: '#333', fontSize: 14 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <MainTabNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
