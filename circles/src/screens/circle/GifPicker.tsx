import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  SafeAreaView,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { GIPHY_API_KEY } from '../../constants/config';

const CATEGORIES = ['Trending', 'Reactions', 'Greetings', 'Celebrate', 'Sad', 'Love'];

interface GifItem {
  id: string;
  url: string;
  title: string;
  width: number;
  height: number;
}

interface GifPickerProps {
  onSelect: (gifUrl: string) => void;
  onClose: () => void;
}

let cachedTrending: GifItem[] = [];
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * GifPicker - Bottom sheet GIF search and selection
 */
export default function GifPicker({ onSelect, onClose }: GifPickerProps) {
  const [gifs, setGifs] = useState<GifItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Trending');

  // Fetch GIFs from Giphy API
  const fetchGifs = useCallback(
    async (query: string = 'trending') => {
      try {
        setLoading(true);
        setError(null);

        // Check cache for trending
        if (query === 'trending' && cachedTrending.length > 0) {
          const now = Date.now();
          if (now - cacheTimestamp < CACHE_DURATION) {
            setGifs(cachedTrending);
            setLoading(false);
            return;
          }
        }

        const endpoint =
          query === 'trending'
            ? `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=20&rating=g`
            : `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(
                query
              )}&limit=20&rating=g`;

        const response = await fetch(endpoint);
        if (!response.ok) {
          throw new Error('Failed to fetch GIFs');
        }

        const data = await response.json();
        const gifList: GifItem[] = data.data.map((item: any) => ({
          id: item.id,
          url: item.images.fixed_height.url,
          originalUrl: item.images.original.url,
          title: item.title || 'GIF',
          width: parseInt(item.images.fixed_height.width),
          height: parseInt(item.images.fixed_height.height),
        }));

        setGifs(gifList);

        // Cache trending results
        if (query === 'trending') {
          cachedTrending = gifList;
          cacheTimestamp = Date.now();
        }
      } catch (err) {
        console.error('Giphy API error:', err);
        setError('Couldn\'t load GIFs. Check your connection.');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Load initial trending GIFs
  useEffect(() => {
    fetchGifs('trending');
  }, [fetchGifs]);

  // Handle search with debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSelectedCategory('Trending');
      fetchGifs('trending');
    } else {
      const timer = setTimeout(() => {
        fetchGifs(searchQuery);
      }, 400);

      return () => clearTimeout(timer);
    }
  }, [searchQuery, fetchGifs]);

  const handleCategoryPress = (category: string) => {
    setSelectedCategory(category);
    setSearchQuery('');
    const categoryQuery = category.toLowerCase();
    fetchGifs(categoryQuery === 'trending' ? 'trending' : categoryQuery);
  };

  const handleGifSelect = (gif: GifItem) => {
    onSelect(gif.url);
    onClose();
  };

  if (loading && gifs.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.surface }}>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.surface }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: Colors.border,
        }}
      >
        <Text
          style={{
            fontSize: Typography.fontSize.lg,
            fontWeight: Typography.fontWeight.semibold,
            color: Colors.textPrimary,
          }}
        >
          Search GIFs
        </Text>

        <TouchableOpacity onPress={onClose}>
          <Text style={{ fontSize: 24, color: Colors.textSecondary }}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: Colors.surfaceAlt,
            borderRadius: 20,
            paddingHorizontal: 12,
          }}
        >
          <Text style={{ fontSize: 18, marginRight: 8 }}>🔍</Text>
          <TextInput
            placeholder="Search GIFs..."
            placeholderTextColor={Colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={{
              flex: 1,
              fontSize: Typography.fontSize.md,
              color: Colors.textPrimary,
              paddingVertical: 10,
            }}
          />
        </View>
      </View>

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12, gap: 8 }}
      >
        {CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category}
            onPress={() => handleCategoryPress(category)}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 16,
              backgroundColor:
                selectedCategory === category ? Colors.primary : Colors.surfaceAlt,
            }}
          >
            <Text
              style={{
                fontSize: Typography.fontSize.sm,
                color:
                  selectedCategory === category ? Colors.surface : Colors.textPrimary,
                fontWeight:
                  selectedCategory === category
                    ? Typography.fontWeight.semibold
                    : Typography.fontWeight.regular,
              }}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Error State */}
      {error && (
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 20,
          }}
        >
          <Text
            style={{
              fontSize: Typography.fontSize.md,
              color: Colors.textSecondary,
              marginBottom: 16,
              textAlign: 'center',
            }}
          >
            {error}
          </Text>

          <TouchableOpacity
            onPress={() => fetchGifs(searchQuery || 'trending')}
            style={{
              paddingHorizontal: 24,
              paddingVertical: 10,
              backgroundColor: Colors.primary,
              borderRadius: 8,
            }}
          >
            <Text
              style={{
                color: Colors.surface,
                fontWeight: Typography.fontWeight.semibold,
              }}
            >
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Empty State */}
      {!loading && gifs.length === 0 && !error && (
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 20,
          }}
        >
          <Text
            style={{
              fontSize: Typography.fontSize.md,
              color: Colors.textSecondary,
              textAlign: 'center',
            }}
          >
            No GIFs found for '{searchQuery}'
          </Text>
        </View>
      )}

      {/* GIF Grid */}
      {gifs.length > 0 && (
        <FlatList
          data={gifs}
          numColumns={2}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleGifSelect(item)}
              style={{
                flex: 1,
                margin: 6,
                height: 180,
                borderRadius: 8,
                overflow: 'hidden',
                backgroundColor: Colors.surfaceAlt,
              }}
            >
              <Image
                source={{ uri: item.url }}
                style={{ flex: 1, width: '100%', height: '100%' }}
              />
            </TouchableOpacity>
          )}
          contentContainerStyle={{ padding: 4 }}
        />
      )}
    </SafeAreaView>
  );
}
