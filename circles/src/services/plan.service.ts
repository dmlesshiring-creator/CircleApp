import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, push, set } from 'firebase/database';
import { firestore, realtimeDb, auth } from './firebase';
import { Plan, PlanType } from '../types/plan.types';

/**
 * Plan Service
 * 
 * Handles plan CRUD operations
 */

/**
 * Create a plan
 */
export const createPlan = async (data: {
  circleId: string;
  title: string;
  description?: string;
  type: PlanType;
  date: string;
  time?: string;
  location?: string;
  restaurant?: string;
  movie?: string;
  destination?: string;
  budget?: number;
}): Promise<{ success: boolean; planId?: string; error?: string }> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('No user logged in');

    const planData = {
      ...data,
      creatorUid: currentUser.uid,
      rsvps: {
        going: [currentUser.uid],
        maybe: [],
        cantMakeIt: [],
      },
      createdAt: serverTimestamp(),
      status: 'upcoming',
    };

    const docRef = await addDoc(
      collection(firestore, `circles/${data.circleId}/plans`),
      planData
    );

    // Post plan card to chat
    const messagesRef = ref(realtimeDb, `circles/${data.circleId}/messages`);
    const newMessageRef = push(messagesRef);

    await set(newMessageRef, {
      type: 'plan',
      planId: docRef.id,
      senderId: currentUser.uid,
      createdAt: Date.now(),
    });

    console.log('Plan created:', docRef.id);

    return { success: true, planId: docRef.id };
  } catch (error: any) {
    console.error('Create plan error:', error);
    return { success: false, error: 'Failed to create plan' };
  }
};

/**
 * Get plans for a circle
 */
export const getPlans = async (
  circleId: string,
  status?: 'upcoming' | 'past'
): Promise<{ success: boolean; plans?: Plan[]; error?: string }> => {
  try {
    let q = query(
      collection(firestore, `circles/${circleId}/plans`),
      orderBy('date', 'desc')
    );

    if (status) {
      q = query(
        collection(firestore, `circles/${circleId}/plans`),
        where('status', '==', status),
        orderBy('date', 'desc')
      );
    }

    const snapshot = await getDocs(q);
    const plans: Plan[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Plan[];

    return { success: true, plans };
  } catch (error: any) {
    console.error('Get plans error:', error);
    return { success: false, error: 'Failed to load plans' };
  }
};

/**
 * Get a single plan
 */
export const getPlan = async (
  circleId: string,
  planId: string
): Promise<{ success: boolean; plan?: Plan; error?: string }> => {
  try {
    const planDoc = await getDoc(doc(firestore, `circles/${circleId}/plans/${planId}`));

    if (!planDoc.exists()) {
      return { success: false, error: 'Plan not found' };
    }

    const plan: Plan = {
      id: planDoc.id,
      ...planDoc.data(),
    } as Plan;

    return { success: true, plan };
  } catch (error: any) {
    console.error('Get plan error:', error);
    return { success: false, error: 'Failed to load plan' };
  }
};

/**
 * Update RSVP for a plan
 */
export const updateRSVP = async (
  circleId: string,
  planId: string,
  response: 'going' | 'maybe' | 'cantMakeIt'
): Promise<{ success: boolean; error?: string }> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('No user logged in');

    const planRef = doc(firestore, `circles/${circleId}/plans/${planId}`);
    const planDoc = await getDoc(planRef);

    if (!planDoc.exists()) {
      return { success: false, error: 'Plan not found' };
    }

    const planData = planDoc.data() as Plan;

    // Remove user from all RSVP lists
    const updatedRsvps = {
      going: planData.rsvps.going.filter((uid) => uid !== currentUser.uid),
      maybe: planData.rsvps.maybe.filter((uid) => uid !== currentUser.uid),
      cantMakeIt: planData.rsvps.cantMakeIt.filter((uid) => uid !== currentUser.uid),
    };

    // Add user to selected RSVP list
    updatedRsvps[response].push(currentUser.uid);

    await updateDoc(planRef, {
      rsvps: updatedRsvps,
    });

    console.log('RSVP updated:', planId, response);

    return { success: true };
  } catch (error: any) {
    console.error('Update RSVP error:', error);
    return { success: false, error: 'Failed to update RSVP' };
  }
};

/**
 * Update plan
 */
export const updatePlan = async (
  circleId: string,
  planId: string,
  updates: Partial<Plan>
): Promise<{ success: boolean; error?: string }> => {
  try {
    const planRef = doc(firestore, `circles/${circleId}/plans/${planId}`);

    await updateDoc(planRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });

    console.log('Plan updated:', planId);

    return { success: true };
  } catch (error: any) {
    console.error('Update plan error:', error);
    return { success: false, error: 'Failed to update plan' };
  }
};

/**
 * Delete plan
 */
export const deletePlan = async (
  circleId: string,
  planId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    await deleteDoc(doc(firestore, `circles/${circleId}/plans/${planId}`));

    console.log('Plan deleted:', planId);

    return { success: true };
  } catch (error: any) {
    console.error('Delete plan error:', error);
    return { success: false, error: 'Failed to delete plan' };
  }
};

/**
 * Mark plan as completed
 */
export const completePlan = async (
  circleId: string,
  planId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const planRef = doc(firestore, `circles/${circleId}/plans/${planId}`);

    await updateDoc(planRef, {
      status: 'past',
      completedAt: serverTimestamp(),
    });

    console.log('Plan completed:', planId);

    return { success: true };
  } catch (error: any) {
    console.error('Complete plan error:', error);
    return { success: false, error: 'Failed to complete plan' };
  }
};

/**
 * Get RSVP count for a plan
 */
export const getRSVPCount = (plan: Plan): {
  going: number;
  maybe: number;
  cantMakeIt: number;
  total: number;
} => {
  return {
    going: plan.rsvps.going.length,
    maybe: plan.rsvps.maybe.length,
    cantMakeIt: plan.rsvps.cantMakeIt.length,
    total:
      plan.rsvps.going.length +
      plan.rsvps.maybe.length +
      plan.rsvps.cantMakeIt.length,
  };
};

/**
 * Check if user has RSVP'd
 */
export const getUserRSVP = (
  plan: Plan,
  userId: string
): 'going' | 'maybe' | 'cantMakeIt' | null => {
  if (plan.rsvps.going.includes(userId)) return 'going';
  if (plan.rsvps.maybe.includes(userId)) return 'maybe';
  if (plan.rsvps.cantMakeIt.includes(userId)) return 'cantMakeIt';
  return null;
};

/**
 * Get upcoming plans across all circles
 */
export const getUpcomingPlans = async (
  circleIds: string[]
): Promise<{ success: boolean; plans?: Plan[]; error?: string }> => {
  try {
    const allPlans: Plan[] = [];

    // Fetch plans from all circles
    await Promise.all(
      circleIds.map(async (circleId) => {
        const result = await getPlans(circleId, 'upcoming');
        if (result.success && result.plans) {
          allPlans.push(...result.plans);
        }
      })
    );

    // Sort by date
    allPlans.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return { success: true, plans: allPlans };
  } catch (error: any) {
    console.error('Get upcoming plans error:', error);
    return { success: false, error: 'Failed to load plans' };
  }
};
