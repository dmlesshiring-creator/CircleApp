import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { doc, getDoc } from 'firebase/firestore';
import { firestore, auth } from '../services/firebase';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { hasCirclesPlus } from '../services/subscription.service';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface YearRecap {
  year: number;
  plansAttended: number;
  circlesJoined: number;
  mostActiveCircle: { id: string; name: string; messageCount: number } | null;
  photosUploaded: number;
  totalExpenses: number;
  uniqueCoMembers: number;
  mostUsedEmoji: string | null;
}

interface YearInCirclesScreenProps {
  route: {
    params: {
      year?: number;
    };
  };
  navigation: any;
}

/**
 * Animated Card Component
 */
const RecapCard: React.FC<{
  children: React.ReactNode;
  gradient: string[];
}> = ({ children, gradient }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.card,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardGradient}
      >
        {children}
      </LinearGradient>
    </Animated.View>
  );
};

/**
 * Counting Animation Component
 */
const CountingNumber: React.FC<{ value: number }> = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let current = 0;
    const increment = Math.ceil(value / 30);
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(current);
      }
    }, 50);

    return () => clearInterval(timer);
  }, [value]);

  return <Text style={styles.bigNumber}>{displayValue}</Text>;
};

/**
 * Year in Circles Screen
 */
