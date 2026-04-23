import {
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  arrayRemove,
  arrayUnion,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, push, set } from 'firebase/database';
import { firestore, realtimeDb, auth } from './firebase';
import { Alert } from 'react-native';

/**
 * Safety Service
 * 
 * Handles blocking, leaving circles, and admin moderation
 */

/**
 * Block a user
 * 
 * Blocked users cannot join circles created by the blocker
 * Blocker won't see messages from blocked user
 */
export const blockUser = async (
  blockerUid: string,
  blockedUid: string
): Promise<void> => {
  try {
    // Write to blocker's blocked list
    await setDoc(
      doc(firestore, `users/${blockerUid}/blocked/${blockedUid}`),
      {
        blockedAt: Date.now(),
        blockedAtServer: serverTimestamp(),
      }
    );

    console.log(`User ${blockedUid} blocked by ${blockerUid}`);
  } catch (error) {
    console.error('Error blocking user:', error);
    throw error;
  }
};

/**
 * Unblock a user
 */
export const unblockUser = async (
  blockerUid: string,
  blockedUid: string
): Promise<void> => {
  try {
    await deleteDoc(doc(firestore, `users/${blockerUid}/blocked/${blockedUid}`));
    console.log(`User ${blockedUid} unblocked by ${blockerUid}`);
  } catch (error) {
    console.error('Error unblocking user:', error);
    throw error;
  }
};

/**
 * Check if a user is blocked
 */
export const isUserBlocked = async (
  blockerUid: string,
  blockedUid: string
): Promise<boolean> => {
  try {
    const blockDoc = await getDoc(
      doc(firestore, `users/${blockerUid}/blocked/${blockedUid}`)
    );
    return blockDoc.exists();
  } catch (error) {
    console.error('Error checking if user is blocked:', error);
    return false;
  }
};

/**
 * Get list of blocked users
 */
export const getBlockedUsers = async (uid: string): Promise<string[]> => {
  try {
    const blockedRef = collection(firestore, `users/${uid}/blocked`);
    const snapshot = await getDocs(blockedRef);
    
    return snapshot.docs.map((doc) => doc.id);
  } catch (error) {
    console.error('Error getting blocked users:', error);
    return [];
  }
};

/**
 * Check if user can join a circle
 * 
 * Prevents blocked users from joining circles created by blocker
 */
export const canJoinCircle = async (
  userUid: string,
  circleId: string
): Promise<{ canJoin: boolean; reason?: string }> => {
  try {
    // Get circle data
    const circleDoc = await getDoc(doc(firestore, `circles/${circleId}`));
    
    if (!circleDoc.exists()) {
      return { canJoin: false, reason: 'Circle not found' };
    }

    const circleData = circleDoc.data();
    const creatorUid = circleData.creatorUid;

    // Check if creator has blocked this user
    const isBlocked = await isUserBlocked(creatorUid, userUid);
    
    if (isBlocked) {
      return {
        canJoin: false,
        reason: 'You cannot join this circle',
      };
    }

    return { canJoin: true };
  } catch (error) {
    console.error('Error checking if user can join circle:', error);
    return { canJoin: false, reason: 'Error checking permissions' };
  }
};

/**
 * Leave a circle
 * 
 * If user is the only admin, requires promoting another member first
 */
export const leaveCircle = async (
  uid: string,
  circleId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Get circle data
    const circleDoc = await getDoc(doc(firestore, `circles/${circleId}`));
    
    if (!circleDoc.exists()) {
      return { success: false, error: 'Circle not found' };
    }

    const circleData = circleDoc.data();
    const members = circleData.members || [];

    // Find current user's member object
    const userMember = members.find((m: any) => m.uid === uid);
    
    if (!userMember) {
      return { success: false, error: 'You are not a member of this circle' };
    }

    // Check if user is the only admin
    const admins = members.filter((m: any) => m.role === 'admin');
    const isOnlyAdmin = admins.length === 1 && admins[0].uid === uid;

    if (isOnlyAdmin && members.length > 1) {
      return {
        success: false,
        error: 'You are the only admin. Promote someone else before leaving.',
      };
    }

    // Get user's display name
    const userDoc = await getDoc(doc(firestore, `users/${uid}`));
    const userName = userDoc.data()?.displayName || 'Someone';

    // Remove user from members array
    await updateDoc(doc(firestore, `circles/${circleId}`), {
      members: arrayRemove(userMember),
    });

    // Write system message to chat
    const messagesRef = ref(realtimeDb, `circles/${circleId}/messages`);
    const newMessageRef = push(messagesRef);

    await set(newMessageRef, {
      type: 'system',
      text: `${userName} left the circle`,
      createdAt: Date.now(),
      isSystem: true,
    });

    console.log(`User ${uid} left circle ${circleId}`);

    return { success: true };
  } catch (error) {
    console.error('Error leaving circle:', error);
    return { success: false, error: 'Failed to leave circle' };
  }
};

