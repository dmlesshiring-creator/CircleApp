import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { firestore, auth } from '../../services/firebase';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';

export interface Poll {
  id: string;
  circleId: string;
  question: string;
  type: 'single' | 'multiple' | 'star';
  options: PollOption[];
  creatorUid: string;
  createdAt: number;
  isClosed: boolean;
}

export interface PollOption {
  id: string;
  text: string;
  votes: string[]; // array of uids
}

interface PollCardProps {
  pollId: string;
  circleId: string;
}

/**
 * Poll Card Component
 * 
 * Displays interactive poll in chat with real-time vote updates
 */
export const PollCard: React.FC<PollCardProps> = ({ pollId, circleId }) => {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStars, setSelectedStars] = useState(0);
  const currentUid = auth.currentUser?.uid;

  useEffect(() => {
    // Real-time listener for poll updates
    const pollRef = doc(firestore, `circles/${circleId}/polls/${pollId}`);
    
    const unsubscribe = onSnapshot(
      pollRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setPoll({
            id: snapshot.id,
            ...snapshot.data(),
          } as Poll);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching poll:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [pollId, circleId]);

  const handleVote = async (optionId: string) => {
    if (!poll || !currentUid || poll.isClosed) return;

    try {
      const pollRef = doc(firestore, `circles/${circleId}/polls/${pollId}`);
      const option = poll.options.find((opt) => opt.id === optionId);
      
      if (!option) return;

      const hasVoted = option.votes.includes(currentUid);

      if (poll.type === 'single') {
        // Single choice: remove from all options, add to selected
        const updatedOptions = poll.options.map((opt) => ({
          ...opt,
          votes: opt.id === optionId
            ? hasVoted
              ? opt.votes.filter((uid) => uid !== currentUid)
              : [...opt.votes, currentUid]
            : opt.votes.filter((uid) => uid !== currentUid),
        }));

        await updateDoc(pollRef, { options: updatedOptions });
      } else if (poll.type === 'multiple') {
        // Multiple choice: toggle vote on this option
        const updatedOptions = poll.options.map((opt) =>
          opt.id === optionId
            ? {
                ...opt,
                votes: hasVoted
                  ? opt.votes.filter((uid) => uid !== currentUid)
                  : [...opt.votes, currentUid],
              }
            : opt
        );

        await updateDoc(pollRef, { options: updatedOptions });
      }
    } catch (error) {
      console.error('Error voting:', error);
      Alert.alert('Error', 'Failed to submit vote');
    }
  };

  const handleStarVote = async (stars: number) => {
    if (!poll || !currentUid || poll.isClosed) return;

    try {
      const pollRef = doc(firestore, `circles/${circleId}/polls/${pollId}`);
      
      // Find or create option for this star rating
      const optionId = `star_${stars}`;
      let updatedOptions = [...poll.options];
      
      const existingOption = updatedOptions.find((opt) => opt.id === optionId);
      
      if (existingOption) {
        // Remove user from all star options, add to selected
        updatedOptions = updatedOptions.map((opt) => ({
          ...opt,
          votes: opt.id === optionId
            ? [...opt.votes.filter((uid) => uid !== currentUid), currentUid]
            : opt.votes.filter((uid) => uid !== currentUid),
        }));
      } else {
        // Create new option for this star rating
        updatedOptions = updatedOptions.map((opt) => ({
          ...opt,
          votes: opt.votes.filter((uid) => uid !== currentUid),
        }));
        
        updatedOptions.push({
          id: optionId,
          text: `${stars} stars`,
          votes: [currentUid],
        });
      }

      await updateDoc(pollRef, { options: updatedOptions });
      setSelectedStars(stars);
    } catch (error) {
      console.error('Error voting:', error);
      Alert.alert('Error', 'Failed to submit rating');
    }
  };

  const handleClosePoll = async () => {
    if (!poll || !currentUid || poll.creatorUid !== currentUid) return;

    Alert.alert(
      'Close Poll',
      'Are you sure you want to close this poll? No more votes will be accepted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Close Poll',
          style: 'destructive',
          onPress: async () => {
            try {
              const pollRef = doc(firestore, `circles/${circleId}/polls/${pollId}`);
              await updateDoc(pollRef, { isClosed: true });

              // TODO: Post system message with results
            } catch (error) {
              console.error('Error closing poll:', error);
              Alert.alert('Error', 'Failed to close poll');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading poll...</Text>
      </View>
    );
  }

  if (!poll) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Poll not found</Text>
      </View>
    );
  }

  const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes.length, 0);
  const userHasVoted = poll.options.some((opt) => opt.votes.includes(currentUid || ''));
  const isCreator = poll.creatorUid === currentUid;

  // Star rating calculations
  if (poll.type === 'star') {
    const starVotes = poll.options.reduce((sum, opt) => sum + opt.votes.length, 0);
    const starSum = poll.options.reduce((sum, opt) => {
      const stars = parseInt(opt.id.replace('star_', ''));
      return sum + stars * opt.votes.length;
    }, 0);
    const averageStars = starVotes > 0 ? starSum / starVotes : 0;

    // Find user's vote
    const userStarVote = poll.options.find((opt) => opt.votes.includes(currentUid || ''));
    const userStars = userStarVote ? parseInt(userStarVote.id.replace('star_', '')) : 0;

    return (
      <View style={styles.container}>
        <Text style={styles.question}>{poll.question}</Text>
        
        {poll.isClosed && (
          <View style={styles.closedBadge}>
            <Text style={styles.closedText}>Poll Closed</Text>
          </View>
        )}

        {/* Star rating input */}
        {!poll.isClosed && (
          <View style={styles.starContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => handleStarVote(star)}
                style={styles.starButton}
              >
                <Text style={styles.starIcon}>
                  {star <= (userStars || selectedStars) ? '⭐' : '☆'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Results */}
        {(userHasVoted || poll.isClosed) && (
          <View style={styles.starResults}>
            <Text style={styles.averageStars}>
              ⭐ {averageStars.toFixed(1)} / 5
            </Text>
            <Text style={styles.voteCount}>({starVotes} votes)</Text>

            {/* Distribution bars */}
            <View style={styles.distributionContainer}>
              {[5, 4, 3, 2, 1].map((stars) => {
                const option = poll.options.find((opt) => opt.id === `star_${stars}`);
                const votes = option?.votes.length || 0;
                const percentage = starVotes > 0 ? (votes / starVotes) * 100 : 0;

                return (
                  <View key={stars} style={styles.distributionRow}>
                    <Text style={styles.distributionLabel}>{stars}★</Text>
                    <View style={styles.distributionBarContainer}>
                      <View
                        style={[
                          styles.distributionBar,
                          { width: `${percentage}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.distributionCount}>{votes}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Close poll button */}
        {isCreator && !poll.isClosed && (
          <TouchableOpacity style={styles.closeButton} onPress={handleClosePoll}>
            <Text style={styles.closeButtonText}>Close Poll</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Choice polls (single/multiple)
  return (
    <View style={styles.container}>
      <Text style={styles.question}>{poll.question}</Text>
      
      {poll.isClosed && (
        <View style={styles.closedBadge}>
          <Text style={styles.closedText}>Poll Closed</Text>
        </View>
      )}

      <View style={styles.optionsContainer}>
        {poll.options.map((option) => {
          const voteCount = option.votes.length;
          const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
          const userVoted = option.votes.includes(currentUid || '');

          return (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionRow,
                userVoted && styles.optionRowVoted,
                poll.isClosed && styles.optionRowDisabled,
              ]}
              onPress={() => handleVote(option.id)}
              disabled={poll.isClosed}
            >
              {/* Progress bar background */}
              {(userHasVoted || poll.isClosed) && (
                <View
                  style={[
                    styles.progressBar,
                    { width: `${percentage}%` },
                  ]}
                />
              )}

              {/* Option content */}
              <View style={styles.optionContent}>
                <Text style={styles.optionText}>{option.text}</Text>
                
                <View style={styles.optionRight}>
                  {(userHasVoted || poll.isClosed) && (
                    <Text style={styles.percentageText}>{percentage.toFixed(0)}%</Text>
                  )}
                  {userVoted && <Text style={styles.checkmark}>✓</Text>}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Total votes */}
      <Text style={styles.totalVotes}>
        {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
      </Text>

      {/* Close poll button */}
      {isCreator && !poll.isClosed && (
        <TouchableOpacity style={styles.closeButton} onPress={handleClosePoll}>
          <Text style={styles.closeButtonText}>Close Poll</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
  },
  loadingText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  errorText: {
    fontSize: Typography.fontSize.md,
    color: Colors.error,
    textAlign: 'center',
  },
  question: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  closedBadge: {
    backgroundColor: Colors.textTertiary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  closedText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.surface,
    fontWeight: Typography.fontWeight.semibold,
  },
  optionsContainer: {
    gap: 8,
  },
  optionRow: {
    position: 'relative',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.border,
    overflow: 'hidden',
    minHeight: 48,
  },
  optionRowVoted: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  optionRowDisabled: {
    opacity: 0.7,
  },
  progressBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: Colors.primary,
    opacity: 0.2,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 1,
  },
  optionText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    flex: 1,
  },
  optionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  percentageText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.semibold,
  },
  checkmark: {
    fontSize: 18,
    color: Colors.primary,
  },
  totalVotes: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: 12,
    textAlign: 'center',
  },
  closeButton: {
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  closeButtonText: {
    fontSize: Typography.fontSize.md,
    color: Colors.error,
    fontWeight: Typography.fontWeight.semibold,
    textAlign: 'center',
  },
  starContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginVertical: 16,
  },
  starButton: {
    padding: 4,
  },
  starIcon: {
    fontSize: 36,
  },
  starResults: {
    marginTop: 16,
  },
  averageStars: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  voteCount: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  distributionContainer: {
    gap: 8,
  },
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  distributionLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    width: 30,
  },
  distributionBarContainer: {
    flex: 1,
    height: 20,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  distributionBar: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  distributionCount: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    width: 30,
    textAlign: 'right',
  },
});
