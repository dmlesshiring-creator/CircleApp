import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

/**
 * Cloud Function: Generate Year in Circles Recap
 * 
 * Scheduled: December 1st 00:00 IST annually
 * Generates annual recap for all Circles+ subscribers
 */
export const generateYearInCircles = functions.pubsub
  .schedule('0 0 1 12 *') // December 1st at midnight
  .timeZone('Asia/Kolkata')
  .onRun(async (context) => {
    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1).getTime();
    const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59).getTime();

    console.log(`Generating Year in Circles for ${currentYear}`);

    try {
      // Get all Circles+ subscribers
      const usersSnapshot = await admin
        .firestore()
        .collection('users')
        .where('subscription', '==', 'plus')
        .get();

      console.log(`Found ${usersSnapshot.size} Circles+ subscribers`);

      const promises = usersSnapshot.docs.map(async (userDoc) => {
        const uid = userDoc.id;
        const userData = userDoc.data();

        try {
          // 1. Count plans attended
          const plansAttended = await countPlansAttended(uid, yearStart, yearEnd);

          // 2. Count circles joined this year
          const circlesJoined = await countCirclesJoined(uid, yearStart, yearEnd);

          // 3. Find most active circle
          const mostActiveCircle = await findMostActiveCircle(uid, yearStart, yearEnd);

          // 4. Count photos uploaded
          const photosUploaded = await countPhotosUploaded(uid, yearStart, yearEnd);

          // 5. Sum expenses
          const totalExpenses = await sumExpenses(uid, yearStart, yearEnd);

          // 6. Count unique co-members
          const uniqueCoMembers = await countUniqueCoMembers(uid);

          // 7. Find most used reaction emoji
          const mostUsedEmoji = await findMostUsedEmoji(uid, yearStart, yearEnd);

          // Write recap to Firestore
          await admin
            .firestore()
            .collection('users')
            .doc(uid)
            .collection('yearRecap')
            .doc(currentYear.toString())
            .set({
              year: currentYear,
              plansAttended,
              circlesJoined,
              mostActiveCircle,
              photosUploaded,
              totalExpenses,
              uniqueCoMembers,
              mostUsedEmoji,
              generatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

          // Send FCM notification
          const tokensSnapshot = await admin
            .firestore()
            .collection('users')
            .doc(uid)
            .collection('pushTokens')
            .get();

          const tokens = tokensSnapshot.docs.map((doc) => doc.data().token);

          if (tokens.length > 0) {
            await admin.messaging().sendMulticast({
              tokens,
              notification: {
                title: 'Your Year in Circles is ready 🎉',
                body: `See your ${currentYear} highlights!`,
              },
              data: {
                type: 'year_recap',
                year: currentYear.toString(),
              },
            });
          }

          console.log(`Generated recap for user ${uid}`);
        } catch (error) {
          console.error(`Error generating recap for user ${uid}:`, error);
        }
      });

      await Promise.all(promises);

      console.log('Year in Circles generation complete');
    } catch (error) {
      console.error('Error generating Year in Circles:', error);
    }
  });

/**
 * Count plans attended (RSVP = going)
 */
async function countPlansAttended(
  uid: string,
  yearStart: number,
  yearEnd: number
): Promise<number> {
  let count = 0;

  // Get all circles user is in
  const circlesSnapshot = await admin
    .firestore()
    .collection('circles')
    .where('members', 'array-contains', { uid })
    .get();

  for (const circleDoc of circlesSnapshot.docs) {
    const plansSnapshot = await admin
      .firestore()
      .collection(`circles/${circleDoc.id}/plans`)
      .where(`rsvps.${uid}`, '==', 'going')
      .get();

    plansSnapshot.forEach((planDoc) => {
      const planData = planDoc.data();
      const planDate = planData.date?.toMillis ? planData.date.toMillis() : planData.date;

      if (planDate >= yearStart && planDate <= yearEnd) {
        count++;
      }
    });
  }

  return count;
}

/**
 * Count circles joined this year
 */
async function countCirclesJoined(
  uid: string,
  yearStart: number,
  yearEnd: number
): Promise<number> {
  const circlesSnapshot = await admin
    .firestore()
    .collection('circles')
    .where('members', 'array-contains', { uid })
    .get();

  let count = 0;

  circlesSnapshot.forEach((doc) => {
    const members = doc.data().members || [];
    const userMember = members.find((m: any) => m.uid === uid);

    if (userMember && userMember.joinedAt) {
      if (userMember.joinedAt >= yearStart && userMember.joinedAt <= yearEnd) {
        count++;
      }
    }
  });

  return count;
}

/**
 * Find most active circle (most messages sent)
 */