export default function YearInCirclesScreen({
  route,
  navigation,
}: YearInCirclesScreenProps) {
  const year = route.params?.year || new Date().getFullYear();
  const currentUid = auth.currentUser?.uid;

  const [recap, setRecap] = useState<YearRecap | null>(null);
  const [currentCard, setCurrentCard] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPlus, setIsPlus] = useState(false);

  const viewShotRef = useRef<ViewShot>(null);

  useEffect(() => {
    loadRecap();
  }, [year, currentUid]);

  const loadRecap = async () => {
    if (!currentUid) return;

    try {
      // Check subscription status
      const plusStatus = await hasCirclesPlus();
      setIsPlus(plusStatus);

      if (!plusStatus) {
        setLoading(false);
        return;
      }

      // Load recap data
      const recapDoc = await getDoc(
        doc(firestore, `users/${currentUid}/yearRecap/${year}`)
      );

      if (recapDoc.exists()) {
        setRecap(recapDoc.data() as YearRecap);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading recap:', error);
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      if (!viewShotRef.current) return;

      // Capture current card as image
      const uri = await viewShotRef.current.capture();

      // Share
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: 'Share your Year in Circles',
      });
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Error', 'Failed to share');
    }
  };

  const handleNext = () => {
    if (currentCard < 6) {
      setCurrentCard(currentCard + 1);
    }
  };

  const handlePrevious = () => {
    if (currentCard > 0) {
      setCurrentCard(currentCard - 1);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading your year...</Text>
      </View>
    );
  }

  // Show teaser for free users
  if (!isPlus) {
    return (
      <View style={styles.container}>
        <RecapCard gradient={['#1E3A8A', '#3B82F6', '#000000']}>
          <View style={styles.cardContent}>
            <Text style={styles.teaserTitle}>Your Year in Circles</Text>
            <Text style={styles.teaserYear}>{year}</Text>
            
            <View style={styles.teaserBlur}>
              <Text style={styles.teaserText}>
                Unlock your personalized year recap
              </Text>
            </View>

            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={() => navigation.navigate('SubscriptionScreen')}
            >
              <Text style={styles.upgradeButtonText}>Upgrade to Circles+</Text>
            </TouchableOpacity>
          </View>
        </RecapCard>
      </View>
    );
  }

  if (!recap) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          Your {year} recap is not ready yet
        </Text>
      </View>
    );
  }

  const userName = auth.currentUser?.displayName || 'Your';

  return (
    <View style={styles.container}>
      <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 0.9 }}>
        {/* Card 1: Title */}
        {currentCard === 0 && (
          <RecapCard gradient={['#1E3A8A', '#3B82F6', '#000000']}>
            <View style={styles.cardContent}>
              <View style={styles.circleAnimation}>
                <View style={[styles.circle, styles.circle1]} />
                <View style={[styles.circle, styles.circle2]} />
                <View style={[styles.circle, styles.circle3]} />
              </View>
              <Text style={styles.titleText}>{userName}'s</Text>
              <Text style={styles.titleText}>Year in Circles</Text>
              <Text style={styles.yearText}>{year}</Text>
            </View>
          </RecapCard>
        )}

        {/* Card 2: Plans */}
        {currentCard === 1 && (
          <RecapCard gradient={['#7C3AED', '#A78BFA', '#000000']}>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>You made</Text>
              <CountingNumber value={recap.plansAttended} />
              <Text style={styles.cardSubtitle}>plans happen</Text>
            </View>
          </RecapCard>
        )}

        {/* Card 3: Most Active Circle */}
        {currentCard === 2 && (
          <RecapCard gradient={['#DC2626', '#F87171', '#000000']}>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Your most active circle</Text>
              <Text style={styles.circleName}>
                {recap.mostActiveCircle?.name || 'N/A'}
              </Text>
              {recap.mostActiveCircle && (
                <Text style={styles.cardSubtitle}>
                  {recap.mostActiveCircle.messageCount} messages sent
                </Text>
              )}
            </View>
          </RecapCard>
        )}

        {/* Card 4: Photos */}
        {currentCard === 3 && (
          <RecapCard gradient={['#059669', '#34D399', '#000000']}>
            <View style={styles.cardContent}>
              <CountingNumber value={recap.photosUploaded} />
              <Text style={styles.cardSubtitle}>memories captured</Text>
              <View style={styles.photoMosaic}>
                {/* Placeholder for photo mosaic */}
                <View style={styles.photoPlaceholder} />
                <View style={styles.photoPlaceholder} />
                <View style={styles.photoPlaceholder} />
                <View style={styles.photoPlaceholder} />
              </View>
            </View>
          </RecapCard>
        )}

        {/* Card 5: Expenses */}
        {currentCard === 4 && (
          <RecapCard gradient={['#EA580C', '#FB923C', '#000000']}>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>You split</Text>
              <Text style={styles.rupeeSymbol}>₹</Text>
              <CountingNumber value={recap.totalExpenses} />
              <Text style={styles.cardSubtitle}>with friends</Text>
            </View>
          </RecapCard>
        )}

        {/* Card 6: Connections */}
        {currentCard === 5 && (
          <RecapCard gradient={['#0891B2', '#22D3EE', '#000000']}>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>You connected with</Text>
              <CountingNumber value={recap.uniqueCoMembers} />
              <Text style={styles.cardSubtitle}>people</Text>
              {recap.mostUsedEmoji && (
                <View style={styles.emojiContainer}>
                  <Text style={styles.mostUsedEmoji}>{recap.mostUsedEmoji}</Text>
                  <Text style={styles.emojiLabel}>Your favorite reaction</Text>
                </View>
              )}
            </View>
          </RecapCard>
        )}

        {/* Card 7: Share */}
        {currentCard === 6 && (
          <RecapCard gradient={['#4F46E5', '#818CF8', '#000000']}>
            <View style={styles.cardContent}>
              <Text style={styles.shareTitle}>Share your year</Text>
              <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                <Text style={styles.shareButtonText}>Share to Stories</Text>
              </TouchableOpacity>
              <Text style={styles.shareCaption}>
                My year on Circles 🔵 circles.app
              </Text>
            </View>
          </RecapCard>
        )}
      </ViewShot>

      {/* Navigation */}
      <View style={styles.navigation}>
        {currentCard > 0 && (
          <TouchableOpacity style={styles.navButton} onPress={handlePrevious}>
            <Text style={styles.navButtonText}>‹</Text>
          </TouchableOpacity>
        )}

        <View style={styles.dots}>
          {[0, 1, 2, 3, 4, 5, 6].map((index) => (
            <View
              key={index}
              style={[
                styles.dot,
                currentCard === index && styles.dotActive,
              ]}
            />
          ))}
        </View>

        {currentCard < 6 && (
          <TouchableOpacity style={styles.navButton} onPress={handleNext}>
            <Text style={styles.navButtonText}>›</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Close button */}
      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.closeButtonText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    fontSize: Typography.fontSize.lg,
    color: '#FFF',
  },
  errorText: {
    fontSize: Typography.fontSize.lg,
    color: '#FFF',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  card: {
    width: SCREEN_WIDTH * 0.9,
    height: SCREEN_HEIGHT * 0.7,
    borderRadius: 24,
    overflow: 'hidden',
  },
  cardGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  cardContent: {
    alignItems: 'center',
  },
  circleAnimation: {
    position: 'relative',
    width: 150,
    height: 150,
    marginBottom: 40,
  },
  circle: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    opacity: 0.3,
  },
  circle1: {
    backgroundColor: '#3B82F6',
    top: 0,
    left: 0,
  },
  circle2: {
    backgroundColor: '#8B5CF6',
    top: 20,
    left: 40,
  },
  circle3: {
    backgroundColor: '#EC4899',
    top: 40,
    left: 20,
  },
  titleText: {
    fontSize: 48,
    fontWeight: Typography.fontWeight.bold,
    color: '#FFF',
    textAlign: 'center',
  },
  yearText: {
    fontSize: 72,
    fontWeight: Typography.fontWeight.bold,
    color: '#FFF',
    marginTop: 20,
  },
  cardTitle: {
    fontSize: Typography.fontSize.xl,
    color: '#FFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  bigNumber: {
    fontSize: 96,
    fontWeight: Typography.fontWeight.bold,
    color: '#FFF',
  },
  cardSubtitle: {
    fontSize: Typography.fontSize.lg,
    color: '#FFF',
    opacity: 0.9,
    marginTop: 10,
    textAlign: 'center',
  },
  circleName: {
    fontSize: 36,
    fontWeight: Typography.fontWeight.bold,
    color: '#FFF',
    textAlign: 'center',
    marginVertical: 20,
  },
  photoMosaic: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 30,
  },
  photoPlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
  },
  rupeeSymbol: {
    fontSize: 48,
    color: '#FFF',
    marginBottom: -20,
  },
  emojiContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  mostUsedEmoji: {
    fontSize: 64,
    marginBottom: 10,
  },
  emojiLabel: {
    fontSize: Typography.fontSize.md,
    color: '#FFF',
    opacity: 0.8,
  },
  shareTitle: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.bold,
    color: '#FFF',
    marginBottom: 40,
  },
  shareButton: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginBottom: 20,
  },
  shareButtonText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: '#4F46E5',
  },
  shareCaption: {
    fontSize: Typography.fontSize.md,
    color: '#FFF',
    opacity: 0.7,
  },
  navigation: {
    position: 'absolute',
    bottom: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  navButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonText: {
    fontSize: 32,
    color: '#FFF',
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dotActive: {
    backgroundColor: '#FFF',
    width: 24,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: '#FFF',
  },
  teaserTitle: {
    fontSize: 36,
    fontWeight: Typography.fontWeight.bold,
    color: '#FFF',
    textAlign: 'center',
  },
  teaserYear: {
    fontSize: 64,
    fontWeight: Typography.fontWeight.bold,
    color: '#FFF',
    marginVertical: 20,
  },
  teaserBlur: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 24,
    marginVertical: 40,
  },
  teaserText: {
    fontSize: Typography.fontSize.lg,
    color: '#FFF',
    textAlign: 'center',
  },
  upgradeButton: {
    backgroundColor: '#FFD700',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  upgradeButtonText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: '#000',
  },
});
