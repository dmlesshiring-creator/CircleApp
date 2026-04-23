import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const firestore = admin.firestore();
const messaging = admin.messaging();

/**
 * Scheduled Cloud Function that runs every hour to archive transit circles
 * whose journey date has passed by more than 24 hours.
 */
export const archiveTransitCircles = functions.pubsub
  .schedule('every 1 hours')
  .onRun(async (context) => {
    try {
      const now = Date.now();
      const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;

      // Query transit circles that should be archived
      const circlesRef = firestore.collection('public_circles');
      const query = circlesRef
        .where('transitDate', '!=', null)
        .where('isArchived', '==', false);

      const snapshot = await query.get();

      if (snapshot.empty) {
        console.log('No transit circles to archive');
        return null;
      }

      const batch = firestore.batch();
      const notificationPromises: Promise<any>[] = [];

      snapshot.forEach((doc) => {
        const circle = doc.data();
        const transitDate = new Date(circle.transitDate).getTime();

        // Check if transit date is more than 24 hours ago
        if (transitDate < twentyFourHoursAgo) {
          console.log(`Archiving circle: ${doc.id} - ${circle.name}`);

          // Update circle to archived
          batch.update(doc.ref, {
            isArchived: true,
            archivedAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          // Send FCM push notification to all members
          if (circle.members && Array.isArray(circle.members)) {
            circle.members.forEach((memberUid: string) => {
              // Get user's FCM token from users collection
              const userRef = firestore.collection('users').doc(memberUid);
              const notificationPromise = userRef.get().then((userDoc) => {
                if (userDoc.exists) {
                  const userData = userDoc.data();
                  const fcmToken = userData?.fcmToken;

                  if (fcmToken) {
                    return messaging.send({
                      token: fcmToken,
                      notification: {
                        title: 'Journey complete ✈️',
                        body: `Your circle '${circle.name}' has archived. Keep it as a memory or let it go.`,
                      },
                      data: {
                        circleId: doc.id,
                        action: 'archive_prompt',
                        circleName: circle.name,
                      },
                      android: {
                        priority: 'high',
                      },
                      apns: {
                        payload: {
                          aps: {
                            sound: 'default',
                            badge: 1,
                          },
                        },
                      },
                    });
                  }
                }
                return null;
              });

              notificationPromises.push(notificationPromise);
            });
          }
        }
      });

      // Commit the batch update
      await batch.commit();

      // Send all notifications
      await Promise.allSettled(notificationPromises);

      console.log(`Archived ${snapshot.size} transit circles`);
      return null;
    } catch (error) {
      console.error('Error archiving transit circles:', error);
      throw error;
    }
  });

/**
 * HTTP callable function to manually trigger archiving (for testing)
 */
export const manualArchiveTransitCircles = functions.https.onCall(
  async (data, context) => {
    // Verify the user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated to call this function'
      );
    }

    // Optional: Add admin check here
    // const userDoc = await firestore.collection('users').doc(context.auth.uid).get();
    // if (!userDoc.data()?.isAdmin) {
    //   throw new functions.https.HttpsError('permission-denied', 'User must be admin');
    // }

    try {
      // Call the same logic as the scheduled function
      const now = Date.now();
      const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;

      const circlesRef = firestore.collection('public_circles');
      const query = circlesRef
        .where('transitDate', '!=', null)
        .where('isArchived', '==', false);

      const snapshot = await query.get();
      let archivedCount = 0;

      const batch = firestore.batch();

      snapshot.forEach((doc) => {
        const circle = doc.data();
        const transitDate = new Date(circle.transitDate).getTime();

        if (transitDate < twentyFourHoursAgo) {
          batch.update(doc.ref, {
            isArchived: true,
            archivedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          archivedCount++;
        }
      });

      await batch.commit();

      return {
        success: true,
        archivedCount,
        message: `Archived ${archivedCount} transit circles`,
      };
    } catch (error) {
      console.error('Error in manual archive:', error);
      throw new functions.https.HttpsError('internal', 'Failed to archive circles');
    }
  }
);
