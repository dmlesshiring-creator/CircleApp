import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, firestore } from '../services/firebase';

interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  bio?: string;
  subscription?: 'free' | 'plus';
  onboardingCompleted?: boolean;
  createdAt?: any;
}

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook for authentication state
 * 
 * Provides current user and profile data
 */
export const useAuth = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    // Listen to auth state changes
    const unsubscribeAuth = onAuthStateChanged(
      auth,
      (user) => {
        setState((prev) => ({
          ...prev,
          user,
          loading: !user, // Keep loading if user exists (waiting for profile)
        }));

        if (!user) {
          setState((prev) => ({
            ...prev,
            profile: null,
            loading: false,
          }));
        }
      },
      (error) => {
        setState((prev) => ({
          ...prev,
          error,
          loading: false,
        }));
      }
    );

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!state.user) return;

    // Listen to profile changes
    const unsubscribeProfile = onSnapshot(
      doc(firestore, `users/${state.user.uid}`),
      (snapshot) => {
        if (snapshot.exists()) {
          setState((prev) => ({
            ...prev,
            profile: snapshot.data() as UserProfile,
            loading: false,
          }));
        } else {
          setState((prev) => ({
            ...prev,
            profile: null,
            loading: false,
          }));
        }
      },
      (error) => {
        setState((prev) => ({
          ...prev,
          error,
          loading: false,
        }));
      }
    );

    return () => unsubscribeProfile();
  }, [state.user]);

  return state;
};

/**
 * Check if user is authenticated
 */
export const useIsAuthenticated = (): boolean => {
  const { user, loading } = useAuth();
  return !loading && user !== null;
};

/**
 * Check if user has completed onboarding
 */
export const useHasCompletedOnboarding = (): boolean => {
  const { profile, loading } = useAuth();
  return !loading && profile?.onboardingCompleted === true;
};

/**
 * Check if user has Circles+ subscription
 */
export const useHasCirclesPlus = (): boolean => {
  const { profile, loading } = useAuth();
  return !loading && profile?.subscription === 'plus';
};
