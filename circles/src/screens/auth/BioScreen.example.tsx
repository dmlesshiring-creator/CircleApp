/**
 * EXAMPLE: Bio Screen with Content Moderation
 * 
 * This shows how to integrate content moderation in the bio onboarding screen.
 * Copy the relevant parts into your actual BioScreen.tsx
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { doc, updateDoc } from 'firebase/firestore';
import { firestore, auth } from '../../services/firebase';
import { Colors } from '../../constants/colors';
import {
  checkContent,
  getModerationErrorMessage,
  sanitizeText,
  shouldModerate,
} from '../../services/moderation.service';

const MAX_BIO_LENGTH = 80;

export const BioScreenExample: React.FC = () => {
  const navigation = useNavigation();
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);

  const handleContinue = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    // Validate bio length
    if (bio.trim().length === 0) {
      Alert.alert('Bio Required', 'Please enter a short bio about yourself');
      return;
    }

    if (bio.length > MAX_BIO_LENGTH) {
      Alert.alert('Bio Too Long', `Bio must be ${MAX_BIO_LENGTH} characters or less`);
      return;
    }

    setSaving(true);

    try {
      // Sanitize bio text
      const sanitizedBio = sanitizeText(bio);

      // Check if moderation is needed (skip for very short texts)
      if (shouldModerate(sanitizedBio)) {
        // Run content moderation
        const result = await checkContent(sanitizedBio);

        if (!result.isSafe) {
          // Show user-friendly error message
          Alert.alert('Content Not Allowed', getModerationErrorMessage(result));
          setSaving(false);
          return;
        }
      }

      // Save bio to Firestore
      const userRef = doc(firestore, 'users', currentUser.uid);
      await updateDoc(userRef, {
        bio: sanitizedBio,
        bioUpdatedAt: Date.now(),
      });

      // Navigate to next screen
      navigation.navigate('HomeScreen' as never);
    } catch (error) {
      console.error('Error saving bio:', error);
      Alert.alert('Error', 'Failed to save bio. Please try again.');
      setSaving(false);
    }
  };

  const handleSkip = () => {
    // Allow users to skip bio
    navigation.navigate('HomeScreen' as never);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tell us about yourself</Text>
      <Text style={styles.subtitle}>
        Write a short bio (optional, max {MAX_BIO_LENGTH} characters)
      </Text>

      <TextInput
        style={styles.input}
        placeholder="e.g. Coffee lover, weekend hiker, always up for new adventures"
        value={bio}
        onChangeText={setBio}
        maxLength={MAX_BIO_LENGTH}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
        placeholderTextColor={Colors.textTertiary}
      />

      <Text style={styles.charCount}>
        {bio.length}/{MAX_BIO_LENGTH}
      </Text>

      <TouchableOpacity
        style={[styles.continueButton, saving && styles.continueButtonDisabled]}
        onPress={handleContinue}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color={Colors.surface} />
        ) : (
          <Text style={styles.continueButtonText}>Continue</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.skipButton} onPress={handleSkip} disabled={saving}>
        <Text style={styles.skipButtonText}>Skip for now</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 24,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.textPrimary,
    minHeight: 100,
  },
  charCount: {
    fontSize: 13,
    color: Colors.textTertiary,
    textAlign: 'right',
    marginTop: 8,
    marginBottom: 24,
  },
  continueButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  continueButtonDisabled: {
    opacity: 0.6,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.surface,
  },
  skipButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
});
