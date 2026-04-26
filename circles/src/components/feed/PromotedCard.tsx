import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { trackPromotedCardClick, trackPromotedCardImpression } from '../../services/analytics.service';

interface PromotedCardProps {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  ctaText: string;
  ctaUrl: string;
  sponsorName: string;
  onPress: () => void;
}

/**
 * Promoted Card Component
 * 
 * Displays sponsored content in the Open Feed
 * Tracks impressions and clicks for analytics
 */
export const PromotedCard: React.FC<PromotedCardProps> = ({
  id,
  title,
  description,
  imageUrl,
  ctaText,
  ctaUrl,
  sponsorName,
  onPress,
}) => {
  // Track impression when component mounts
  React.useEffect(() => {
    trackPromotedCardImpression(id);
  }, [id]);

  const handlePress = () => {
    trackPromotedCardClick(id, ctaUrl);
    onPress();
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      {/* Promoted badge */}
      <View style={styles.promotedBadge}>
        <Text style={styles.promotedText}>Promoted</Text>
      </View>

      {/* Image */}
      {imageUrl && (
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />
      )}

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        <Text style={styles.description} numberOfLines={3}>
          {description}
        </Text>

        {/* CTA Button */}
        <TouchableOpacity style={styles.ctaButton} onPress={handlePress}>
          <Text style={styles.ctaText}>{ctaText}</Text>
        </TouchableOpacity>

        {/* Sponsor info */}
        <Text style={styles.sponsor}>Sponsored by {sponsorName}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#FFD700', // Gold border for promoted content
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  promotedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 10,
  },
  promotedText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: '#000',
    textTransform: 'uppercase',
  },
  image: {
    width: '100%',
    height: 180,
    backgroundColor: Colors.surfaceAlt,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: 8,
    lineHeight: Typography.lineHeight.tight * Typography.fontSize.lg,
  },
  description: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    marginBottom: 16,
    lineHeight: Typography.lineHeight.normal * Typography.fontSize.md,
  },
  ctaButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 12,
  },
  ctaText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.surface,
  },
  sponsor: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
});
