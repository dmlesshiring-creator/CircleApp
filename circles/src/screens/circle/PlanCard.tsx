import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Plan, PlanType } from '../../types/plan.types';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';

const PLAN_ICONS: Record<PlanType, string> = {
  meal: '🍽️',
  movie: '🎬',
  trip: '✈️',
  custom: '📌',
};

interface PlanCardProps {
  plan: Plan;
  onPress: () => void;
}

/**
 * PlanCard - Display plan with type, date, location, and RSVP summary
 */
export default function PlanCard({ plan, onPress }: PlanCardProps) {
  const planDate = new Date(plan.date);
  const today = new Date();
  const isToday =
    planDate.toDateString() === today.toDateString();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow =
    planDate.toDateString() === tomorrow.toDateString();

  let dateStr = planDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  if (isToday) dateStr = 'Today';
  else if (isTomorrow) dateStr = 'Tomorrow';

  // Count RSVPs
  const rsvpCounts = {
    going: Object.values(plan.rsvps).filter((s) => s === 'going').length,
    maybe: Object.values(plan.rsvps).filter((s) => s === 'maybe').length,
    cantmake: Object.values(plan.rsvps).filter((s) => s === 'cantmake').length,
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: Colors.surfaceAlt,
        borderRadius: 12,
        padding: 16,
        marginVertical: 4,
      }}
    >
      {/* Header: Icon and Title */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ fontSize: 24, marginRight: 8 }}>
          {PLAN_ICONS[plan.type] || '📌'}
        </Text>

        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: Typography.fontSize.md,
              fontWeight: Typography.fontWeight.semibold,
              color: Colors.textPrimary,
            }}
            numberOfLines={1}
          >
            {plan.title}
          </Text>

          <Text
            style={{
              fontSize: Typography.fontSize.sm,
              color: Colors.textTertiary,
              marginTop: 2,
            }}
          >
            {dateStr}
            {plan.time ? ` · ${plan.time}` : ''}
          </Text>
        </View>
      </View>

      {/* Location */}
      {plan.location && (
        <Text
          style={{
            fontSize: Typography.fontSize.sm,
            color: Colors.textSecondary,
            marginBottom: 8,
          }}
          numberOfLines={1}
        >
          📍 {plan.location}
        </Text>
      )}

      {/* RSVP Summary */}
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
        {rsvpCounts.going > 0 && (
          <Text
            style={{
              fontSize: Typography.fontSize.xs,
              color: Colors.success,
              fontWeight: Typography.fontWeight.semibold,
            }}
          >
            ✓ {rsvpCounts.going} Going
          </Text>
        )}

        {rsvpCounts.maybe > 0 && (
          <Text
            style={{
              fontSize: Typography.fontSize.xs,
              color: Colors.accent,
              fontWeight: Typography.fontWeight.semibold,
            }}
          >
            ? {rsvpCounts.maybe} Maybe
          </Text>
        )}

        {rsvpCounts.cantmake > 0 && (
          <Text
            style={{
              fontSize: Typography.fontSize.xs,
              color: Colors.error,
              fontWeight: Typography.fontWeight.semibold,
            }}
          >
            ✗ {rsvpCounts.cantmake} Can't
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}
