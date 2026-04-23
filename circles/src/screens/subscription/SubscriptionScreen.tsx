import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PurchasesPackage } from 'react-native-purchases';
import {
  getAvailablePackages,
  purchaseSubscription,
  restorePurchases,
  getFormattedPrice,
  getMonthlyPriceForAnnual,
  getSavingsPercentage,
} from '../../services/subscription.service';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';

interface SubscriptionScreenProps {
  navigation: any;
}

type PlanType = 'monthly' | 'annual';

/**
 * Feature Row Component
 */
const FeatureRow: React.FC<{
  feature: string;
  free: string | boolean;
  plus: string | boolean;
}> = ({ feature, free, plus }) => {
  const renderValue = (value: string | boolean) => {
    if (typeof value === 'boolean') {
      return value ? '✓' : '✗';
    }
    return value;
  };

  return (
    <View style={styles.featureRow}>
      <Text style={styles.featureLabel}>{feature}</Text>
      <Text style={styles.featureFree}>{renderValue(free)}</Text>
      <Text style={styles.featurePlus}>{renderValue(plus)}</Text>
    </View>
  );
};

/**
 * Subscription Screen
 */
export default function SubscriptionScreen({ navigation }: SubscriptionScreenProps) {
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('annual');
  const [monthlyPackage, setMonthlyPackage] = useState<PurchasesPackage | null>(null);
  const [annualPackage, setAnnualPackage] = useState<PurchasesPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      const { monthly, annual } = await getAvailablePackages();
      setMonthlyPackage(monthly);
      setAnnualPackage(annual);
    } catch (error) {
      console.error('Error loading packages:', error);
      Alert.alert('Error', 'Failed to load subscription options');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    const packageToPurchase = selectedPlan === 'monthly' ? monthlyPackage : annualPackage;

    if (!packageToPurchase) {
      Alert.alert('Error', 'Subscription package not available');
      return;
    }

    setPurchasing(true);

    try {
      const result = await purchaseSubscription(packageToPurchase);

      if (result.success) {
        Alert.alert(
          'Success!',
          'Welcome to Circles+! Your subscription is now active.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else if (result.error !== 'Purchase cancelled') {
        Alert.alert('Error', result.error || 'Purchase failed');
      }
    } catch (error) {
      console.error('Error purchasing:', error);
      Alert.alert('Error', 'Failed to complete purchase');
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    try {
      const result = await restorePurchases();

      if (result.success) {
        if (result.restored) {
          Alert.alert(
            'Success',
            'Your subscription has been restored!',
            [
              {
                text: 'OK',
                onPress: () => navigation.goBack(),
              },
            ]
          );
        } else {
          Alert.alert('No Purchases Found', 'No previous purchases to restore');
        }
      } else {
        Alert.alert('Error', result.error || 'Failed to restore purchases');
      }
    } catch (error) {
      console.error('Error restoring:', error);
      Alert.alert('Error', 'Failed to restore purchases');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const savings = monthlyPackage && annualPackage
    ? getSavingsPercentage(monthlyPackage, annualPackage)
    : 33;

  const monthlyPriceForAnnual = annualPackage
    ? getMonthlyPriceForAnnual(annualPackage)
    : '₹67';

  return (
    <LinearGradient
      colors={['#0D7377', '#14FFEC', '#000000']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.content}>
        {/* Logo */}
        <View style={styles.header}>
          <Text style={styles.logo}>Circles+</Text>
          <Text style={styles.tagline}>Unlock the full experience</Text>
        </View>

        {/* Plan Toggle */}
        <View style={styles.planToggle}>
          <TouchableOpacity
            style={[
              styles.planButton,
              selectedPlan === 'monthly' && styles.planButtonActive,
            ]}
            onPress={() => setSelectedPlan('monthly')}
          >
            <Text
              style={[
                styles.planButtonText,
                selectedPlan === 'monthly' && styles.planButtonTextActive,
              ]}
            >
              Monthly
            </Text>
            <Text
              style={[
                styles.planPrice,
                selectedPlan === 'monthly' && styles.planPriceActive,
              ]}
            >
              {monthlyPackage ? getFormattedPrice(monthlyPackage) : '₹99'}/month
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.planButton,
              selectedPlan === 'annual' && styles.planButtonActive,
            ]}
            onPress={() => setSelectedPlan('annual')}
          >
            <View style={styles.bestValueBadge}>
              <Text style={styles.bestValueText}>Best Value</Text>
            </View>
            <Text
              style={[
                styles.planButtonText,
                selectedPlan === 'annual' && styles.planButtonTextActive,
              ]}
            >
              Annual
            </Text>
            <Text
              style={[
                styles.planPrice,
                selectedPlan === 'annual' && styles.planPriceActive,
              ]}
            >
              {annualPackage ? getFormattedPrice(annualPackage) : '₹799'}/year
            </Text>
            <Text style={styles.savingsText}>
              {monthlyPriceForAnnual}/month · save {savings}%
            </Text>
          </TouchableOpacity>
        </View>

        {/* Feature Comparison */}
        <View style={styles.featureTable}>
          <View style={styles.featureHeader}>
            <Text style={styles.featureHeaderLabel}>Feature</Text>
            <Text style={styles.featureHeaderFree}>Free</Text>
            <Text style={styles.featureHeaderPlus}>Circles+</Text>
          </View>

          <FeatureRow feature="Private circles" free="1" plus="Unlimited" />
          <FeatureRow feature="Members per circle" free="15" plus="50" />
          <FeatureRow feature="Open Feed cards" free="2" plus="Unlimited" />
          <FeatureRow feature="Photo storage" free="100/circle" plus="5GB/circle" />
          <FeatureRow feature="Video call length" free="30 min" plus="Unlimited" />
          <FeatureRow feature="Call recording" free={false} plus={true} />
          <FeatureRow feature="Circle themes" free="3" plus="20+" />
          <FeatureRow feature="Year in Circles recap" free={false} plus={true} />
          <FeatureRow feature="Priority support" free={false} plus={true} />
        </View>

        {/* Subscribe Button */}
        <TouchableOpacity
          style={styles.subscribeButton}
          onPress={handleSubscribe}
          disabled={purchasing}
        >
          {purchasing ? (
            <ActivityIndicator color={Colors.surface} />
          ) : (
            <Text style={styles.subscribeButtonText}>Subscribe Now</Text>
          )}
        </TouchableOpacity>

        {/* Restore Purchases */}
        <TouchableOpacity onPress={handleRestore} style={styles.restoreButton}>
          <Text style={styles.restoreButtonText}>Restore Purchases</Text>
        </TouchableOpacity>

        {/* Reassurance */}
        <Text style={styles.reassurance}>Cancel anytime. No commitments.</Text>

        {/* Legal Links */}
        <View style={styles.legalLinks}>
          <TouchableOpacity
            onPress={() => Linking.openURL('https://circles.app/terms')}
          >
            <Text style={styles.legalLink}>Terms of Service</Text>
          </TouchableOpacity>
          <Text style={styles.legalSeparator}>·</Text>
          <TouchableOpacity
            onPress={() => Linking.openURL('https://circles.app/privacy')}
          >
            <Text style={styles.legalLink}>Privacy Policy</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  content: {
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 48,
    fontWeight: Typography.fontWeight.bold,
    color: '#FFD700', // Golden
    marginBottom: 8,
  },
  tagline: {
    fontSize: Typography.fontSize.lg,
    color: '#FFF',
    opacity: 0.9,
  },
  planToggle: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  planButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  planButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: '#FFD700',
  },
  bestValueBadge: {
    position: 'absolute',
    top: -10,
    right: 10,
    backgroundColor: '#FFD700',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  bestValueText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: '#000',
  },
  planButtonText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: '#FFF',
    marginBottom: 8,
  },
  planButtonTextActive: {
    color: '#FFD700',
  },
  planPrice: {
    fontSize: Typography.fontSize.md,
    color: '#FFF',
    opacity: 0.8,
  },
  planPriceActive: {
    opacity: 1,
  },
  savingsText: {
    fontSize: Typography.fontSize.sm,
    color: '#4ADE80',
    marginTop: 4,
  },
  featureTable: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 32,
  },
  featureHeader: {
    flexDirection: 'row',
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: Colors.border,
    marginBottom: 12,
  },
  featureHeaderLabel: {
    flex: 2,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textSecondary,
  },
  featureHeaderFree: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  featureHeaderPlus: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
    textAlign: 'center',
  },
  featureRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  featureLabel: {
    flex: 2,
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
  },
  featureFree: {
    flex: 1,
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  featurePlus: {
    flex: 1,
    fontSize: Typography.fontSize.md,
    color: Colors.primary,
    fontWeight: Typography.fontWeight.semibold,
    textAlign: 'center',
  },
  subscribeButton: {
    backgroundColor: '#FFD700',
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 16,
  },
  subscribeButtonText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: '#000',
  },
  restoreButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  restoreButtonText: {
    fontSize: Typography.fontSize.md,
    color: '#FFF',
    opacity: 0.8,
  },
  reassurance: {
    fontSize: Typography.fontSize.sm,
    color: '#FFF',
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 24,
  },
  legalLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  legalLink: {
    fontSize: Typography.fontSize.sm,
    color: '#FFF',
    opacity: 0.6,
  },
  legalSeparator: {
    fontSize: Typography.fontSize.sm,
    color: '#FFF',
    opacity: 0.6,
  },
});
