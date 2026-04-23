import { create } from 'zustand';

/**
 * Auth Store - Temporary user data during onboarding
 * State is cleared after user completes onboarding and Firestore doc is created
 */
interface AuthStoreState {
  displayName: string;
  avatarUrl: string;
  bio: string;

  // Setters
  setDisplayName: (displayName: string) => void;
  setAvatarUrl: (avatarUrl: string) => void;
  setBio: (bio: string) => void;

  // Clear (called after Firestore doc is created)
  reset: () => void;
}

export const useAuthStore = create<AuthStoreState>((set) => ({
  displayName: '',
  avatarUrl: '',
  bio: '',

  setDisplayName: (displayName: string) =>
    set({ displayName }),

  setAvatarUrl: (avatarUrl: string) =>
    set({ avatarUrl }),

  setBio: (bio: string) =>
    set({ bio }),

  reset: () =>
    set({
      displayName: '',
      avatarUrl: '',
      bio: '',
    }),
}));
