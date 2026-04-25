import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { firestore, auth } from '../../services/firebase';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { ScreenLayout } from '../../components/shared/ScreenLayout';

interface Member {
  uid: string;
  name: string;
  photoUrl?: string;
  role: 'admin' | 'member';
  joinedAt: number;
}

interface CircleMembersScreenProps {
  route: {
    params: {
      circleId: string;
      circleName?: string;
    };
  };
  navigation: any;
}

/**
 * CircleMembersScreen - View and manage circle members
 */
export default function CircleMembersScreen({
  route,
  navigation,
}: CircleMembersScreenProps) {
  const { circleId, circleName } = route.params;
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const currentUid = auth.currentUser?.uid;

  useEffect(() => {
    loadMembers();
  }, [circleId]);

  const loadMembers = async () => {
    try {
      const circleRef = doc(firestore, 'circles', circleId);
      const circleSnap = await getDoc(circleRef);

      if (circleSnap.exists()) {
        const circleData = circleSnap.data();
        const membersList = circleData.members || [];

        // Check if current user is admin
        const currentMember = membersList.find((m: Member) => m.uid === currentUid);
        setIsAdmin(currentMember?.role === 'admin');

        setMembers(membersList);
      }
    } catch (error) {
      console.error('Error loading members:', error);
      Alert.alert('Error', 'Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  const handlePromoteToAdmin = async (memberUid: string) => {
    if (!isAdmin) {
      Alert.alert('Permission Denied', 'Only admins can promote members');
      return;
    }

    Alert.alert(
      'Promote to Admin',
      'Are you sure you want to make this member an admin?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Promote',
          onPress: async () => {
            try {
              const circleRef = doc(firestore, 'circles', circleId);
              const updatedMembers = members.map((m) =>
                m.uid === memberUid ? { ...m, role: 'admin' as const } : m
              );

              await updateDoc(circleRef, {
                members: updatedMembers,
              });

              setMembers(updatedMembers);
              Alert.alert('Success', 'Member promoted to admin');
            } catch (error) {
              console.error('Error promoting member:', error);
              Alert.alert('Error', 'Failed to promote member');
            }
          },
        },
      ]
    );
  };

  const handleRemoveMember = async (memberUid: string) => {
    if (!isAdmin) {
      Alert.alert('Permission Denied', 'Only admins can remove members');
      return;
    }

    Alert.alert(
      'Remove Member',
      'Are you sure you want to remove this member from the circle?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const circleRef = doc(firestore, 'circles', circleId);
              const updatedMembers = members.filter((m) => m.uid !== memberUid);

              await updateDoc(circleRef, {
                members: updatedMembers,
              });

              setMembers(updatedMembers);
              Alert.alert('Success', 'Member removed from circle');
            } catch (error) {
              console.error('Error removing member:', error);
              Alert.alert('Error', 'Failed to remove member');
            }
          },
        },
      ]
    );
  };

  const renderMemberItem = ({ item }: { item: Member }) => {
    const isCurrentUser = item.uid === currentUid;

    return (
      <TouchableOpacity
        style={styles.memberItem}
        onPress={() => {
          if (isAdmin && !isCurrentUser) {
            Alert.alert(
              item.name,
              'Choose an action',
              [
                { text: 'Cancel', style: 'cancel' },
                ...(item.role !== 'admin'
                  ? [
                      {
                        text: 'Promote to Admin',
                        onPress: () => handlePromoteToAdmin(item.uid),
                      },
                    ]
                  : []),
                {
                  text: 'Remove from Circle',
                  style: 'destructive' as const,
                  onPress: () => handleRemoveMember(item.uid),
                },
              ]
            );
          }
        }}
      >
        {/* Avatar */}
        <View style={styles.avatar}>
          {item.photoUrl ? (
            <Image source={{ uri: item.photoUrl }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {item.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        {/* Member Info */}
        <View style={styles.memberInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.memberName}>{item.name}</Text>
            {isCurrentUser && <Text style={styles.youBadge}>You</Text>}
          </View>
          <Text style={styles.memberRole}>
            {item.role === 'admin' ? '👑 Admin' : 'Member'}
          </Text>
        </View>

        {/* Action Indicator */}
        {isAdmin && !isCurrentUser && (
          <Text style={styles.actionIndicator}>⋮</Text>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <ScreenLayout>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading members...</Text>
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {members.length} {members.length === 1 ? 'Member' : 'Members'}
          </Text>
          {circleName && (
            <Text style={styles.headerSubtitle}>{circleName}</Text>
          )}
        </View>

        {/* Members List */}
        <FlatList
          data={members}
          keyExtractor={(item) => item.uid}
          renderItem={renderMemberItem}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
  },
  header: {
    padding: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold as any,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  listContent: {
    paddingVertical: 8,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold as any,
    color: Colors.surface,
  },
  memberInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  memberName: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.textPrimary,
    marginRight: 8,
  },
  youBadge: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.primary,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  memberRole: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  actionIndicator: {
    fontSize: Typography.fontSize.xl,
    color: Colors.textTertiary,
    paddingHorizontal: 8,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 76,
  },
});
