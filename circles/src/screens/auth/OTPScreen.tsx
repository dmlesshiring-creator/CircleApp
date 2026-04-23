import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { signInWithPhoneNumber, PhoneAuthProvider, signInWithCredential } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, firestore } from '../../services/firebase';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Routes } from '../../constants/routes';

interface OTPScreenParams {
  phoneNumber: string;
  verificationId: string;
}

/**
 * Mask phone number: show first 3 and last 2 digits
 * +91 XXXXX XXXXX → +91 XXXXX 95XX
 */
const maskPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 10) return phone;
  const first3 = cleaned.slice(0, 3);
  const last2 = cleaned.slice(-2);
  return `+91 ${first3}XX XXXXX`;
};

/**
 * OTP Input Box Component
 */
interface OTPBoxProps {
  value: string;
  onChangeText: (text: string) => void;
  onKeyPress: (key: string) => void;
  isFocused: boolean;
  shakeAnimation: Animated.Value;
  boxIndex: number;
}

const OTPBox: React.FC<OTPBoxProps> = ({
  value,
  onChangeText,
  onKeyPress,
  isFocused,
  shakeAnimation,
  boxIndex,
}) => {
  const inputRef = useRef<TextInput>(null);

  return (
    <Animated.View
      style={{
        transform: [
          {
            translateX: shakeAnimation.interpolate({
              inputRange: [0, 0.25, 0.5, 0.75, 1],
              outputRange: [0, -10, 10, -10, 0],
            }),
          },
        ],
      }}
    >
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        onKeyPress={({ nativeEvent }) => onKeyPress(nativeEvent.key)}
        keyboardType="numeric"
        maxLength={1}
        editable={!value} // Prevent editing once filled
        selectTextOnFocus={false}
        style={{
          width: 48,
          height: 54,
          borderWidth: 2,
          borderColor: value ? Colors.primary : isFocused ? Colors.primary : Colors.border,
          borderRadius: 8,
          textAlign: 'center',
          fontSize: Typography.fontSize.xxl,
          fontWeight: Typography.fontWeight.bold,
          color: value ? Colors.surface : Colors.textPrimary,
          backgroundColor: value ? Colors.primary : Colors.surface,
          marginHorizontal: 4,
        }}
      />
    </Animated.View>
  );
};

/**
 * OTPScreen
 *
 * Second screen of auth flow
 * - Receives phoneNumber and verificationId from PhoneEntryScreen
 * - User enters 6-digit OTP
 * - Auto-advances to next box on digit entry
 * - Auto-submits when all 6 digits filled
 * - Shows resend timer (counts down from 60s)
 * - On success: checks Firestore user doc, routes accordingly
 * - On error: shakes boxes, clears inputs, shows error message
 */
