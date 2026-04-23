import Purchases, {
  CustomerInfo,
  PurchasesPackage,
  PurchasesOffering,
} from 'react-native-purchases';
import { doc, updateDoc } from 'firebase/firestore';
import { firestore, auth } from './firebase';
import { Platform } from 'react-native';

const REVENUECAT_API_KEY_IOS = 'YOUR_IOS_API_KEY';
const REVENUECAT_API_KEY_ANDROID = 'YOUR_ANDROID_API_KEY';
const ENTITLEMENT_ID = 'circles_plus';

/**
 * Subscription Service
 * 
 * Handles Circles+ subscription via RevenueCat
 */

/**
 * Initialize RevenueCat SDK
 * 
 * Call this on app start after authentication
 */
export const initRevenueCat = async (): Promise<void> => {
  try {
    const apiKey = Platform.OS === 'ios' ? REVENUECAT_API_KEY_IOS : REVENUECAT_API_KEY_ANDROID;
    
    await Purchases.configure({ apiKey });

    // Set user ID
    const currentUser = auth.currentUser;
    if (currentUser) {
      await Purchases.logIn(currentUser.uid);
    }

    console.log('RevenueCat initialized');
  } catch (error) {
    console.error('Error initializing RevenueCat:', error);
  }
};

/**
 * Get subscription status
 */
export const getSubscriptionStatus = async (): Promise<{
  isPlus: boolean;
  expiresDate: Date | null;
  willRenew: boolean;
}> => {
  try {
    const customerInfo: CustomerInfo = await Purchases.getCustomerInfo();
    
    const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];
    
    if (entitlement) {
      return {
        isPlus: true,
        expiresDate: entitlement.expirationDate ? new Date(entitlement.expirationDate) : null,
        willRenew: entitlement.willRenew,
      };
    }

    return {
      isPlus: false,
      expiresDate: null,
      willRenew: false,
    };
  } catch (error) {
    console.error('Error getting subscription status:', error);
    return {
      isPlus: false,
      expiresDate: null,
      willRenew: false,
    };
  }
};

/**
 * Get available packages
 */
export const getAvailablePackages = async (): Promise<{
  monthly: PurchasesPackage | null;
  annual: PurchasesPackage | null;
}> => {
  try {
    const offerings: PurchasesOffering | null = await Purchases.getOfferings();
    
    if (!offerings || !offerings.current) {
      return { monthly: null, annual: null };
    }

    const currentOffering = offerings.current;
    
    // Find monthly and annual packages
    const monthly = currentOffering.availablePackages.find(
      (pkg) => pkg.identifier === '$rc_monthly' || pkg.product.identifier === 'circles_plus_monthly'
    ) || null;

    const annual = currentOffering.availablePackages.find(
      (pkg) => pkg.identifier === '$rc_annual' || pkg.product.identifier === 'circles_plus_annual'
    ) || null;

    return { monthly, annual };
  } catch (error) {
    console.error('Error getting packages:', error);
    return { monthly: null, annual: null };
  }
};

/**
 * Purchase subscription
 */
export const purchaseSubscription = async (
  packageToPurchase: PurchasesPackage
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
    
    // Check if purchase was successful
    const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];
    
    if (entitlement) {
      // Update Firestore
      const currentUser = auth.currentUser;
      if (currentUser) {
        await updateDoc(doc(firestore, `users/${currentUser.uid}`), {
          subscription: 'plus',
          subscriptionExpiresAt: entitlement.expirationDate
            ? new Date(entitlement.expirationDate).getTime()
            : null,
          subscriptionWillRenew: entitlement.willRenew,
        });
      }

      return { success: true };
    }

    return { success: false, error: 'Purchase did not activate entitlement' };
  } catch (error: any) {
    console.error('Error purchasing subscription:', error);
    
    // Handle user cancellation
    if (error.userCancelled) {
      return { success: false, error: 'Purchase cancelled' };
    }

    return { success: false, error: error.message || 'Purchase failed' };
  }
};

/**
 * Restore purchases
 */
export const restorePurchases = async (): Promise<{
  success: boolean;
  restored: boolean;
  error?: string;
}> => {
  try {
    const customerInfo: CustomerInfo = await Purchases.restorePurchases();
    
    const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];
    
    if (entitlement) {
      // Update Firestore
      const currentUser = auth.currentUser;
      if (currentUser) {
        await updateDoc(doc(firestore, `users/${currentUser.uid}`), {
          subscription: 'plus',
          subscriptionExpiresAt: entitlement.expirationDate
            ? new Date(entitlement.expirationDate).getTime()
            : null,
          subscriptionWillRenew: entitlement.willRenew,
        });
      }

      return { success: true, restored: true };
    }

    return { success: true, restored: false };
  } catch (error: any) {
    console.error('Error restoring purchases:', error);
    return { success: false, restored: false, error: error.message };
  }
};

/**
 * Check if user has Circles+ subscription
 * 
 * Quick check from Firestore (cached)
 */
export const hasCirclesPlus = async (): Promise<boolean> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) return false;

    const userDoc = await firestore.collection('users').doc(currentUser.uid).get();
    const userData = userDoc.data();

    if (!userData) return false;

    // Check if subscription is active
    if (userData.subscription === 'plus') {
      const expiresAt = userData.subscriptionExpiresAt;
      
      // If no expiration date, assume active (lifetime)
      if (!expiresAt) return true;

      // Check if not expired
      return expiresAt > Date.now();
    }

    return false;
  } catch (error) {
    console.error('Error checking Circles+ status:', error);
    return false;
  }
};

/**
 * Get formatted price for a package
 */
export const getFormattedPrice = (pkg: PurchasesPackage): string => {
  return pkg.product.priceString;
};

/**
 * Calculate monthly price for annual package
 */
export const getMonthlyPriceForAnnual = (annualPackage: PurchasesPackage): string => {
  const annualPrice = annualPackage.product.price;
  const monthlyPrice = annualPrice / 12;
  
  // Format as currency
  return `₹${Math.round(monthlyPrice)}`;
};

/**
 * Calculate savings percentage for annual vs monthly
 */
export const getSavingsPercentage = (
  monthlyPackage: PurchasesPackage,
  annualPackage: PurchasesPackage
): number => {
  const monthlyPrice = monthlyPackage.product.price;
  const annualPrice = annualPackage.product.price;
  const annualAsMonthly = annualPrice / 12;
  
  const savings = ((monthlyPrice - annualAsMonthly) / monthlyPrice) * 100;
  
  return Math.round(savings);
};
