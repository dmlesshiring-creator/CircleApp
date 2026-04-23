import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import type { Plan, RSVPStatus } from '../../types/plan.types';

interface PlanCardProps {
  plan: Plan;
  currentUserUid: string;
  onPress: () => void;
}

const PLAN_TYPE_ICONS: Record<string, string> = {
  meal: '🍽',
  movie: '🎬',
  trip: '✈️',
  custom: '📌',
};

export const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  currentUserUid,
  onPress,
}) => {
  // Count RSVPs
  const rsvpCounts = Object.values(plan.rsvps || {}).reduce(
    (acc, status) => {
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    {} as Record<RSVPStatus, number>
  );

  const goingCount = rsvpCounts.going || 0;
  const maybeCount = rsvpCounts.maybe || 0;
  const cantmakeCount = rsvpCounts.cantmake || 0;

  // Get current user's RSVP status
  const userStatus = plan.rsvps?.[currentUserUid];

  // Format date and time
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    };
    return date.toLocaleDateString('en-IN', options);
  };

  // Get border color based on user's RSVP status
  const getBorderColor = () => {
    if (!userStatus) return Colors.border;
    switch (userStatus) {
      case 'going':
        return Colors.going;
      case 'maybe':
        return Colors.maybe;
      case 'cantmake':
        return Colors.cantmake;
      default:
        return Colors.border;
    }
  };

  return (
    <TouchableOpacity
      style={[styles.card, { borderColor: getBorderColor() }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={styles.icon}>{PLAN_TYPE_ICONS[plan.type]}</Text>
        <View style={styles.headerText}>
          <Text style={styles.title} numberOfLines={1}>
            {plan.title}
          </Text>
          <Text style={styles.dateTime}>
            {formatDate(plan.date)}
            {plan.time && ` • ${plan.time}`}
          </Text>
        </View>
      </View>

      {plan.location && (
        <Text style={styles.location} numberOfLines={1}>
          📍 {plan.location}
        </Text>
      )}

      <View style={styles.rsvpSummary}>
        {goingCount > 0 && (
          <View style={styles.rsvpItem}>
            <Text style={[styles.rsvpIcon, { color: Colors.going }]}>✓</Text>
            <Text style={styles.rsvpText}>{goingCount} Going</Text>
          </View>
        )}
        {maybeCount > 0 && (
          <View style={styles.rsvpItem}>
            <Text style={[styles.rsvpIcon, { color: Colors.maybe }]}>?</Text>
            <Text style={styles.rsvpText}>{maybeCount} Maybe</Text>
          </View>
        )}
        {cantmakeCount > 0 && (
          <View style={styles.rsvpItem}>
            <Text style={[styles.rsvpIcon, { color: Colors.cantmake }]}>✗</Text>
            <Text style={styles.rsvpText}>{cantmakeCount} Can't</Text>
          </View>
        )}
        {goingCount === 0 && maybeCount === 0 && cantmakeCount === 0 && (
          <Text style={styles.noRsvp}>No responses yet</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    fontSize: 32,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  dateTime: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  location: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  rsvpSummary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  rsvpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rsvpIcon: {
    fontSize: 14,
    fontWeight: '700',
  },
  rsvpText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  noRsvp: {
    fontSize: 14,
    color: Colors.textTertiary,
    fontStyle: 'italic',
  },
});