export default function OTPScreen({ navigation, route }: any) {
  const { phoneNumber, verificationId } = route.params as OTPScreenParams;

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [verificationIdState, setVerificationIdState] = useState(verificationId);

  const shakeAnimation = useRef(new Animated.Value(0)).current;
  const inputRefs = useRef<(TextInput | null)[]>([]);

  /**
   * Timer effect: count down from 60 seconds
   */
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  /**
   * Auto-focus first input on mount
   */
  useEffect(() => {
    setTimeout(() => inputRefs.current[0]?.focus(), 200);
  }, []);

  /**
   * Handle OTP digit input
   */
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Clear error on new input
    if (error) setError('');

    // Auto-advance to next box
    if (value && index < 5) {
      setTimeout(() => inputRefs.current[index + 1]?.focus(), 50);
    }

    // Auto-submit when all 6 digits filled
    if (newOtp.every((digit) => digit)) {
      verifyOtp(newOtp.join(''));
    }
  };

  /**
   * Handle backspace
   */
  const handleKeyPress = (index: number, key: string) => {
    if (key === 'Backspace') {
      const newOtp = [...otp];

      if (otp[index]) {
        // If current box has value, clear it
        newOtp[index] = '';
      } else if (index > 0) {
        // If current box is empty, move to previous and clear it
        newOtp[index - 1] = '';
        setTimeout(() => inputRefs.current[index - 1]?.focus(), 50);
      }

      setOtp(newOtp);
    }
  };

  /**
   * Shake animation
   */
  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnimation, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 0,
        duration: 0,
        useNativeDriver: true,
      }),
    ]).start();
  };

  /**
   * Verify OTP
   */
  const verifyOtp = async (otpCode: string) => {
    try {
      setLoading(true);
      setError('');

      // Create credential from OTP
      const credential = PhoneAuthProvider.credential(verificationIdState, otpCode);

      // Sign in with credential
      const userCredential = await signInWithCredential(auth, credential);
      const uid = userCredential.user.uid;

      // Check if Firestore user doc exists
      const userDocRef = doc(firestore, 'users', uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        // Profile complete → navigate to main app
        navigation.replace(Routes.FEED_TAB);
      } else {
        // Profile incomplete → continue onboarding
        navigation.replace(Routes.DISPLAY_NAME);
      }
    } catch (err: any) {
      console.error('OTP verification error:', err);
      setError('Incorrect code. Try again.');
      triggerShake();
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => inputRefs.current[0]?.focus(), 500);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Resend OTP
   */
  const handleResend = async () => {
    try {
      setLoading(true);
      setError('');
      setOtp(['', '', '', '', '', '']);

      // Send OTP again
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, null as any);

      setVerificationIdState(confirmation.verificationId);
      setResendTimer(60);
      setCanResend(false);

      setTimeout(() => inputRefs.current[0]?.focus(), 200);
    } catch (err: any) {
      console.error('Resend error:', err);
      setError('Failed to resend code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const maskedPhone = maskPhoneNumber(phoneNumber);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <View style={{ flex: 1, backgroundColor: Colors.surface, paddingHorizontal: 16 }}>
        {/* Header */}
        <View style={{ marginTop: 60, marginBottom: 40 }}>
          <Text
            style={{
              fontSize: Typography.fontSize.xxxl,
              fontWeight: Typography.fontWeight.bold,
              color: Colors.textPrimary,
              marginBottom: 12,
            }}
          >
            Enter the code
          </Text>
          <Text
            style={{
              fontSize: Typography.fontSize.md,
              color: Colors.textSecondary,
              lineHeight: Typography.lineHeight.normal * Typography.fontSize.md,
            }}
          >
            We sent a 6-digit code to {maskedPhone}
          </Text>
        </View>

        {/* OTP Input Boxes */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            marginBottom: 32,
          }}
        >
          {otp.map((digit, index) => (
            <OTPBox
              key={index}
              value={digit}
              onChangeText={(value) => handleOtpChange(index, value)}
              onKeyPress={(key) => handleKeyPress(index, key)}
              isFocused={focusedIndex === index}
              shakeAnimation={shakeAnimation}
              boxIndex={index}
            />
          ))}
        </View>

        {/* Error Message */}
        {error && (
          <Text
            style={{
              fontSize: Typography.fontSize.sm,
              color: Colors.error,
              textAlign: 'center',
              marginBottom: 20,
              fontWeight: Typography.fontWeight.medium,
            }}
          >
            {error}
          </Text>
        )}

        {/* Resend Section */}
        <View style={{ alignItems: 'center' }}>
          {!canResend ? (
            <Text
              style={{
                fontSize: Typography.fontSize.sm,
                color: Colors.textSecondary,
              }}
            >
              Resend code in 0:{resendTimer < 10 ? `0${resendTimer}` : resendTimer}
            </Text>
          ) : (
            <TouchableOpacity onPress={handleResend} disabled={loading}>
              <Text
                style={{
                  fontSize: Typography.fontSize.sm,
                  color: Colors.primary,
                  fontWeight: Typography.fontWeight.semibold,
                }}
              >
                Resend code
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Hidden TextInput refs for focus management */}
        {[...Array(6)].map((_, index) => (
          <TextInput
            key={`hidden-${index}`}
            ref={(ref) => {
              inputRefs.current[index] = ref;
            }}
            style={{ display: 'none' }}
          />
        ))}
      </View>

      {/* Loading Overlay */}
      {loading && (
        <Modal transparent={true} animationType="fade">
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <ActivityIndicator size="large" color={Colors.surface} />
          </View>
        </Modal>
      )}
    </KeyboardAvoidingView>
  );
}
