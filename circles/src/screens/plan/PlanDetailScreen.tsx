import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { firestore, auth } from '../../services/firebase';
import { Colors } from '../../constants/colors';
import { RSVPButtons } from '../../components/plan/RSVPButtons';
import type { Plan, RSVPStatus } from '../../types/plan.types';

type PlanStackParamList = {
  PlanDetailScreen: { circleId: string; planId: string };
};

type PlanDetailScreenRouteProp = RouteProp<
  PlanStackParamList,
  'PlanDetailScreen'
>;

const PLAN_TYPE_ICONS: Record<string, string> = {
  meal: '🍽',
  movie: '🎬',
  trip: '✈️',
  custom: '📌',
};

export const PlanDetailScreen: React.FC = () => {
  const route = useRoute<PlanDetailScreenRouteProp>();
  const { circleId, planId } = route.params;

  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);

  const currentUserUid = auth.currentUser?.uid || '';

  useEffect(() => {
    if (!circleId || !planId) return;

    const planRef = doc(firestore, 'circles', circleId, 'plans', planId);
    const unsubscribe = onSnapshot(
      planRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setPlan({ id: snapshot.id, ...snapshot.data() } as Plan);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching plan:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [circleId, planId]);

  const handleRSVPChange = async (status: RSVPStatus) => {
    if (!plan || !currentUserUid) return;

    try {
      const planRef = doc(firestore, 'circles', circleId, 'plans', planId);
      await updateDoc(planRef, {
        [`rsvps.${currentUserUid}`]: status,
      });
    } catch (error) {
      console.error('Error updating RSVP:', error);
      Alert.alert('Error', 'Failed to update RSVP. Please try again.');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    };
    return date.toLocaleDateString('en-IN', options);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!plan) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Plan not found</Text>
      </View>
    );
  }

  const currentUserStatus = plan.rsvps?.[currentUserUid];

  // Count RSVPs by status
  const rsvpCounts = Object.values(plan.rsvps || {}).reduce(
    (acc, status) => {
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    {} as Record<RSVPStatus, number>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.icon}>{PLAN_TYPE_ICONS[plan.type]}</Text>
          <Text style={styles.title}>{plan.title}</Text>
        </View>

        {/* Date & Time */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>When</Text>
          <Text style={styles.detailText}>📅 {formatDate(plan.date)}</Text>
          {plan.time && <Text style={styles.detailText}>🕐 {plan.time}</Text>}
        </View>

        {/* Location */}
        {plan.location && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Where</Text>
            <Text style={styles.detailText}>📍 {plan.location}</Text>
          </View>
        )}

        {/* Type-specific details */}
        {plan.type === 'meal' && plan.details.mealType && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Details</Text>
            <Text style={styles.detailText}>
              Meal Type: {plan.details.mealType.charAt(0).toUpperCase() + plan.details.mealType.slice(1)}
            </Text>
            {plan.details.headCount && (
              <Text style={styles.detailText}>
                Head Count: {plan.details.headCount} people
              </Text>
            )}
          </View>
        )}

        {plan.type === 'movie' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Details</Text>
            {plan.details.bookingUrl && (
              <Text style={styles.detailText}>🔗 {plan.details.bookingUrl}</Text>
            )}
          </View>
        )}

        {plan.type === 'trip' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Trip Details</Text>
            {plan.details.departureDate && (
              <Text style={styles.detailText}>
                🛫 Departure: {plan.details.departureDate}
              </Text>
            )}
            {plan.details.returnDate && (
              <Text style={styles.detailText}>
                🛬 Return: {plan.details.returnDate}
              </Text>
            )}
            {plan.details.budgetPerPerson && (
              <Text style={styles.detailText}>
                💰 Budget: ₹{plan.details.budgetPerPerson} per person
              </Text>
            )}
          </View>
        )}

        {/* Notes */}
        {plan.details.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notesText}>{plan.details.notes}</Text>
          </View>
        )}

        {/* RSVP Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Responses</Text>
          <View style={styles.rsvpSummary}>
            <View style={styles.rsvpCount}>
              <Text style={[styles.rsvpCountNumber, { color: Colors.going }]}>
                {rsvpCounts.going || 0}
              </Text>
              <Text style={styles.rsvpCountLabel}>Going</Text>
            </View>
            <View style={styles.rsvpCount}>
              <Text style={[styles.rsvpCountNumber, { color: Colors.maybe }]}>
                {rsvpCounts.maybe || 0}
              </Text>
              <Text style={styles.rsvpCountLabel}>Maybe</Text>
            </View>
            <View style={styles.rsvpCount}>
              <Text style={[styles.rsvpCountNumber, { color: Colors.cantmake }]}>
                {rsvpCounts.cantmake || 0}
              </Text>
              <Text style={styles.rsvpCountLabel}>Can't Make It</Text>
            </View>
          </View>
        </View>

        {/* Creator Info */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Created by {plan.creatorName}
          </Text>
        </View>
      </ScrollView>

      {/* RSVP Buttons - Fixed at bottom */}
      <View style={styles.rsvpContainer}>
        <Text style={styles.rsvpTitle}>Your Response</Text>
        <RSVPButtons
          currentStatus={currentUserStatus}
          onStatusChange={handleRSVPChange}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  errorText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  content: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  icon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  section: {
    padding: 16,
    backgroundColor: Colors.surface,
    marginTop: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  detailText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  notesText: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  rsvpSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
  },
  rsvpCount: {
    alignItems: 'center',
  },
  rsvpCountNumber: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  },
  rsvpCountLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  footer: {
    padding: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: Colors.textTertiary,
    fontStyle: 'italic',
  },
  rsvpContainer: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
    paddingBottom: 24,
  },
  rsvpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
});
