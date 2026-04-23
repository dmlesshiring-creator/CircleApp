import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import {
  collection,
  query,
  where,
  onSnapshot,
  QuerySnapshot,
  DocumentData,
} from 'firebase/firestore';
import { auth, firestore } from '../../services/firebase';
import { useCirclesStore } from '../../store/circles.store';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Routes } from '../../constants/routes';
import { PrivateCircle } from '../../types/circle.types';
import CreateCircleModal from './CreateCircleModal';
import { formatRelativeTime } from '../../utils/dateUtils';
import { ScreenLayout } from '../../components/shared/ScreenLayout';

/**
 * Empty State Component
 */
const EmptyState: React.FC<{
  onCreatePress: () => void;
  onJoinPress: () => void;
}> = ({ onCreatePress, onJoinPress }) => (
  <View
    style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    }}
  >
    {/* Illustration: Three overlapping circles */}
    <View style={{ marginBottom: 32, alignItems: 'center' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', height: 80 }}>
        <View
          style={{
            width: 50,
            height: 50,
            borderRadius: 25,
            backgroundColor: Colors.primary,
            opacity: 0.7,
          }}
        />
        <View
          style={{
            width: 50,
            height: 50,
            borderRadius: 25,
            backgroundColor: Colors.accent,
            opacity: 0.7,
            marginLeft: -20,
          }}
        />
        <View
          style={{
            width: 50,
            height: 50,
            borderRadius: 25,
            backgroundColor: Colors.success,
            opacity: 0.7,
            marginLeft: -20,
          }}
        />
      </View>
    </View>

    {/* Text */}
    <Text
      style={{
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.semibold,
        color: Colors.textPrimary,
        marginBottom: 8,
        textAlign: 'center',
      }}
    >
      You're not in any circles yet
    </Text>

    <Text
      style={{
        fontSize: Typography.fontSize.md,
        color: Colors.textSecondary,
        marginBottom: 32,
        textAlign: 'center',
        lineHeight: Typography.lineHeight.normal * Typography.fontSize.md,
      }}
    >
      Create one for your friends, or join with an invite link
    </Text>

    {/* Create Circle Button */}
    <TouchableOpacity
      onPress={onCreatePress}
      style={{
        backgroundColor: Colors.primary,
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 24,
        marginBottom: 12,
        width: '100%',
        alignItems: 'center',
      }}
    >
      <Text
        style={{
          fontSize: Typography.fontSize.md,
          fontWeight: Typography.fontWeight.semibold,
          color: Colors.surface,
        }}
      >
        Create a Circle
      </Text>
    </TouchableOpacity>

    {/* Join with Link Button */}
    <TouchableOpacity
      onPress={onJoinPress}
      style={{
        borderWidth: 2,
        borderColor: Colors.primary,
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 24,
        width: '100%',
        alignItems: 'center',
      }}
    >
      <Text
        style={{
          fontSize: Typography.fontSize.md,
          fontWeight: Typography.fontWeight.semibold,
          color: Colors.primary,
        }}
      >
        Join with Link
      </Text>
    </TouchableOpacity>
  </View>
);

/**
 * Circle List Item
 */
const CircleListItem: React.FC<{
  circle: PrivateCircle;
  onPress: () => void;
}> = ({ circle, onPress }) => {
  const hasUnread = (circle.unreadCount || 0) > 0;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
      }}
    >
      {/* Circle Photo */}
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: Colors.surfaceAlt,
          marginRight: 12,
          overflow: 'hidden',
        }}
      >
        {circle.photoUrl ? (
          <Image
            source={{ uri: circle.photoUrl }}
            style={{ width: '100%', height: '100%' }}
          />
        ) : (
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: Colors.primary,
            }}
          >
            <Text style={{ fontSize: 24 }}>👥</Text>
          </View>
        )}
      </View>

      {/* Circle Info */}
      <View style={{ flex: 1 }}>
        {/* Name and unread badge */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 4,
          }}
        >
          <Text
            style={{
              fontSize: Typography.fontSize.md,
              fontWeight: Typography.fontWeight.semibold,
              color: Colors.textPrimary,
              flex: 1,
            }}
            numberOfLines={1}
          >
            {circle.name}
          </Text>

          {/* Unread Badge */}
          {hasUnread && (
            <View
              style={{
                backgroundColor: Colors.error,
                borderRadius: 10,
                paddingHorizontal: 8,
                paddingVertical: 2,
                marginLeft: 8,
              }}
            >
              <Text
                style={{
                  color: Colors.surface,
                  fontSize: Typography.fontSize.xs,
                  fontWeight: Typography.fontWeight.semibold,
                }}
              >
                {circle.unreadCount}
              </Text>
            </View>
          )}
        </View>

        {/* Last message and time */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              fontSize: Typography.fontSize.sm,
              color: Colors.textSecondary,
              flex: 1,
            }}
            numberOfLines={1}
          >
            {circle.lastMessagePreview || 'No messages yet'}
          </Text>

          <Text
            style={{
              fontSize: Typography.fontSize.xs,
              color: Colors.textTertiary,
              marginLeft: 8,
            }}
          >
            {circle.lastMessageAt
              ? formatRelativeTime(circle.lastMessageAt)
              : ''}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

