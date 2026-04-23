import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';

interface UpgradePromptSheetProps {
  visible: boolean;
  featureName: string;
  featureDescription: string;
  icon: string;
  onUpgrade: () => void;
  onDismiss: () => void;
}

/**
 * Upgrade Prompt Sheet
 * 
 * Reusable bottom sheet for prompting free users to upgrade
 */
export const UpgradePromptSheet: React.FC<UpgradePromptSheetProps> = ({
  visible,
  featureName,
  featureDescription,
  icon,
  onUpgrade,
  onDismiss,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onDismiss}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onDismiss}
      >
        <View style={styles.sheet}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>{icon}</Text>
          </View>

          {/* Feature Name */}
          <Text style={styles.featureName}>{featureName}</Text>

          {/* Description */}
          <Text style={styles.description}>{featureDescription}</Text>

          {/* Circles+ Badge */}
          <View style={styles.plusBadge}>
            <Text style={styles.plusBadgeText}>Circles+ Feature</Text>
          </View>

          {/* Upgrade Button */}
          <TouchableOpacity style={styles.upgradeButton} onPress={onUpgrade}>
            <Text style={styles.upgradeButtonText}>Upgrade to Circles+</Text>
          </TouchableOpacity>

          {/* Not Now Button */}
          <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
            <Text style={styles.dismissButtonText}>Not Now</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 32,
    paddingBottom: 40,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  icon: {
    fontSize: 40,
  },
  featureName: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.normal * Typography.fontSize.md,
    marginBottom: 24,
  },
  plusBadge: {
    backgroundColor: '#FFD700',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 24,
  },
  plusBadgeText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: '#000',
  },
  upgradeButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  upgradeButtonText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.surface,
  },
  dismissButton: {
    paddingVertical: 12,
  },
  dismissButtonText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
  },
});
