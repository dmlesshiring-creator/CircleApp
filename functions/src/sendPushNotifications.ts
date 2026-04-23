import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';

// Initialize Expo SDK
const expo = new Expo();

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const firestore = admin.firestore();

/**
 * Get all push tokens for a user
 */
const getUserPushTokens = async (uid: string): Promise<string[]> => {
  try {
    const tokensSnapshot = await firestore
      .collection('users')
      .doc(uid)
      .collection('pushTokens')
      .get();

    const tokens: string[] = [];
    tokensSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.token && Expo.isExpoPushToken(data.token)) {
        tokens.push(data.token);
      }
    });

    return tokens;
  } catch (error) {
    console.error('Error getting user push tokens:', error);
    return [];
  }
};

/**
 * Send push notifications to multiple users
 */
const sendPushNotifications = async (
  userIds: string[],
  title: string,
  body: string,
  data: any
): Promise<void> => {
  try {
    const messages: ExpoPushMessage[] = [];

    // Collect all tokens for all users
    for (const uid of userIds) {
      const tokens = await getUserPushTokens(uid);
      
      for (const token of tokens) {
        messages.push({
          to: token,
          sound: 'default',
          title,
          body,
          data,
          priority: 'high',
        });
      }
    }

    // Send notifications in chunks
    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error('Error sending push notification chunk:', error);
      }
    }

    console.log(`Sent ${tickets.length} push notifications`);
  } catch (error) {
    console.error('Error in sendPushNotifications:', error);
    throw error;
  }
};

/**
 * Firestore trigger: Send notification when a new member joins a circle
 */
export const onNewMember = functions.firestore
  .document('circles/{circleId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // Check if members array changed
    const beforeMembers = before.members || [];
    const afterMembers = after.members || [];

    if (afterMembers.length > beforeMembers.length) {
      // New member(s) added
      const newMembers = afterMembers.filter((m: string) => !beforeMembers.includes(m));

      for (const newMemberUid of newMembers) {
        // Get new member's name
        const newMemberDoc = await firestore.collection('users').doc(newMemberUid).get();
        const newMemberName = newMemberDoc.data()?.displayName || 'Someone';

        // Notify all other members
        const otherMembers = afterMembers.filter((m: string) => m !== newMemberUid);

        await sendPushNotifications(
          otherMembers,
          'New Member',
          `${newMemberName} joined your circle`,
          {
            type: 'new_member',
            circleId: context.params.circleId,
            memberName: newMemberName,
          }
        );
      }
    }
  });

/**
 * Firestore trigger: Send notification when a new plan is created
 */
export const onNewPlan = functions.firestore
  .document('circles/{circleId}/plans/{planId}')
  .onCreate(async (snapshot, context) => {
    const plan = snapshot.data();
    const circleId = context.params.circleId;

    // Get circle members
    const circleDoc = await firestore.collection('circles').doc(circleId).get();
    const circle = circleDoc.data();

    if (!circle) return;

    const members = circle.members || [];
    const creatorUid = plan.creatorUid;

    // Notify all members except the creator
    const otherMembers = members.filter((m: string) => m !== creatorUid);

    await sendPushNotifications(
      otherMembers,
      'New Plan',
      `${plan.creatorName} created a plan — ${plan.title}`,
      {
        type: 'new_plan',
        circleId,
        planId: context.params.planId,
        planTitle: plan.title,
        planDate: plan.date,
      }
    );
  });

/**
 * Scheduled function: Send RSVP nudges for plans happening in 3 days
 */
export const sendRSVPNudges = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    try {
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
      const threeDaysFromNowStr = threeDaysFromNow.toISOString().split('T')[0];

      // Query all circles
      const circlesSnapshot = await firestore.collection('circles').get();

      for (const circleDoc of circlesSnapshot.docs) {
        const circleId = circleDoc.id;
        const circle = circleDoc.data();

        // Query plans for this circle happening in 3 days
        const plansSnapshot = await firestore
          .collection('circles')
          .doc(circleId)
          .collection('plans')
          .where('date', '==', threeDaysFromNowStr)
          .where('isArchived', '==', false)
          .get();

        for (const planDoc of plansSnapshot.docs) {
          const plan = planDoc.data();
          const planId = planDoc.id;

          // Find members who haven't RSVP'd
          const members = circle.members || [];
          const rsvps = plan.rsvps || {};
          const noRSVPMembers = members.filter((uid: string) => !rsvps[uid]);

          if (noRSVPMembers.length > 0) {
            await sendPushNotifications(
              noRSVPMembers,
              'RSVP Reminder',
              `Don't forget to RSVP for ${plan.title}`,
              {
                type: 'rsvp_nudge',
                circleId,
                planId,
                planTitle: plan.title,
              }
            );
          }
        }
      }

      console.log('RSVP nudges sent');
    } catch (error) {
      console.error('Error sending RSVP nudges:', error);
    }
  });

/**
 * Scheduled function: Send plan reminders for plans happening tomorrow
 */
export const sendPlanReminders = functions.pubsub
  .schedule('every 24 hours')
  .timeZone('Asia/Kolkata')
  .onRun(async (context) => {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      // Query all circles
      const circlesSnapshot = await firestore.collection('circles').get();

      for (const circleDoc of circlesSnapshot.docs) {
        const circleId = circleDoc.id;
        const circle = circleDoc.data();

        // Query plans for this circle happening tomorrow
        const plansSnapshot = await firestore
          .collection('circles')
          .doc(circleId)
          .collection('plans')
          .where('date', '==', tomorrowStr)
          .where('isArchived', '==', false)
          .get();

        for (const planDoc of plansSnapshot.docs) {
          const plan = planDoc.data();
          const planId = planDoc.id;

          // Notify all members who RSVP'd "going"
          const rsvps = plan.rsvps || {};
          const goingMembers = Object.keys(rsvps).filter(
            (uid) => rsvps[uid] === 'going'
          );

          if (goingMembers.length > 0) {
            await sendPushNotifications(
              goingMembers,
              'Plan Tomorrow',
              `${plan.title} is tomorrow!`,
              {
                type: 'plan_reminder',
                circleId,
                planId,
                planTitle: plan.title,
              }
            );
          }
        }
      }

      console.log('Plan reminders sent');
    } catch (error) {
      console.error('Error sending plan reminders:', error);
    }
  });

/**
 * Firestore trigger: Send notification when a new transit circle matches user's saved routes
 */
export const onNewTransitCircle = functions.firestore
  .document('public_circles/{cardId}')
  .onCreate(async (snapshot, context) => {
    const circle = snapshot.data();

    // Only process transit circles
    if (!circle.transitRoute || !circle.transitDate) return;

    // Query users who have saved this route (implement saved routes feature)
    // For now, we'll skip this as it requires additional user preferences collection

    console.log('New transit circle created:', circle.name);
  });

/**
 * HTTP callable function: Send test notification
 */
export const sendTestNotification = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    const { title, body, notificationType } = data;

    await sendPushNotifications(
      [context.auth.uid],
      title || 'Test Notification',
      body || 'This is a test notification',
      {
        type: notificationType || 'new_member',
        circleId: 'test-circle-id',
      }
    );

    return { success: true, message: 'Test notification sent' };
  }
);
