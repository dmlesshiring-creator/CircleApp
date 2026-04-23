import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  FlatList,
} from 'react-native';
import { signInWithPhoneNumber, PhoneAuthProvider } from 'firebase/auth';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { auth } from '../../services/firebase';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Routes } from '../../constants/routes';
import Svg, { Circle } from 'react-native-svg';

/**
 * Country data structure for selector
 */
interface Country {
  code: string;
  name: string;
  flag: string;
  dialCode: string;
}

const COUNTRIES: Country[] = [
  { code: 'IN', name: 'India', flag: '🇮🇳', dialCode: '+91' },
  { code: 'US', name: 'United States', flag: '🇺🇸', dialCode: '+1' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', dialCode: '+44' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', dialCode: '+1' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', dialCode: '+61' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬', dialCode: '+65' },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾', dialCode: '+60' },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰', dialCode: '+92' },
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩', dialCode: '+880' },
];

/**
 * CirclesLogo for top section
 */
const CirclesLogo = () => {
  const circleRadius = 25;
  return (
    <Svg width="80" height="80" viewBox="0 0 80 80">
      <Circle cx="23" cy="40" r={circleRadius} fill={Colors.primary} />
      <Circle cx="57" cy="40" r={circleRadius} fill={Colors.primary} />
      <Circle cx="40" cy="23" r={circleRadius} fill={Colors.primary} />
    </Svg>
  );
};

/**
 * Country Picker Modal
 */
interface CountryPickerProps {
  visible: boolean;
  onSelectCountry: (country: Country) => void;
  onClose: () => void;
}

const CountryPicker: React.FC<CountryPickerProps> = ({
  visible,
  onSelectCountry,
  onClose,
}) => {
  const [searchText, setSearchText] = useState('');
  const filteredCountries = COUNTRIES.filter(
    (country) =>
      country.name.toLowerCase().includes(searchText.toLowerCase()) ||
      country.dialCode.includes(searchText)
  );

  const handleSelectCountry = (country: Country) => {
    onSelectCountry(country);
    setSearchText('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={{ flex: 1, backgroundColor: Colors.background }}>
        {/* Header */}
        <View
          style={{
            paddingTop: 16,
            paddingBottom: 12,
            paddingHorizontal: 16,
            borderBottomWidth: 1,
            borderBottomColor: Colors.border,
          }}
        >
          <TouchableOpacity
            onPress={onClose}
            style={{ marginBottom: 12 }}
          >
            <Text
              style={{
                fontSize: Typography.fontSize.md,
                color: Colors.primary,
                fontWeight: Typography.fontWeight.semibold,
              }}
            >
              ← Back
            </Text>
          </TouchableOpacity>

          <TextInput
            placeholder="Search country..."
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor={Colors.textTertiary}
            style={{
              backgroundColor: Colors.surface,
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 10,
              fontSize: Typography.fontSize.md,
              color: Colors.textPrimary,
              borderWidth: 1,
              borderColor: Colors.border,
            }}
          />
        </View>

        {/* Country List */}
        <FlatList
          data={filteredCountries}
          keyExtractor={(item) => item.code}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleSelectCountry(item)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 16,
                borderBottomWidth: 1,
                borderBottomColor: Colors.border,
              }}
            >
              <Text
                style={{
                  fontSize: Typography.fontSize.md,
                  color: Colors.textPrimary,
                }}
              >
                {item.flag} {item.name} {item.dialCode}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </Modal>
  );
};

/**
 * Format phone number as XXXXX XXXXX (Indian format)
 */
const formatPhoneNumber = (text: string): string => {
  const cleaned = text.replace(/\D/g, '').slice(0, 10);
  if (cleaned.length <= 5) {
    return cleaned;
  }
  return cleaned.slice(0, 5) + ' ' + cleaned.slice(5);
};

/**
 * PhoneEntryScreen
 *
 * First screen of auth flow
 * - Collects user's phone number
 * - Validates with Firebase Auth
 * - Sends OTP via signInWithPhoneNumber
 * - Routes to OTPScreen with verificationId
 */