async function findMostActiveCircle(
  uid: string,
  yearStart: number,
  yearEnd: number
): Promise<{ id: string; name: string; messageCount: number } | null> {
  const circlesSnapshot = await admin
    .firestore()
    .collection('circles')
    .where('members', 'array-contains', { uid })
    .get();

  let mostActive: { id: string; name: string; messageCount: number } | null = null;
  let maxMessages = 0;

  for (const circleDoc of circlesSnapshot.docs) {
    const circleId = circleDoc.id;
    const circleName = circleDoc.data().name;

    // Count messages from Realtime DB
    const messagesSnapshot = await admin
      .database()
      .ref(`circles/${circleId}/messages`)
      .orderByChild('senderId')
      .equalTo(uid)
      .once('value');

    let count = 0;
    messagesSnapshot.forEach((messageSnap) => {
      const message = messageSnap.val();
      if (message.createdAt >= yearStart && message.createdAt <= yearEnd) {
        count++;
      }
    });

    if (count > maxMessages) {
      maxMessages = count;
      mostActive = {
        id: circleId,
        name: circleName,
        messageCount: count,
      };
    }
  }

  return mostActive;
}

/**
 * Count photos uploaded to Memory Lane
 */
async function countPhotosUploaded(
  uid: string,
  yearStart: number,
  yearEnd: number
): Promise<number> {
  let count = 0;

  // Get all circles user is in
  const circlesSnapshot = await admin
    .firestore()
    .collection('circles')
    .where('members', 'array-contains', { uid })
    .get();

  for (const circleDoc of circlesSnapshot.docs) {
    const photosSnapshot = await admin
      .firestore()
      .collection(`circles/${circleDoc.id}/photos`)
      .where('uploaderUid', '==', uid)
      .where('uploadedAt', '>=', yearStart)
      .where('uploadedAt', '<=', yearEnd)
      .get();

    count += photosSnapshot.size;
  }

  return count;
}

/**
 * Sum expenses (user's share)
 */
async function sumExpenses(
  uid: string,
  yearStart: number,
  yearEnd: number
): Promise<number> {
  let total = 0;

  // Get all circles user is in
  const circlesSnapshot = await admin
    .firestore()
    .collection('circles')
    .where('members', 'array-contains', { uid })
    .get();

  for (const circleDoc of circlesSnapshot.docs) {
    const expensesSnapshot = await admin
      .firestore()
      .collection(`circles/${circleDoc.id}/expenses`)
      .where('createdAt', '>=', yearStart)
      .where('createdAt', '<=', yearEnd)
      .get();

    expensesSnapshot.forEach((expenseDoc) => {
      const expense = expenseDoc.data();
      const splits = expense.splits || [];
      const userSplit = splits.find((s: any) => s.uid === uid);

      if (userSplit) {
        total += userSplit.amount;
      }
    });
  }

  return Math.round(total);
}

/**
 * Count unique co-members
 */
async function countUniqueCoMembers(uid: string): Promise<number> {
  const uniqueUids = new Set<string>();

  const circlesSnapshot = await admin
    .firestore()
    .collection('circles')
    .where('members', 'array-contains', { uid })
    .get();

  circlesSnapshot.forEach((doc) => {
    const members = doc.data().members || [];
    members.forEach((member: any) => {
      if (member.uid !== uid) {
        uniqueUids.add(member.uid);
      }
    });
  });

  return uniqueUids.size;
}

/**
 * Find most used reaction emoji
 */
async function findMostUsedEmoji(
  uid: string,
  yearStart: number,
  yearEnd: number
): Promise<string | null> {
  const emojiCounts: Record<string, number> = {};

  // Get all circles user is in
  const circlesSnapshot = await admin
    .firestore()
    .collection('circles')
    .where('members', 'array-contains', { uid })
    .get();

  for (const circleDoc of circlesSnapshot.docs) {
    const circleId = circleDoc.id;

    // Get messages from Realtime DB
    const messagesSnapshot = await admin
      .database()
      .ref(`circles/${circleId}/messages`)
      .once('value');

    messagesSnapshot.forEach((messageSnap) => {
      const message = messageSnap.val();

      if (message.createdAt >= yearStart && message.createdAt <= yearEnd) {
        const reactions = message.reactions || {};

        Object.entries(reactions).forEach(([emoji, uids]: [string, any]) => {
          if (Array.isArray(uids) && uids.includes(uid)) {
            emojiCounts[emoji] = (emojiCounts[emoji] || 0) + 1;
          }
        });
      }
    });
  }

  // Find most used
  let mostUsed: string | null = null;
  let maxCount = 0;

  Object.entries(emojiCounts).forEach(([emoji, count]) => {
    if (count > maxCount) {
      maxCount = count;
      mostUsed = emoji;
    }
  });

  return mostUsed;
}
