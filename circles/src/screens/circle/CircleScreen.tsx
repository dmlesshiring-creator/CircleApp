import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Routes } from '../../constants/routes';

/**
 * CircleScreen - Circle hub/dashboard
 * Shows quick access to all circle features
 */
export default function CircleScreen({ route, navigation }: any) {
  const { circleId, circleName } = route.params || {};

  const menuItems = [
    { title: 'Chat', icon: '💬', route: Routes.CIRCLE_CHAT, description: 'Send messages' },
    { title: 'Plans', icon: '📅', route: Routes.CIRCLE_PLANNER, description: 'Upcoming events' },
    { title: 'Memory Lane', icon: '📸', route: Routes.CIRCLE_MEMORY_LANE, description: 'Photos & memories' },
    { title: 'Expenses', icon: '💰', route: Routes.CIRCLE_EXPENSES, description: 'Split bills' },
    { title: 'Members', icon: '👥', route: Routes.CIRCLE_MEMBERS, description: 'View members' },
    { title: 'Settings', icon: '⚙️', route: Routes.CIRCLE_SETTINGS, description: 'Circle settings' },
  ];

  const handleMenuPress = (routeName: string) => {
    navigation.navigate(routeName, { circleId, circleName });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.circleName}>{circleName || 'Circle'}</Text>
        <Text style={styles.circleId}>ID: {circleId?.slice(0, 8)}...</Text>
      </View>

      <View style={styles.menuGrid}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={() => handleMenuPress(item.route)}
          >
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <Text style={styles.menuTitle}>{item.title}</Text>
            <Text style={styles.menuDescription}>{item.description}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => handleMenuPress(Routes.CIRCLE_CHAT)}
        >
          <Text style={styles.primaryButtonText}>Open Chat</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => handleMenuPress(Routes.CIRCLE_PLANNER)}
        >
          <Text style={styles.secondaryButtonText}>View Plans</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: 24,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    alignItems: 'center',
  },
  circleName: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.bold as any,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  circleId: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textTertiary,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
  },
  menuItem: {
    width: '50%',
    padding: 8,
  },
  menuIcon: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 12,
  },
  menuTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  menuDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  quickActions: {
    padding: 16,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.surface,
  },
  secondaryButton: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.primary,
  },
});
