import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Colors } from '../../constants/colors';
import type { CircleCategory } from '../../types/feed.types';

interface CategoryFilterProps {
  selectedCategory: CircleCategory | 'all';
  onSelectCategory: (category: CircleCategory | 'all') => void;
}

const CATEGORIES: Array<{ value: CircleCategory | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'travel', label: 'Travel & Transit' },
  { value: 'fitness', label: 'Fitness' },
  { value: 'music', label: 'Music & Arts' },
  { value: 'food', label: 'Food & Dining' },
  { value: 'hobby', label: 'Hobby' },
  { value: 'neighbourhood', label: 'Neighbourhood' },
  { value: 'professional', label: 'Professional' },
];

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {CATEGORIES.map((category) => {
        const isSelected = selectedCategory === category.value;
        return (
          <TouchableOpacity
            key={category.value}
            style={[styles.chip, isSelected && styles.chipSelected]}
            onPress={() => onSelectCategory(category.value)}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
              {category.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surfaceAlt,
    marginRight: 8,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  chipTextSelected: {
    color: Colors.surface,
  },
});
