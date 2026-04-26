import { useState, useEffect } from 'react';
import { getOpenCircles, getPromotedCards } from '../services/feed.service';
import { OpenCircle } from '../types/circle.types';

interface FeedFilters {
  category?: 'transit' | 'interest' | 'neighborhood';
  searchQuery?: string;
  location?: { latitude: number; longitude: number };
  maxDistance?: number;
}

/**
 * Hook for fetching Open Discovery feed
 */
export const useFeed = (filters?: FeedFilters) => {
  const [circles, setCircles] = useState<OpenCircle[]>([]);
  const [promotedCards, setPromotedCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFeed = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Fetch circles and promoted cards in parallel
      const [circlesResult, cardsResult] = await Promise.all([
        getOpenCircles(filters),
        getPromotedCards(),
      ]);

      if (circlesResult.success && circlesResult.circles) {
        setCircles(circlesResult.circles);
      }

      if (cardsResult.success && cardsResult.cards) {
        setPromotedCards(cardsResult.cards);
      }

      setLoading(false);
      setRefreshing(false);
    } catch (err: any) {
      setError(err);
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, [filters?.category, filters?.searchQuery]);

  const refresh = () => {
    fetchFeed(true);
  };

  return {
    circles,
    promotedCards,
    loading,
    error,
    refreshing,
    refresh,
  };
};

/**
 * Hook for searching Open Circles
 */
export const useSearchFeed = (searchQuery: string) => {
  const [results, setResults] = useState<OpenCircle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setResults([]);
      return;
    }

    const searchFeed = async () => {
      try {
        setLoading(true);

        const result = await getOpenCircles({ searchQuery });

        if (result.success && result.circles) {
          setResults(result.circles);
        }

        setLoading(false);
      } catch (err: any) {
        setError(err);
        setLoading(false);
      }
    };

    // Debounce search
    const timeoutId = setTimeout(searchFeed, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  return { results, loading, error };
};

/**
 * Hook for filtering feed by category
 */
export const useFeedByCategory = (category: 'transit' | 'interest' | 'neighborhood') => {
  return useFeed({ category });
};

/**
 * Hook for filtering feed by location
 */
export const useFeedByLocation = (
  location: { latitude: number; longitude: number },
  maxDistance: number = 10
) => {
  return useFeed({ location, maxDistance });
};
