import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { RSVPStatus } from '../../types/plan.types';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';

interface RSVPButtonsProps {
  selectedStatus?: RSVPStatus;
  onSelect: (status: RSVPStatus) => void;
  disabled?: boolean;
}

/**
 * RSVPButtons - Three-button RSVP selector (Going/Maybe/Can't)
 */
export default function RSVPButtons({
  selectedStatus,
  onSelect,
  disabled = false,
}: RSVPButtonsProps) {
  const buttons: { status: RSVPStatus; label: string; emoji: string; color: string }[] = [
    { status: 'going', label: 'Going', emoji: '✓', color: Colors.success },
    { status: 'maybe', label: 'Maybe', emoji: '?', color: Colors.accent },
    { status: 'cantmake', label: "Can't", emoji: '✗', color: Colors.error },
  ];

  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {buttons.map(({ status, label, emoji, color }) => (
        <TouchableOpacity
          key={status}
          onPress={() => onSelect(status)}
          disabled={disabled}
          style={{
            flex: 1,
            paddingVertical: 12,
            paddingHorizontal: 8,
            borderRadius: 8,
            borderWidth: 2,
            borderColor: selectedStatus === status ? color : Colors.border,
            backgroundColor:
              selectedStatus === status
                ? color
                : 'transparent',
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Text
            style={{
              fontSize: Typography.fontSize.lg,
              fontWeight: Typography.fontWeight.semibold,
            }}
          >
            {emoji}
          </Text>

          <Text
            style={{
              fontSize: Typography.fontSize.sm,
              fontWeight: Typography.fontWeight.semibold,
              color:
                selectedStatus === status ? Colors.surface : Colors.textPrimary,
            }}
          >
            {label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
