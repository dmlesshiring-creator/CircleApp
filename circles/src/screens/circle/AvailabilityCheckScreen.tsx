import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import {
  collection,
  addDoc,
  doc,
  onSnapshot,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, push, set } from 'firebase/database';
import { firestore, realtimeDb, auth } from '../../services/firebase';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';

interface AvailabilityCheckScreenProps {
  route: {
    params: {
      circleId: string;
      mode?: 'create' | 'respond' | 'results';
      pollId?: string;
    };
  };
  navigation: any;
}

interface AvailabilityPoll {
  id: string;
  circleId: string;
  proposedDates: string[]; // ISO date strings
  responses: Record<string, string[]>; // uid -> array of ISO dates
  creatorUid: string;
  createdAt: any;
  isOpen: boolean;
  memberCount: number;
}

/**
 * Availability Check Screen
 * 
 * Allows creator to propose dates and members to mark availability
 */
export default function AvailabilityCheckScreen({
  route,
  navigation,
}: AvailabilityCheckScreenProps) {
  const { circleId, mode = 'create', pollId } = route.params;
  const currentUid = auth.currentUser?.uid;

  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [poll, setPoll] = useState<AvailabilityPoll | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Load existing poll if in respond/results mode
  useEffect(() => {
    if (pollId && mode !== 'create') {
      const pollRef = doc(firestore, `circles/${circleId}/availabilityPolls/${pollId}`);
      
      const unsubscribe = onSnapshot(pollRef, (snapshot) => {
        if (snapshot.exists()) {
          setPoll({
            id: snapshot.id,
            ...snapshot.data(),
          } as AvailabilityPoll);

          // Load user's existing responses
          const data = snapshot.data();
          if (data.responses && currentUid && data.responses[currentUid]) {
            setSelectedDates(data.responses[currentUid]);
          }
        }
      });

      return () => unsubscribe();
    }
  }, [pollId, circleId, mode, currentUid]);

  const getDaysInMonth = (date: Date): Date[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days: Date[] = [];
    
    // Add padding for first week
    const firstDayOfWeek = firstDay.getDay();
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(new Date(year, month, -firstDayOfWeek + i + 1));
    }
    
    // Add all days in month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const formatDateKey = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const isDateSelected = (date: Date): boolean => {
    const key = formatDateKey(date);
    return selectedDates.includes(key);
  };

  const isDateProposed = (date: Date): boolean => {
    if (!poll) return false;
    const key = formatDateKey(date);
    return poll.proposedDates.includes(key);
  };

  const getDateAvailability = (date: Date): number => {
    if (!poll || mode === 'create') return 0;
    
    const key = formatDateKey(date);
    if (!poll.proposedDates.includes(key)) return 0;
    
    let count = 0;
    Object.values(poll.responses).forEach((dates) => {
      if (dates.includes(key)) count++;
    });
    
    return count;
  };

  const getAvailabilityColor = (date: Date): string => {
    if (mode === 'create') {
      return isDateSelected(date) ? Colors.primary : 'transparent';
    }

    if (mode === 'respond') {
      if (!isDateProposed(date)) return 'transparent';
      return isDateSelected(date) ? '#2ECC71' : 'transparent';
    }

    // Results mode
    if (!isDateProposed(date)) return 'transparent';
    
    const availability = getDateAvailability(date);
    const percentage = poll ? (availability / poll.memberCount) * 100 : 0;
    
    if (percentage === 100) return '#2ECC71'; // Deep green
    if (percentage >= 75) return '#A8E6CF'; // Light green
    if (percentage >= 50) return '#FFE66D'; // Yellow
    return '#CCCCCC'; // Grey
  };

  const handleDateTap = (date: Date) => {
    const key = formatDateKey(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Can't select past dates
    if (date < today) return;

    if (mode === 'create') {
      // Creator mode: toggle proposed dates
      if (selectedDates.includes(key)) {
        setSelectedDates(selectedDates.filter((d) => d !== key));
      } else {
        if (selectedDates.length >= 14) {
          Alert.alert('Limit Reached', 'Maximum 14 dates can be proposed');
          return;
        }
        setSelectedDates([...selectedDates, key]);
      }
    } else if (mode === 'respond') {
      // Member mode: toggle availability on proposed dates
      if (!isDateProposed(date)) return;
      
      if (selectedDates.includes(key)) {
        setSelectedDates(selectedDates.filter((d) => d !== key));
      } else {
        setSelectedDates([...selectedDates, key]);
      }
    } else if (mode === 'results') {
      // Results mode: tap to create plan with this date
      if (!isDateProposed(date)) return;
      
      const availability = getDateAvailability(date);
      if (availability === 0) return;
      
      // Navigate to CreatePlanScreen with pre-filled date
      navigation.navigate('CreatePlanScreen', {
        circleId,
        prefilledDate: date.toISOString(),
        prefilledRSVPs: getRespondentsForDate(date),
      });
    }
  };

  const getRespondentsForDate = (date: Date): string[] => {
    if (!poll) return [];
    
    const key = formatDateKey(date);
    const respondents: string[] = [];
    
    Object.entries(poll.responses).forEach(([uid, dates]) => {
      if (dates.includes(key)) {
        respondents.push(uid);
      }
    });
    
    return respondents;
  };

  const handleSendPoll = async () => {
    if (!currentUid) return;

    if (selectedDates.length === 0) {
      Alert.alert('Error', 'Please select at least one date');
      return;
    }

    setSubmitting(true);

    try {
      // Get circle member count
      const circleDoc = await firestore.collection('circles').doc(circleId).get();
      const memberCount = circleDoc.data()?.members?.length || 0;

      // Create availability poll
      const pollRef = await addDoc(
        collection(firestore, `circles/${circleId}/availabilityPolls`),
        {
          proposedDates: selectedDates.sort(),
          responses: {},
          creatorUid: currentUid,
          createdAt: serverTimestamp(),
          isOpen: true,
          memberCount,
        }
      );

      // Post to chat
      const messagesRef = ref(realtimeDb, `circles/${circleId}/messages`);
      const newMessageRef = push(messagesRef);

      await set(newMessageRef, {
        type: 'availability_poll',
        pollId: pollRef.id,
        senderId: currentUid,
        createdAt: Date.now(),
      });

      console.log('Availability poll created:', pollRef.id);

      navigation.goBack();
    } catch (error) {
      console.error('Error creating availability poll:', error);
      Alert.alert('Error', 'Failed to create availability poll');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveResponse = async () => {
    if (!currentUid || !pollId) return;

    setSubmitting(true);

    try {
      const pollRef = doc(firestore, `circles/${circleId}/availabilityPolls/${pollId}`);
      
      await updateDoc(pollRef, {
        [`responses.${currentUid}`]: selectedDates,
      });

      Alert.alert('Success', 'Your availability has been saved');
      navigation.goBack();
    } catch (error) {
      console.error('Error saving response:', error);
      Alert.alert('Error', 'Failed to save response');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  const handlePrevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  const monthName = currentMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const days = getDaysInMonth(currentMonth);
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButton}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {mode === 'create' && 'Check Availability'}
          {mode === 'respond' && 'Mark Your Availability'}
          {mode === 'results' && 'Availability Results'}
        </Text>
        <TouchableOpacity
          onPress={mode === 'create' ? handleSendPoll : handleSaveResponse}
          disabled={submitting || mode === 'results'}
        >
          <Text
            style={[
              styles.saveButton,
              (submitting || mode === 'results') && styles.saveButtonDisabled,
            ]}
          >
            {mode === 'results' ? '' : submitting ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Instructions */}
        <View style={styles.instructions}>
          {mode === 'create' && (
            <Text style={styles.instructionText}>
              Tap dates to propose them for the event. You can select up to 14 dates.
            </Text>
          )}
          {mode === 'respond' && (
            <Text style={styles.instructionText}>
              Tap the proposed dates when you're available. Green = you're available.
            </Text>
          )}
          {mode === 'results' && (
            <Text style={styles.instructionText}>
              Tap a green date to create a plan with pre-filled RSVPs.
            </Text>
          )}
        </View>

        {/* Selected count */}
        {mode === 'create' && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>
              {selectedDates.length} / 14 dates selected
            </Text>
          </View>
        )}

        {/* Calendar */}
        <View style={styles.calendar}>
          {/* Month navigation */}
          <View style={styles.monthHeader}>
            <TouchableOpacity onPress={handlePrevMonth}>
              <Text style={styles.navButton}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.monthName}>{monthName}</Text>
            <TouchableOpacity onPress={handleNextMonth}>
              <Text style={styles.navButton}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Week day headers */}
          <View style={styles.weekDaysRow}>
            {weekDays.map((day) => (
              <View key={day} style={styles.weekDayCell}>
                <Text style={styles.weekDayText}>{day}</Text>
              </View>
            ))}
          </View>

          {/* Calendar grid */}
          <View style={styles.calendarGrid}>
            {days.map((date, index) => {
              const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
              const isToday =
                date.toDateString() === new Date().toDateString();
              const isPast = date < new Date();
              const bgColor = getAvailabilityColor(date);
              const availability = getDateAvailability(date);

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayCell,
                    { backgroundColor: bgColor },
                    isToday && styles.todayCell,
                  ]}
                  onPress={() => handleDateTap(date)}
                  disabled={!isCurrentMonth || isPast}
                >
                  <Text
                    style={[
                      styles.dayText,
                      !isCurrentMonth && styles.dayTextFaded,
                      isPast && styles.dayTextDisabled,
                      bgColor !== 'transparent' && styles.dayTextSelected,
                    ]}
                  >
                    {date.getDate()}
                  </Text>
                  
                  {/* Availability count in results mode */}
                  {mode === 'results' && isDateProposed(date) && availability > 0 && (
                    <Text style={styles.availabilityCount}>
                      {availability}/{poll?.memberCount}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Legend for results mode */}
        {mode === 'results' && (
          <View style={styles.legend}>
            <Text style={styles.legendTitle}>Availability Legend</Text>
            <View style={styles.legendRow}>
              <View style={[styles.legendColor, { backgroundColor: '#2ECC71' }]} />
              <Text style={styles.legendText}>All members available</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.legendColor, { backgroundColor: '#A8E6CF' }]} />
              <Text style={styles.legendText}>≥ 75% available</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.legendColor, { backgroundColor: '#FFE66D' }]} />
              <Text style={styles.legendText}>≥ 50% available</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.legendColor, { backgroundColor: '#CCCCCC' }]} />
              <Text style={styles.legendText}>{'< 50% available'}</Text>
            </View>
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
  saveButton: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  content: {
    flex: 1,
  },
  instructions: {
    padding: 16,
    backgroundColor: Colors.surfaceAlt,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  instructionText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeight.normal * Typography.fontSize.sm,
  },
  countBadge: {
    padding: 12,
    alignItems: 'center',
  },
  countText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary,
  },
  calendar: {
    padding: 16,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  navButton: {
    fontSize: 32,
    color: Colors.primary,
    paddingHorizontal: 16,
  },
  monthName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  weekDaysRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekDayText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textSecondary,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    position: 'relative',
  },
  todayCell: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  dayText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
  },
  dayTextFaded: {
    opacity: 0.3,
  },
  dayTextDisabled: {
    opacity: 0.3,
    textDecorationLine: 'line-through',
  },
  dayTextSelected: {
    color: Colors.surface,
    fontWeight: Typography.fontWeight.bold,
  },
  availabilityCount: {
    position: 'absolute',
    bottom: 2,
    fontSize: Typography.fontSize.xs,
    color: Colors.surface,
    fontWeight: Typography.fontWeight.bold,
  },
  legend: {
    padding: 16,
    backgroundColor: Colors.surfaceAlt,
    margin: 16,
    borderRadius: 8,
  },
  legendTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendColor: {
    width: 24,
    height: 24,
    borderRadius: 4,
    marginRight: 12,
  },
  legendText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
});