export default function PhoneEntryScreen({ navigation }: any) {
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]); // India default
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const recaptchaVerifier = useRef(null);
  const formAnimatedY = useRef(new Animated.Value(60)).current;

  // Animate form in on mount
  useEffect(() => {
    Animated.timing(formAnimatedY, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  /**
   * Handle phone number input change
   * - Format as user types
   * - Clear error when user starts typing
   */
  const handlePhoneChange = (text: string) => {
    const formatted = formatPhoneNumber(text);
    setPhoneNumber(formatted);
    if (error) setError(''); // Clear error on new input
  };

  /**
   * Clear phone input
   */
  const handleClearPhone = () => {
    setPhoneNumber('');
    setError('');
  };

  /**
   * Get clean phone number (digits only)
   */
  const getCleanPhoneNumber = (): string => {
    return phoneNumber.replace(/\D/g, '');
  };

  /**
   * Handle Continue button tap
   * - Validate phone number
   * - Call Firebase signInWithPhoneNumber
   * - Navigate to OTPScreen on success
   */
  const handleContinue = async () => {
    const cleanPhone = getCleanPhoneNumber();

    // Validate
    if (cleanPhone.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const fullPhoneNumber = selectedCountry.dialCode + cleanPhone;

      // Sign in with phone number
      const confirmation = await signInWithPhoneNumber(
        auth,
        fullPhoneNumber,
        recaptchaVerifier.current as any
      );

      // Navigate to OTP screen with verification ID and phone number
      navigation.navigate(Routes.OTP, {
        verificationId: confirmation.verificationId,
        phoneNumber: fullPhoneNumber,
        cleanPhoneNumber: cleanPhone,
      });
    } catch (err: any) {
      console.error('Phone auth error:', err);
      setError(err.message || 'Failed to send verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const cleanPhone = getCleanPhoneNumber();
  const isPhoneValid = cleanPhone.length === 10;
  const continueDisabled = !isPhoneValid || loading;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView
        style={{ flex: 1, backgroundColor: Colors.surface }}
        contentContainerStyle={{ flexGrow: 1 }}
        scrollEnabled={false}
      >
        {/* Top Section: Logo + Tagline */}
        <View
          style={{
            flex: 0.4,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 16,
          }}
        >
          <CirclesLogo />
          <Text
            style={{
              marginTop: 20,
              fontSize: Typography.fontSize.lg,
              fontWeight: Typography.fontWeight.semibold,
              color: Colors.textPrimary,
              textAlign: 'center',
              lineHeight: Typography.lineHeight.normal * Typography.fontSize.lg,
            }}
          >
            Connect with people you know.{'\n'}Discover people you haven't met yet.
          </Text>
        </View>

        {/* Bottom Section: Form */}
        <Animated.View
          style={{
            flex: 0.6,
            paddingHorizontal: 16,
            paddingTop: 24,
            transform: [{ translateY: formAnimatedY }],
          }}
        >
          {/* Country Code Selector */}
          <TouchableOpacity
            onPress={() => setCountryModalVisible(true)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderWidth: 1,
              borderColor: Colors.border,
              borderRadius: 8,
              marginBottom: 16,
              backgroundColor: Colors.surface,
            }}
          >
            <Text style={{ fontSize: 20, marginRight: 8 }}>
              {selectedCountry.flag}
            </Text>
            <Text
              style={{
                flex: 1,
                fontSize: Typography.fontSize.md,
                color: Colors.textPrimary,
                fontWeight: Typography.fontWeight.medium,
              }}
            >
              {selectedCountry.dialCode}
            </Text>
            <Text style={{ fontSize: 12, color: Colors.textTertiary }}>
              Change
            </Text>
          </TouchableOpacity>

          {/* Phone Number Input */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: error ? Colors.error : Colors.border,
              borderRadius: 8,
              marginBottom: error ? 4 : 16,
              backgroundColor: Colors.surface,
              paddingHorizontal: 12,
            }}
          >
            <TextInput
              placeholder="Enter phone number"
              placeholderTextColor={Colors.textTertiary}
              keyboardType="numeric"
              value={phoneNumber}
              onChangeText={handlePhoneChange}
              maxLength={13} // "XXXXX XXXXX" format
              editable={!loading}
              style={{
                flex: 1,
                paddingVertical: 12,
                fontSize: Typography.fontSize.md,
                color: Colors.textPrimary,
              }}
            />

            {phoneNumber.length > 0 && !loading && (
              <TouchableOpacity
                onPress={handleClearPhone}
                style={{ padding: 8 }}
              >
                <Text
                  style={{
                    fontSize: 18,
                    color: Colors.textTertiary,
                    fontWeight: 'bold',
                  }}
                >
                  ×
                </Text>
              </TouchableOpacity>
            )}

            {loading && (
              <View style={{ padding: 8 }}>
                {/* Loading indicator placeholder */}
              </View>
            )}
          </View>

          {/* Error Message */}
          {error && (
            <Text
              style={{
                fontSize: Typography.fontSize.sm,
                color: Colors.error,
                marginBottom: 16,
                fontWeight: Typography.fontWeight.medium,
              }}
            >
              {error}
            </Text>
          )}

          {/* Continue Button */}
          <TouchableOpacity
            onPress={handleContinue}
            disabled={continueDisabled}
            style={{
              backgroundColor: continueDisabled ? Colors.textTertiary : Colors.accent,
              borderRadius: 8,
              paddingVertical: 14,
              alignItems: 'center',
              marginBottom: 24,
              opacity: continueDisabled ? 0.5 : 1,
            }}
          >
            <Text
              style={{
                fontSize: Typography.fontSize.md,
                fontWeight: Typography.fontWeight.semibold,
                color: Colors.surface,
              }}
            >
              {loading ? 'Sending code...' : `Continue ${!continueDisabled ? '→' : ''}`}
            </Text>
          </TouchableOpacity>

          {/* Disclaimer */}
          <Text
            style={{
              fontSize: Typography.fontSize.sm,
              color: Colors.textTertiary,
              textAlign: 'center',
              lineHeight: Typography.lineHeight.normal * Typography.fontSize.sm,
            }}
          >
            We'll send you a verification code.{'\n'}Standard SMS rates may apply.
          </Text>
        </Animated.View>
      </ScrollView>

      {/* Country Picker Modal */}
      <CountryPicker
        visible={countryModalVisible}
        onSelectCountry={setSelectedCountry}
        onClose={() => setCountryModalVisible(false)}
      />

      {/* Firebase reCAPTCHA Verifier Modal */}
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={auth.app.options as any}
      />
    </KeyboardAvoidingView>
  );
}
