import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Routes } from '../../constants/routes';
import Svg, { Circle } from 'react-native-svg';

/**
 * CirclesLogo
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
 * GoogleSignInScreen - Email/Password Authentication
 * 
 * Simpler alternative to phone auth
 * No billing required
 */
export default function GoogleSignInScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async () => {
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      setError('');

      if (isSignUp) {
        // Create new account
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log('User created:', userCredential.user.uid);
        // Navigate to onboarding
        navigation.navigate(Routes.DISPLAY_NAME);
      } else {
        // Sign in existing user
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('User signed in:', userCredential.user.uid);
        // RootNavigator will handle navigation based on auth state
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      
      // User-friendly error messages
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Try signing in instead.');
      } else if (err.code === 'auth/user-not-found') {
        setError('No account found with this email. Try signing up instead.');
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect password. Please try again.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address.');
      } else {
        setError(err.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Logo Section */}
      <View style={styles.logoSection}>
        <CirclesLogo />
        <Text style={styles.tagline}>
          Connect with people you know.{'\n'}Discover people you haven't met yet.
        </Text>
      </View>

      {/* Form Section */}
      <View style={styles.formSection}>
        <Text style={styles.title}>
          {isSignUp ? 'Create Account' : 'Welcome Back'}
        </Text>

        {/* Email Input */}
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            if (error) setError('');
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!loading}
          style={styles.input}
          placeholderTextColor={Colors.textTertiary}
        />

        {/* Password Input */}
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            if (error) setError('');
          }}
          secureTextEntry
          editable={!loading}
          style={styles.input}
          placeholderTextColor={Colors.textTertiary}
        />

        {/* Error Message */}
        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}

        {/* Auth Button */}
        <TouchableOpacity
          onPress={handleAuth}
          disabled={loading}
          style={[
            styles.authButton,
            loading && styles.authButtonDisabled,
          ]}
        >
          {loading ? (
            <ActivityIndicator color={Colors.surface} />
          ) : (
            <Text style={styles.authButtonText}>
              {isSignUp ? 'Sign Up' : 'Sign In'}
            </Text>
          )}
        </TouchableOpacity>

        {/* Toggle Sign In/Sign Up */}
        <TouchableOpacity
          onPress={() => {
            setIsSignUp(!isSignUp);
            setError('');
          }}
          disabled={loading}
          style={styles.toggleButton}
        >
          <Text style={styles.toggleText}>
            {isSignUp
              ? 'Already have an account? Sign In'
              : "Don't have an account? Sign Up"}
          </Text>
        </TouchableOpacity>

        {/* Test Account Info */}
        <View style={styles.testInfo}>
          <Text style={styles.testInfoText}>
            Test Account:{'\n'}
            Email: test@circles.app{'\n'}
            Password: test123
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  logoSection: {
    flex: 0.4,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  tagline: {
    marginTop: 20,
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.normal * Typography.fontSize.lg,
  },
  formSection: {
    flex: 0.6,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold as any,
    color: Colors.textPrimary,
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  errorText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.error,
    marginBottom: 16,
    fontWeight: Typography.fontWeight.medium as any,
  },
  authButton: {
    backgroundColor: Colors.accent,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  authButtonDisabled: {
    backgroundColor: Colors.textTertiary,
    opacity: 0.5,
  },
  authButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.surface,
  },
  toggleButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  toggleText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    fontWeight: Typography.fontWeight.medium as any,
  },
  testInfo: {
    marginTop: 24,
    padding: 12,
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  testInfoText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.normal * Typography.fontSize.sm,
  },
});
