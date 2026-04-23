import { create } from 'zustand';
import { PrivateCircle } from '../types/circle.types';

/**
 * Circles Store - Manages user's private circles
 * Holds real-time circle data fetched from Firestore
 */
interface CirclesStoreState {
  circles: PrivateCircle[];
  loading: boolean;
  error: string | null;

  // Setters
  setCircles: (circles: PrivateCircle[]) => void;
  addCircle: (circle: PrivateCircle) => void;
  removeCircle: (circleId: string) => void;
  updateCircle: (circleId: string, updates: Partial<PrivateCircle>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Reset
  reset: () => void;

  // Getters
  getCircleById: (circleId: string) => PrivateCircle | undefined;
  getUnreadCount: (circleId: string) => number;
}

export const useCirclesStore = create<CirclesStoreState>((set, get) => ({
  circles: [],
  loading: false,
  error: null,

  setCircles: (circles: PrivateCircle[]) =>
    set({ circles, error: null }),

  addCircle: (circle: PrivateCircle) =>
    set((state) => ({
      circles: [circle, ...state.circles],
    })),

  removeCircle: (circleId: string) =>
    set((state) => ({
      circles: state.circles.filter((c) => c.id !== circleId),
    })),

  updateCircle: (circleId: string, updates: Partial<PrivateCircle>) =>
    set((state) => ({
      circles: state.circles.map((c) =>
        c.id === circleId ? { ...c, ...updates } : c
      ),
    })),

  setLoading: (loading: boolean) =>
    set({ loading }),

  setError: (error: string | null) =>
    set({ error }),

  reset: () =>
    set({
      circles: [],
      loading: false,
      error: null,
    }),

  getCircleById: (circleId: string) =>
    get().circles.find((c) => c.id === circleId),

  getUnreadCount: (circleId: string) => {
    // TODO: Implement when unread message count is added to PrivateCircle
    return 0;
  },
}));
