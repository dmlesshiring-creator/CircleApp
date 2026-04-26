import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  increment,
  GeoPoint,
} from 'firebase/firestore';
import { firestore, auth } from './firebase';
import { OpenCircle } from '../types/circle.types';

/**
 * Feed Service
 * 
 * Handles Open Discovery feed operations
 */

/**
 * Get Open Circles for feed
 */
export const getOpenCircles = async (filters?: {
  category?: 'transit' | 'interest' | 'neighborhood';
  searchQuery?: string;
  location?: { latitude: number; longitude: number };
  maxDistance?: number; // in km
}): Promise<{ success: boolean; circles?: OpenCircle[]; error?: string }> => {
  try {
    let q = query(
      collection(firestore, 'openCircles'),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    // Apply category filter
    if (filters?.category) {
      q = query(
        collection(firestore, 'openCircles'),
        where('isActive', '==', true),
        where('category', '==', filters.category),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
    }

    const snapshot = await getDocs(q);
    let circles: OpenCircle[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as OpenCircle[];

    // Apply search filter (client-side)
    if (filters?.searchQuery) {
      const searchLower = filters.searchQuery.toLowerCase();
      circles = circles.filter(
        (circle) =>
          circle.name.toLowerCase().includes(searchLower) ||
          circle.description?.toLowerCase().includes(searchLower) ||
          circle.transitRoute?.toLowerCase().includes(searchLower)
      );
    }

    // Apply location filter (client-side)
    if (filters?.location && filters?.maxDistance) {
      circles = circles.filter((circle) => {
        if (!circle.location) return false;

        const distance = calculateDistance(
          filters.location!.latitude,
          filters.location!.longitude,
          circle.location.latitude,
          circle.location.longitude
        );

        return distance <= filters.maxDistance!;
      });
    }

    return { success: true, circles };
  } catch (error: any) {
    console.error('Get open circles error:', error);
    return { success: false, error: 'Failed to load circles' };
  }
};

/**
 * Get promoted cards for feed
 */
export const getPromotedCards = async (): Promise<{
  success: boolean;
  cards?: any[];
  error?: string;
}> => {
  try {
    const q = query(
      collection(firestore, 'promotedCards'),
      where('isActive', '==', true),
      where('endDate', '>', new Date()),
      orderBy('endDate', 'asc'),
      limit(10)
    );

    const snapshot = await getDocs(q);
    const cards = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return { success: true, cards };
  } catch (error: any) {
    console.error('Get promoted cards error:', error);
    return { success: false, error: 'Failed to load promoted cards' };
  }
};

/**
 * Create Open Circle
 */
export const createOpenCircle = async (data: {
  name: string;
  description?: string;
  category: 'transit' | 'interest' | 'neighborhood';
  transitMode?: 'train' | 'flight' | 'bus';
  transitRoute?: string;
  transitDate?: string;
  interests?: string[];
  location?: GeoPoint;
  locationName?: string;
  maxMembers?: number;
}): Promise<{ success: boolean; circleId?: string; error?: string }> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('No user logged in');

    const circleData = {
      ...data,
      creatorUid: currentUser.uid,
      members: [currentUser.uid],
      memberCount: 1,
      pendingRequests: [],
      isActive: true,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(firestore, 'openCircles'), circleData);

    console.log('Open circle created:', docRef.id);

    return { success: true, circleId: docRef.id };
  } catch (error: any) {
    console.error('Create open circle error:', error);
    return { success: false, error: 'Failed to create circle' };
  }
};

/**
 * Join Open Circle
 */
export const joinOpenCircle = async (
  circleId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('No user logged in');

    const circleRef = doc(firestore, `openCircles/${circleId}`);
    const circleDoc = await getDoc(circleRef);

    if (!circleDoc.exists()) {
      return { success: false, error: 'Circle not found' };
    }

    const circleData = circleDoc.data() as OpenCircle;

    // Check if already a member
    if (circleData.members.includes(currentUser.uid)) {
      return { success: false, error: 'Already a member' };
    }

    // Check if max members reached
    if (circleData.maxMembers && circleData.memberCount >= circleData.maxMembers) {
      return { success: false, error: 'Circle is full' };
    }

    // Add user to members
    await updateDoc(circleRef, {
      members: [...circleData.members, currentUser.uid],
      memberCount: increment(1),
    });

    console.log('Joined open circle:', circleId);

    return { success: true };
  } catch (error: any) {
    console.error('Join open circle error:', error);
    return { success: false, error: 'Failed to join circle' };
  }
};

/**
 * Request to join Open Circle
 */
export const requestToJoinOpenCircle = async (
  circleId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('No user logged in');

    const circleRef = doc(firestore, `openCircles/${circleId}`);
    const circleDoc = await getDoc(circleRef);

    if (!circleDoc.exists()) {
      return { success: false, error: 'Circle not found' };
    }

    const circleData = circleDoc.data() as OpenCircle;

    // Check if already requested
    if (circleData.pendingRequests?.includes(currentUser.uid)) {
      return { success: false, error: 'Request already sent' };
    }

    // Add user to pending requests
    await updateDoc(circleRef, {
      pendingRequests: [...(circleData.pendingRequests || []), currentUser.uid],
    });

    console.log('Requested to join open circle:', circleId);

    return { success: true };
  } catch (error: any) {
    console.error('Request to join error:', error);
    return { success: false, error: 'Failed to send request' };
  }
};

/**
 * Leave Open Circle
 */
export const leaveOpenCircle = async (
  circleId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('No user logged in');

    const circleRef = doc(firestore, `openCircles/${circleId}`);
    const circleDoc = await getDoc(circleRef);

    if (!circleDoc.exists()) {
      return { success: false, error: 'Circle not found' };
    }

    const circleData = circleDoc.data() as OpenCircle;

    // Remove user from members
    const updatedMembers = circleData.members.filter((uid) => uid !== currentUser.uid);

    // If creator leaves and there are other members, transfer ownership
    if (circleData.creatorUid === currentUser.uid && updatedMembers.length > 0) {
      await updateDoc(circleRef, {
        members: updatedMembers,
        memberCount: increment(-1),
        creatorUid: updatedMembers[0], // Transfer to first member
      });
    } else if (updatedMembers.length === 0) {
      // If last member, delete circle
      await deleteDoc(circleRef);
    } else {
      await updateDoc(circleRef, {
        members: updatedMembers,
        memberCount: increment(-1),
      });
    }

    console.log('Left open circle:', circleId);

    return { success: true };
  } catch (error: any) {
    console.error('Leave open circle error:', error);
    return { success: false, error: 'Failed to leave circle' };
  }
};

/**
 * Report Open Circle
 */
export const reportOpenCircle = async (
  circleId: string,
  reason: 'spam' | 'inappropriate' | 'misleading' | 'harassment',
  details?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('No user logged in');

    await addDoc(collection(firestore, 'reports'), {
      type: 'open_circle',
      targetId: circleId,
      reporterUid: currentUser.uid,
      reason,
      details,
      status: 'pending',
      createdAt: serverTimestamp(),
    });

    // Increment report count
    const circleRef = doc(firestore, `openCircles/${circleId}`);
    await updateDoc(circleRef, {
      reportCount: increment(1),
    });

    console.log('Reported open circle:', circleId);

    return { success: true };
  } catch (error: any) {
    console.error('Report circle error:', error);
    return { success: false, error: 'Failed to report circle' };
  }
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}
