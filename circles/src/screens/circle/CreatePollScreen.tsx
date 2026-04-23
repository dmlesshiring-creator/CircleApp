import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, push, set } from 'firebase/database';
import { firestore, realtimeDb, auth } from '../../services/firebase';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';

interface CreatePollScreenProps {
  route: {
    params: {
      circleId: string;
    };
  };
  navigation: any;
}

type PollType = 'single' | 'multiple' | 'star';

interface PollOption {
  id: string;
  text: string;
}

const QUICK_TEMPLATES = [
  'Where should we eat?',
  'Which movie?',
  'What time?',
  'Rate the plan',
];

/**
 * Create Poll Screen
 * 
 * Modal/bottom sheet for creating polls in circle chat
 */
export default function CreatePollScreen({
  route,
  navigation,
}: CreatePollScreenProps) {
  const { circleId } = route.params;
  const currentUid = auth.currentUser?.uid;

  const [question, setQuestion] = useState('');
  const [pollType, setPollType] = useState<PollType>('single');
  const [options, setOptions] = useState<PollOption[]>([
    { id: '1', text: '' },
    { id: '2', text: '' },
  ]);
  const [submitting, setSubmitting] = useState(false);

  const handleTemplateSelect = (template: string) => {
    setQuestion(template);
    
    // Pre-fill options based on template
    if (template === 'Where should we eat?') {
      setOptions([
        { id: '1', text: 'Italian' },
        { id: '2', text: 'Chinese' },
        { id: '3', text: 'Indian' },
      ]);
    } else if (template === 'Which movie?') {
      setOptions([
        { id: '1', text: 'Option 1' },
        { id: '2', text: 'Option 2' },
      ]);
    } else if (template === 'What time?') {
      setOptions([
        { id: '1', text: 'Morning' },
        { id: '2', text: 'Afternoon' },
        { id: '3', text: 'Evening' },
      ]);
    } else if (template === 'Rate the plan') {
      setPollType('star');
    }
  };

  const handleAddOption = () => {
    if (options.length >= 6) {
      Alert.alert('Limit Reached', 'Maximum 6 options allowed');
      return;
    }

    setOptions([
      ...options,
      { id: Date.now().toString(), text: '' },
    ]);
  };

  const handleRemoveOption = (id: string) => {
    if (options.length <= 2) {
      Alert.alert('Minimum Required', 'At least 2 options required');
      return;
    }

    setOptions(options.filter((opt) => opt.id !== id));
  };

  const handleOptionTextChange = (id: string, text: string) => {
    setOptions(
      options.map((opt) => (opt.id === id ? { ...opt, text } : opt))
    );
  };

  const handleMoveOption = (index: number, direction: 'up' | 'down') => {
    const newOptions = [...options];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= options.length) return;

    [newOptions[index], newOptions[targetIndex]] = [
      newOptions[targetIndex],
      newOptions[index],
    ];

    setOptions(newOptions);
  };

  const validatePoll = (): boolean => {
    if (!question.trim()) {
      Alert.alert('Error', 'Please enter a question');
      return false;
    }

    if (question.length > 100) {
      Alert.alert('Error', 'Question must be 100 characters or less');
      return false;
    }

    if (pollType !== 'star') {
      const filledOptions = options.filter((opt) => opt.text.trim());
      
      if (filledOptions.length < 2) {
        Alert.alert('Error', 'Please provide at least 2 options');
        return false;
      }
    }

    return true;
  };

  const handlePostPoll = async () => {
    if (!currentUid || !validatePoll()) return;

    setSubmitting(true);

    try {
      // Prepare poll options
      let pollOptions: any[] = [];

      if (pollType === 'star') {
        // Star rating: no predefined options
        pollOptions = [];
      } else {
        // Choice polls: filter and format options
        pollOptions = options
          .filter((opt) => opt.text.trim())
          .map((opt) => ({
            id: opt.id,
            text: opt.text.trim(),
            votes: [],
          }));
      }

      // Create poll in Firestore
      const pollRef = await addDoc(
        collection(firestore, `circles/${circleId}/polls`),
        {
          question: question.trim(),
          type: pollType,
          options: pollOptions,
          creatorUid: currentUid,
          createdAt: serverTimestamp(),
          isClosed: false,
        }
      );

      // Post poll message to chat
      const messagesRef = ref(realtimeDb, `circles/${circleId}/messages`);
      const newMessageRef = push(messagesRef);

      await set(newMessageRef, {
        type: 'poll',
        pollId: pollRef.id,
        senderId: currentUid,
        createdAt: Date.now(),
      });

      console.log('Poll created:', pollRef.id);

      // Navigate back
      navigation.goBack();
    } catch (error) {
      console.error('Error creating poll:', error);
      Alert.alert('Error', 'Failed to create poll');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButton}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Poll</Text>
        <TouchableOpacity
          onPress={handlePostPoll}
          disabled={submitting}
        >
          <Text
            style={[
              styles.postButton,
              submitting && styles.postButtonDisabled,
            ]}
          >
            {submitting ? 'Posting...' : 'Post'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Question input */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Question</Text>
          <TextInput
            style={styles.questionInput}
            placeholder="What do you want to ask?"
            placeholderTextColor={Colors.textTertiary}
            value={question}
            onChangeText={setQuestion}
            maxLength={100}
            multiline
          />
          <Text style={styles.charCount}>{question.length}/100</Text>
        </View>

        {/* Quick templates */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Quick Templates</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.templatesContainer}
          >
            {QUICK_TEMPLATES.map((template) => (
              <TouchableOpacity
                key={template}
                style={styles.templateChip}
                onPress={() => handleTemplateSelect(template)}
              >
                <Text style={styles.templateText}>{template}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Poll type selector */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Poll Type</Text>
          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                pollType === 'single' && styles.typeButtonActive,
              ]}
              onPress={() => setPollType('single')}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  pollType === 'single' && styles.typeButtonTextActive,
                ]}
              >
                Single Choice
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeButton,
                pollType === 'multiple' && styles.typeButtonActive,
              ]}
              onPress={() => setPollType('multiple')}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  pollType === 'multiple' && styles.typeButtonTextActive,
                ]}
              >
                Multiple Choice
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeButton,
                pollType === 'star' && styles.typeButtonActive,
              ]}
              onPress={() => setPollType('star')}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  pollType === 'star' && styles.typeButtonTextActive,
                ]}
              >
                ⭐ Star Rating
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Options (for choice polls) */}
        {pollType !== 'star' && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Options</Text>
            
            {options.map((option, index) => (
              <View key={option.id} style={styles.optionRow}>
                {/* Drag handle */}
                <View style={styles.dragHandle}>
                  <TouchableOpacity
                    onPress={() => handleMoveOption(index, 'up')}
                    disabled={index === 0}
                  >
                    <Text
                      style={[
                        styles.dragIcon,
                        index === 0 && styles.dragIconDisabled,
                      ]}
                    >
                      ▲
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleMoveOption(index, 'down')}
                    disabled={index === options.length - 1}
                  >
                    <Text
                      style={[
                        styles.dragIcon,
                        index === options.length - 1 && styles.dragIconDisabled,
                      ]}
                    >
                      ▼
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Option input */}
                <TextInput
                  style={styles.optionInput}
                  placeholder={`Option ${index + 1}`}
                  placeholderTextColor={Colors.textTertiary}
                  value={option.text}
                  onChangeText={(text) => handleOptionTextChange(option.id, text)}
                  maxLength={50}
                />

                {/* Remove button */}
                {options.length > 2 && (
                  <TouchableOpacity
                    onPress={() => handleRemoveOption(option.id)}
                    style={styles.removeButton}
                  >
                    <Text style={styles.removeIcon}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}

            {/* Add option button */}
            {options.length < 6 && (
              <TouchableOpacity
                style={styles.addOptionButton}
                onPress={handleAddOption}
              >
                <Text style={styles.addOptionText}>+ Add Option</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Star rating info */}
        {pollType === 'star' && (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              Members will rate from 1 to 5 stars. Results will show the average rating and distribution.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  cancelButton: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  postButton: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary,
  },
  postButtonDisabled: {
    opacity: 0.5,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sectionLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  questionInput: {
    fontSize: Typography.fontSize.lg,
    color: Colors.textPrimary,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textTertiary,
    textAlign: 'right',
    marginTop: 4,
  },
  templatesContainer: {
    gap: 8,
  },
  templateChip: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  templateText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  typeButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  typeButtonText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.semibold,
  },
  typeButtonTextActive: {
    color: Colors.primary,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  dragHandle: {
    gap: 4,
  },
  dragIcon: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  dragIconDisabled: {
    opacity: 0.3,
  },
  optionInput: {
    flex: 1,
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeIcon: {
    fontSize: 16,
    color: Colors.surface,
  },
  addOptionButton: {
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    marginTop: 8,
  },
  addOptionText: {
    fontSize: Typography.fontSize.md,
    color: Colors.primary,
    fontWeight: Typography.fontWeight.semibold,
  },
  infoBox: {
    margin: 16,
    padding: 16,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  infoText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeight.normal * Typography.fontSize.sm,
  },
});