/**
 * Promote a member to admin
 */
export const promoteMemberToAdmin = async (
  adminUid: string,
  targetUid: string,
  circleId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Get circle data
    const circleDoc = await getDoc(doc(firestore, `circles/${circleId}`));
    
    if (!circleDoc.exists()) {
      return { success: false, error: 'Circle not found' };
    }

    const circleData = circleDoc.data();
    const members = circleData.members || [];

    // Verify admin has admin role
    const adminMember = members.find((m: any) => m.uid === adminUid);
    if (!adminMember || adminMember.role !== 'admin') {
      return { success: false, error: 'You are not an admin' };
    }

    // Find target member
    const targetMember = members.find((m: any) => m.uid === targetUid);
    if (!targetMember) {
      return { success: false, error: 'Member not found' };
    }

    // Update member role
    const updatedMembers = members.map((m: any) =>
      m.uid === targetUid ? { ...m, role: 'admin' } : m
    );

    await updateDoc(doc(firestore, `circles/${circleId}`), {
      members: updatedMembers,
    });

    // Write system message
    const messagesRef = ref(realtimeDb, `circles/${circleId}/messages`);
    const newMessageRef = push(messagesRef);

    await set(newMessageRef, {
      type: 'system',
      text: `${targetMember.name} is now an admin`,
      createdAt: Date.now(),
      isSystem: true,
    });

    console.log(`User ${targetUid} promoted to admin in circle ${circleId}`);

    return { success: true };
  } catch (error) {
    console.error('Error promoting member:', error);
    return { success: false, error: 'Failed to promote member' };
  }
};

/**
 * Remove a member from circle (admin only)
 */
export const removeFromCircle = async (
  adminUid: string,
  targetUid: string,
  circleId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Get circle data
    const circleDoc = await getDoc(doc(firestore, `circles/${circleId}`));
    
    if (!circleDoc.exists()) {
      return { success: false, error: 'Circle not found' };
    }

    const circleData = circleDoc.data();
    const members = circleData.members || [];

    // Verify admin has admin role
    const adminMember = members.find((m: any) => m.uid === adminUid);
    if (!adminMember || adminMember.role !== 'admin') {
      return { success: false, error: 'You are not an admin' };
    }

    // Find target member
    const targetMember = members.find((m: any) => m.uid === targetUid);
    if (!targetMember) {
      return { success: false, error: 'Member not found' };
    }

    // Cannot remove yourself
    if (targetUid === adminUid) {
      return { success: false, error: 'Use "Leave Circle" to remove yourself' };
    }

    // If target is admin, demote first
    if (targetMember.role === 'admin') {
      const updatedMembers = members.map((m: any) =>
        m.uid === targetUid ? { ...m, role: 'member' } : m
      );

      await updateDoc(doc(firestore, `circles/${circleId}`), {
        members: updatedMembers,
      });
    }

    // Remove member
    await updateDoc(doc(firestore, `circles/${circleId}`), {
      members: arrayRemove(targetMember),
    });

    // Write system message
    const messagesRef = ref(realtimeDb, `circles/${circleId}/messages`);
    const newMessageRef = push(messagesRef);

    await set(newMessageRef, {
      type: 'system',
      text: `${targetMember.name} was removed from the circle`,
      createdAt: Date.now(),
      isSystem: true,
    });

    console.log(`User ${targetUid} removed from circle ${circleId} by admin ${adminUid}`);

    return { success: true };
  } catch (error) {
    console.error('Error removing member:', error);
    return { success: false, error: 'Failed to remove member' };
  }
};

/**
 * Filter messages for blocked users
 * 
 * Call this when rendering messages to hide blocked user's messages
 */
export const filterMessagesForBlockedUsers = async (
  messages: any[],
  currentUid: string
): Promise<any[]> => {
  try {
    const blockedUsers = await getBlockedUsers(currentUid);
    
    return messages.map((message) => {
      if (blockedUsers.includes(message.senderUid || message.senderId)) {
        return {
          ...message,
          text: 'Message hidden',
          isHidden: true,
        };
      }
      return message;
    });
  } catch (error) {
    console.error('Error filtering messages:', error);
    return messages;
  }
};
