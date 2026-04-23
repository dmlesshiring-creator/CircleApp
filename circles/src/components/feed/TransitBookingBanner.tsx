import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { Colors } from '../../constants/colors';
import { buildIRCTCLink, buildMakeMyTripLink, trackAffiliateClick } from '../../services/transit.service';
import { auth } from '../../services/firebase';

interface TransitBookingBannerProps {
  transitMode: 'train' | 'flight';
  transitRoute: string;
  transitDate: string;
  circleId: string;
}

export const TransitBookingBanner: React.FC<TransitBookingBannerProps> = ({
  transitMode,
  transitRoute,
  transitDate,
  circleId,
}) => {
  const handleBookingPress = async () => {
    const currentUserUid = auth.currentUser?.uid || '';

    try {
      // Build appropriate affiliate link
      const url =
        transitMode === 'train'
          ? buildIRCTCLink(transitRoute, transitDate)
          : buildMakeMyTripLink(transitRoute, transitDate);

      // Track analytics
      await trackAffiliateClick(circleId, transitMode, transitRoute, transitDate, currentUserUid);

      // Open in in-app browser
      await WebBrowser.openBrowserAsync(url, {
        toolbarColor: Colors.primary,
        controlsColor: Colors.surface,
        showTitle: true,
        enableBarCollapsing: false,
      });
    } catch (error) {
      console.error('Error opening booking link:', error);
      Alert.alert('Error', 'Failed to open booking page. Please try again.');
    }
  };

  if (transitMode === 'train') {
    return (
      <View style={[styles.banner, styles.trainBanner]}>
        <View style={styles.bannerContent}>
          <Text style={styles.bannerIcon}>🚆</Text>
          <View style={styles.bannerText}>
            <Text style={styles.bannerTitle}>Book your train ticket</Text>
            <Text style={styles.bannerSubtitle}>Route pre-filled on IRCTC</Text>
          </View>
        </View>
        <TouchableOpacity style={[styles.bookButton, styles.trainButton]} onPress={handleBookingPress}>
          <Text style={styles.bookButtonText}>Book now →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Flight banner
  return (
    <View style={[styles.banner, styles.flightBanner]}>
      <View style={styles.bannerContent}>
        <Text style={styles.bannerIcon}>✈️</Text>
        <View style={styles.bannerText}>
          <Text style={styles.bannerTitle}>Find flights on MakeMyTrip</Text>
          <Text style={styles.bannerSubtitle}>
            {transitRoute} · {new Date(transitDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </Text>
        </View>
      </View>
      <TouchableOpacity style={[styles.bookButton, styles.flightButton]} onPress={handleBookingPress}>
        <Text style={styles.bookButtonText}>Search flights →</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  trainBanner: {
    backgroundColor: '#E0F7F4', // Light teal
  },
  flightBanner: {
    backgroundColor: '#E3F2FD', // Light blue
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  bannerIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  bannerText: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  bookButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
  },
  trainButton: {
    backgroundColor: '#00897B', // Teal
  },
  flightButton: {
    backgroundColor: '#1976D2', // Blue
  },
  bookButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.surface,
  },
});
