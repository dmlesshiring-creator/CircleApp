import { create } from 'zustand';
import { OpenCircle } from '../types/circle.types';

/**
 * Feed Store - Manages Open Discovery feed state
 */
interface FeedStoreState {
  circles: OpenCircle[];
  promotedCards: any[];
  loading: boolean;
  error: string | null;
  selectedCategory: 'all' | 'transit' | 'interest' | 'neighborhood';
  searchQuery: string;

  // Setters
  setCircles: (circles: OpenCircle[]) => void;
  setPromotedCards: (cards: any[]) => void;
  addCircle: (circle: OpenCircle) => void;
  removeCircle: (circleId: string) => void;
  updateCircle: (circleId: string, updates: Partial<OpenCircle>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedCategory: (category: 'all' | 'transit' | 'interest' | 'neighborhood') => void;
  setSearchQuery: (query: string) => void;

  // Reset
  reset: () => void;

  // Getters
  getCircleById: (circleId: string) => OpenCircle | undefined;
  getFilteredCircles: () => OpenCircle[];
}

export const useFeedStore = create<FeedStoreState>((set, get) => ({
  circles: [],
  promotedCards: [],
  loading: false,
  error: null,
  selectedCategory: 'all',
  searchQuery: '',

  setCircles: (circles: OpenCircle[]) =>
    set({ circles, error: null }),

  setPromotedCards: (cards: any[]) =>
    set({ promotedCards: cards }),

  addCircle: (circle: OpenCircle) =>
    set((state) => ({
      circles: [circle, ...state.circles],
    })),

  removeCircle: (circleId: string) =>
    set((state) => ({
      circles: state.circles.filter((c) => c.id !== circleId),
    })),

  updateCircle: (circleId: string, updates: Partial<OpenCircle>) =>
    set((state) => ({
      circles: state.circles.map((c) =>
        c.id === circleId ? { ...c, ...updates } : c
      ),
    })),

  setLoading: (loading: boolean) =>
    set({ loading }),

  setError: (error: string | null) =>
    set({ error }),

  setSelectedCategory: (category: 'all' | 'transit' | 'interest' | 'neighborhood') =>
    set({ selectedCategory: category }),

  setSearchQuery: (query: string) =>
    set({ searchQuery: query }),

  reset: () =>
    set({
      circles: [],
      promotedCards: [],
      loading: false,
      error: null,
      selectedCategory: 'all',
      searchQuery: '',
    }),

  getCircleById: (circleId: string) =>
    get().circles.find((c) => c.id === circleId),

  getFilteredCircles: () => {
    const { circles, selectedCategory, searchQuery } = get();
    let filtered = circles;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((c) => c.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim().length > 0) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.description?.toLowerCase().includes(query) ||
          c.transitRoute?.toLowerCase().includes(query)
      );
    }

    return filtered;
  },
}));