/**
 * HomeScreen - User's circles list
 */
export default function HomeScreen({ navigation }: any) {
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const circles = useCirclesStore((state) => state.circles);
  const setCircles = useCirclesStore((state) => state.setCircles);
  const setLoading = useCirclesStore((state) => state.setLoading);
  const setError = useCirclesStore((state) => state.setError);

  /**
   * Set up real-time Firestore listener
   */
  useEffect(() => {
    const currentUid = auth.currentUser?.uid;
    if (!currentUid) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);

    // Query for circles where user is a member
    const circlesRef = collection(firestore, 'circles');
    const q = query(
      circlesRef,
      where('members', 'array-contains', { uid: currentUid })
    );

    // Subscribe to real-time updates
    const unsubscribe = onSnapshot(
      q,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const circlesData: PrivateCircle[] = [];
        snapshot.forEach((doc) => {
          circlesData.push({
            id: doc.id,
            ...doc.data(),
          } as PrivateCircle);
        });

        // Sort by lastMessageAt (most recent first)
        circlesData.sort(
          (a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0)
        );

        setCircles(circlesData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching circles:', error);
        setError(error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [setCircles, setLoading, setError]);

  const handleCircleTap = (circle: PrivateCircle) => {
    navigation.navigate(Routes.CIRCLE_CHAT, {
      circleId: circle.id,
      circleName: circle.name,
    });
  };

  const handleCreatePress = () => {
    setCreateModalVisible(true);
  };

  const handleJoinPress = () => {
    Alert.prompt(
      'Join Circle',
      'Enter the invite code',
      [
        {
          text: 'Cancel',
          onPress: () => {},
          style: 'cancel',
        },
        {
          text: 'Join',
          onPress: (code) => {
            if (code) {
              navigation.navigate(Routes.JOIN_CIRCLE, { inviteCode: code });
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const handleCreateCircleSuccess = (circleId: string, circleName: string) => {
    setCreateModalVisible(false);
    // Navigate to the new circle
    navigation.navigate(Routes.CIRCLE_CHAT, {
      circleId,
      circleName,
    });
  };

  return (
    <ScreenLayout>
      {/* Header with title and create button */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: Colors.border,
          backgroundColor: Colors.surface,
        }}
      >
        <Text
          style={{
            fontSize: Typography.fontSize.xxxl,
            fontWeight: Typography.fontWeight.bold,
            color: Colors.textPrimary,
          }}
        >
          My Circles
        </Text>

        <TouchableOpacity
          onPress={handleCreatePress}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: Colors.accent,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 24, color: Colors.surface }}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {circles.length === 0 ? (
        <EmptyState onCreatePress={handleCreatePress} onJoinPress={handleJoinPress} />
      ) : (
        <FlatList
          data={circles}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <CircleListItem
              circle={item}
              onPress={() => handleCircleTap(item)}
            />
          )}
          contentContainerStyle={{ flexGrow: 1 }}
        />
      )}

      {/* Create Circle Modal */}
      <Modal
        visible={createModalVisible}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <CreateCircleModal
          onClose={() => setCreateModalVisible(false)}
          onSuccess={handleCreateCircleSuccess}
        />
      </Modal>
    </ScreenLayout>
  );
}
