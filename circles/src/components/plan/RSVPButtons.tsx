import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import type { RSVPStatus } from '../../types/plan.types';

interface RSVPButtonsProps {
  currentStatus?: RSVPStatus;
  onStatusChange: (status: RSVPStatus) => void;
}

export const RSVPButtons: React.FC<RSVPButtonsProps> = ({
  currentStatus,
  onStatusChange,
}) => {
  const buttons: Array<{
    status: RSVPStatus;
    label: string;
    color: string;
    icon: string;
  }> = [
    { status: 'going', label: 'Going', color: Colors.going, icon: '✓' },
    { status: 'maybe', label: 'Maybe', color: Colors.maybe, icon: '?' },
    { status: 'cantmake', label: "Can't make it", color: Colors.cantmake, icon: '✗' },
  ];

  return (
    <View style={styles.container}>
      {buttons.map((button) => {
        const isSelected = currentStatus === button.status;
        return (
          <TouchableOpacity
            key={button.status}
            style={[
              styles.button,
              {
                backgroundColor: isSelected ? button.color : Colors.surface,
                borderColor: button.color,
              },
            ]}
            onPress={() => onStatusChange(button.status)}
            activeOpacity={0.7}
          >
            {isSelected && <Text style={styles.checkmark}>{button.icon}</Text>}
            <Text
              style={[
                styles.buttonText,
                { color: isSelected ? Colors.surface : button.color },
              ]}
            >
              {button.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    gap: 6,
  },
  checkmark: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.surface,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
