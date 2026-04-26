import React, { useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useUserCircles } from '../../hooks/useCircle';
import { useUpcomingPlans } from '../../hooks/usePlanner';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { PlanCard } from '../../components/plan/PlanCard';
import { EmptyState } from '../../components/shared/EmptyState';
import { LoadingSpinner } from '../../components/shared/LoadingSpinner';

interface PlansHomeScreenProps {
  navigation: any;
}

/**
 * Plans Home Screen
 * 
 * Shows all upcoming plans across all circles
 */
export default function PlansHomeScreen({ navigation }: PlansHomeScreenProps) {
  const { circles, loading: circlesLoading } = useUserCircles();
  const circleIds = circles.map((c) => c.id);
  const { plans, loading: plansLoading, error } = useUpcomingPlans(circleIds);

  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    // The hook will automatically refresh
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handlePlanPress = (planId: string, circleId: string, planTitle: string) => {
    navigation.navigate('PlanDetail', {
      planId,
      circleId,
      planTitle,
    });
  };

  if (circlesLoading || plansLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="⚠️"
          title="Error Loading Plans"
          message="Failed to load your plans. Please try again."
        />
      </View>
    );
  }

  if (plans.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="📅"
          title="No Upcoming Plans"
          message="Create a plan in any of your circles to get started!"
        />
      </View>
    );
  }

  // Group plans by date
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const todaysPlans = plans.filter((plan) => {
    const planDate = new Date(plan.date);
    return planDate >= today && planDate < tomorrow;
  });

  const tomorrowsPlans = plans.filter((plan) => {
    const planDate = new Date(plan.date);
    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
    return planDate >= tomorrow && planDate < dayAfterTomorrow;
  });

  const thisWeeksPlans = plans.filter((plan) => {
    const planDate = new Date(plan.date);
    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
    return planDate >= dayAfterTomorrow && planDate < nextWeek;
  });

  const laterPlans = plans.filter((plan) => {
    const planDate = new Date(plan.date);
    return planDate >= nextWeek;
  });

  const sections = [
    { title: 'Today', data: todaysPlans },
    { title: 'Tomorrow', data: tomorrowsPlans },
    { title: 'This Week', data: thisWeeksPlans },
    { title: 'Later', data: laterPlans },
  ].filter((section) => section.data.length > 0);

  return (
    <View style={styles.container}>
      <FlatList
        data={sections}
        keyExtractor={(item) => item.title}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        renderItem={({ item: section }) => (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.data.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                onPress={() => handlePlanPress(plan.id, plan.circleId, plan.title)}
              />
            ))}
          </View>
        )}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Upcoming Plans</Text>
            <Text style={styles.headerSubtitle}>
              {plans.length} {plans.length === 1 ? 'plan' : 'plans'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.surfaceAlt,
  },
});
