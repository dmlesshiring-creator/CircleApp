import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Modal,
} from 'react-native';
import { doc, getDoc } from 'firebase/firestore';
import { firestore, auth } from '../../services/firebase';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import {
  leaveCircle,
  promoteMemberToAdmin,
} from '../../services/safety.service';

interface Member {
  uid: string;
  name: string;
  role: 'admin' | 'member';
}

interface CircleSettingsScreenProps {
  route: {
    params: {
      circleId: string;
    };
  };
  navigation: any;
}

/**
 * Promote Member Modal
 */
const PromoteMemberModal: React.FC<{
  visible: boolean;
  members: Member[];
  onClose: () => void;
  onPromote: (uid: string) => void;
}> = ({ visible, members, onClose, onPromote }) => {
  // Filter out admins
  const nonAdminMembers = members.filter((m) => m.role !== 'admin');

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.promoteModal}>
          <Text style={styles.promoteModalTitle}>Promote a Member</Text>
          <Text style={styles.promoteModalSubtitle}>
            Choose someone to make admin before you leave
          </Text>

          <ScrollView style={styles.memberList}>
            {nonAdminMembers.map((member) => (
              <TouchableOpacity
                key={member.uid}
                style={styles.memberItem}
                onPress={() => onPromote(member.uid)}
              >
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberAvatarText}>
                    {member.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.memberName}>{member.name}</Text>
                <Text style={styles.promoteButton}>Make Admin</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

/**
 * Circle Settings Screen
 */
export default function CircleSettingsScreen({
  route,
  navigation,
}: CircleSettingsScreenProps) {
  const { circleId } = route.params;
  const currentUid = auth.currentUser?.uid;

  const [members, setMembers] = useState<Member[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOnlyAdmin, setIsOnlyAdmin] = useState(false);
  const [promoteModalVisible, setPromoteModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCircleData();
  }, [circleId, currentUid]);

  const loadCircleData = async () => {
    try {
      const circleDoc = await getDoc(doc(firestore, `circles/${circleId}`));
      
      if (circleDoc.exists()) {
        const circleData = circleDoc.data();
        const memberList: Member[] = circleData.members || [];
        
        setMembers(memberList);

        // Check if current user is admin
        const currentMember = memberList.find((m) => m.uid === currentUid);
        const userIsAdmin = currentMember?.role === 'admin';
        setIsAdmin(userIsAdmin);

        // Check if user is the only admin
        const admins = memberList.filter((m) => m.role === 'admin');
        const onlyAdmin = admins.length === 1 && admins[0].uid === currentUid;
        setIsOnlyAdmin(onlyAdmin);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading circle data:', error);
      setLoading(false);
    }
  };

  const handleLeaveCircle = async () => {
    if (!currentUid) return;

    // If only admin and other members exist, show promote modal
    if (isOnlyAdmin && members.length > 1) {
      setPromoteModalVisible(true);
      return;
    }

    // Confirm leave
    Alert.alert(
      'Leave Circle',
      'Are you sure you want to leave this circle?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            const result = await leaveCircle(currentUid, circleId);
            
            if (result.success) {
              Alert.alert('Success', 'You have left the circle');
              navigation.navigate('HomeScreen');
            } else {
              Alert.alert('Error', result.error || 'Failed to leave circle');
            }
          },
        },
      ]
    );
  };

  const handlePromoteMember = async (targetUid: string) => {
    if (!currentUid) return;

    setPromoteModalVisible(false);

    try {
      // Promote member
      const result = await promoteMemberToAdmin(currentUid, targetUid, circleId);
      
      if (result.success) {
        // Now leave the circle
        const leaveResult = await leaveCircle(currentUid, circleId);
        
        if (leaveResult.success) {
          Alert.alert('Success', 'Member promoted and you have left the circle');
          navigation.navigate('HomeScreen');
        } else {
          Alert.alert('Error', leaveResult.error || 'Failed to leave circle');
        }
      } else {
        Alert.alert('Error', result.error || 'Failed to promote member');
      }
    } catch (error) {
      console.error('Error promoting member:', error);
      Alert.alert('Error', 'Failed to promote member');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Circle Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Circle Settings</Text>
          
          {/* Placeholder for other settings */}
          <TouchableOpacity style={styles.settingRow}>
            <Text style={styles.settingLabel}>Circle Name</Text>
            <Text style={styles.settingValue}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow}>
            <Text style={styles.settingLabel}>Circle Photo</Text>
            <Text style={styles.settingValue}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow}>
            <Text style={styles.settingLabel}>Notifications</Text>
            <Text style={styles.settingValue}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Members Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Members ({members.length})</Text>
          
          {members.map((member) => (
            <View key={member.uid} style={styles.memberRow}>
              <View style={styles.memberAvatar}>
                <Text style={styles.memberAvatarText}>
                  {member.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{member.name}</Text>
                {member.role === 'admin' && (
                  <Text style={styles.adminBadge}>Admin</Text>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Danger Zone */}
        <View style={styles.dangerSection}>
          <Text style={styles.sectionTitle}>Danger Zone</Text>
          
          {isOnlyAdmin && members.length > 1 ? (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                ⚠️ You're the only admin. Promote someone before leaving.
              </Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={styles.leaveButton}
            onPress={handleLeaveCircle}
          >
            <Text style={styles.leaveButtonText}>Leave Circle</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Promote member modal */}
      <PromoteMemberModal
        visible={promoteModalVisible}
        members={members}
        onClose={() => setPromoteModalVisible(false)}
        onPromote={handlePromoteMember}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  section: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textSecondary,
    paddingHorizontal: 16,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  settingLabel: {
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
  },
  settingValue: {
    fontSize: Typography.fontSize.lg,
    color: Colors.textTertiary,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberAvatarText: {
    fontSize: 18,
    color: Colors.surface,
    fontWeight: Typography.fontWeight.bold,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.semibold,
  },
  adminBadge: {
    fontSize: Typography.fontSize.xs,
    color: Colors.primary,
    marginTop: 2,
  },
  dangerSection: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  warningBox: {
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  warningText: {
    fontSize: Typography.fontSize.sm,
    color: '#856404',
    lineHeight: Typography.lineHeight.normal * Typography.fontSize.sm,
  },
  leaveButton: {
    backgroundColor: Colors.error,
    borderRadius: 8,
    paddingVertical: 16,
  },
  leaveButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.surface,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  promoteModal: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  promoteModalTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  promoteModalSubtitle: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    marginBottom: 24,
  },
  memberList: {
    maxHeight: 400,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  promoteButton: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary,
  },
  cancelButton: {
    paddingVertical: 16,
    marginTop: 16,
  },
  cancelButtonText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
