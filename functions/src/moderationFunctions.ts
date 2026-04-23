import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const firestore = admin.firestore();

/**
 * HTTP callable function: Get all pending reports (admin only)
 */
export const getPendingReports = functions.https.onCall(async (data, context) => {
  // Verify user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  // Verify user is admin
  const userDoc = await firestore.collection('users').doc(context.auth.uid).get();
  if (!userDoc.exists || !userDoc.data()?.isAdmin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'User must be admin to access reports'
    );
  }

  try {
    const reportsSnapshot = await firestore
      .collection('reports')
      .where('status', '==', 'pending')
      .orderBy('timestamp', 'desc')
      .limit(100)
      .get();

    const reports: any[] = [];
    reportsSnapshot.forEach((doc) => {
      reports.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    // Group reports by cardId
    const reportsByCard: Record<string, any[]> = {};
    reports.forEach((report) => {
      if (!reportsByCard[report.cardId]) {
        reportsByCard[report.cardId] = [];
      }
      reportsByCard[report.cardId].push(report);
    });

    // Get card details for each reported card
    const cardsWithReports = await Promise.all(
      Object.keys(reportsByCard).map(async (cardId) => {
        const cardDoc = await firestore.collection('public_circles').doc(cardId).get();
        return {
          cardId,
          cardData: cardDoc.exists ? cardDoc.data() : null,
          reports: reportsByCard[cardId],
          reportCount: reportsByCard[cardId].length,
        };
      })
    );

    return {
      success: true,
      data: cardsWithReports,
      totalReports: reports.length,
    };
  } catch (error) {
    console.error('Error getting pending reports:', error);
    throw new functions.https.HttpsError('internal', 'Failed to get reports');
  }
});

/**
 * HTTP callable function: Review and take action on reports (admin only)
 */
export const reviewReports = functions.https.onCall(async (data, context) => {
  // Verify user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  // Verify user is admin
  const userDoc = await firestore.collection('users').doc(context.auth.uid).get();
  if (!userDoc.exists || !userDoc.data()?.isAdmin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'User must be admin to review reports'
    );
  }

  const { cardId, action } = data;

  if (!cardId || !action) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'cardId and action are required'
    );
  }

  if (!['dismiss', 'hide', 'delete'].includes(action)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'action must be dismiss, hide, or delete'
    );
  }

  try {
    const batch = firestore.batch();

    // Update all pending reports for this card
    const reportsSnapshot = await firestore
      .collection('reports')
      .where('cardId', '==', cardId)
      .where('status', '==', 'pending')
      .get();

    reportsSnapshot.forEach((doc) => {
      batch.update(doc.ref, {
        status: action === 'dismiss' ? 'dismissed' : 'reviewed',
        reviewedBy: context.auth!.uid,
        reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
        action,
      });
    });

    // Take action on the card
    const cardRef = firestore.collection('public_circles').doc(cardId);

    if (action === 'dismiss') {
      // Unhide the card if it was auto-hidden
      batch.update(cardRef, {
        isHidden: false,
        hiddenReason: null,
        hiddenAt: null,
        reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
        reviewedBy: context.auth!.uid,
      });
    } else if (action === 'hide') {
      // Hide the card
      batch.update(cardRef, {
        isHidden: true,
        hiddenReason: 'admin_review',
        hiddenAt: admin.firestore.FieldValue.serverTimestamp(),
        reviewedBy: context.auth!.uid,
      });
    } else if (action === 'delete') {
      // Mark card as deleted (soft delete)
      batch.update(cardRef, {
        isDeleted: true,
        isHidden: true,
        deletedReason: 'admin_review',
        deletedAt: admin.firestore.FieldValue.serverTimestamp(),
        deletedBy: context.auth!.uid,
      });
    }

    await batch.commit();

    return {
      success: true,
      message: `Successfully ${action}ed card and updated ${reportsSnapshot.size} reports`,
      reportCount: reportsSnapshot.size,
    };
  } catch (error) {
    console.error('Error reviewing reports:', error);
    throw new functions.https.HttpsError('internal', 'Failed to review reports');
  }
});

/**
 * HTTP callable function: Get report statistics (admin only)
 */
export const getReportStats = functions.https.onCall(async (data, context) => {
  // Verify user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  // Verify user is admin
  const userDoc = await firestore.collection('users').doc(context.auth.uid).get();
  if (!userDoc.exists || !userDoc.data()?.isAdmin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'User must be admin to access stats'
    );
  }

  try {
    const now = Date.now();
    const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    // Get all reports
    const allReportsSnapshot = await firestore.collection('reports').get();

    // Get reports in last 24 hours
    const recentReportsSnapshot = await firestore
      .collection('reports')
      .where('timestamp', '>', twentyFourHoursAgo)
      .get();

    // Get reports in last 7 days
    const weekReportsSnapshot = await firestore
      .collection('reports')
      .where('timestamp', '>', sevenDaysAgo)
      .get();

    // Count by status
    const statusCounts: Record<string, number> = {
      pending: 0,
      reviewed: 0,
      dismissed: 0,
    };

    allReportsSnapshot.forEach((doc) => {
      const status = doc.data().status || 'pending';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    // Count by reason
    const reasonCounts: Record<string, number> = {};
    allReportsSnapshot.forEach((doc) => {
      const reason = doc.data().reason || 'unknown';
      reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
    });

    // Get auto-hidden cards
    const hiddenCardsSnapshot = await firestore
      .collection('public_circles')
      .where('isHidden', '==', true)
      .where('hiddenReason', '==', 'auto_reports')
      .get();

    return {
      success: true,
      stats: {
        total: allReportsSnapshot.size,
        last24Hours: recentReportsSnapshot.size,
        last7Days: weekReportsSnapshot.size,
        byStatus: statusCounts,
        byReason: reasonCounts,
        autoHiddenCards: hiddenCardsSnapshot.size,
      },
    };
  } catch (error) {
    console.error('Error getting report stats:', error);
    throw new functions.https.HttpsError('internal', 'Failed to get stats');
  }
});

/**
 * Scheduled function: Clean up old reviewed reports (runs weekly)
 */
export const cleanupOldReports = functions.pubsub
  .schedule('every sunday 00:00')
  .timeZone('Asia/Kolkata')
  .onRun(async (context) => {
    try {
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

      // Get old reviewed/dismissed reports
      const oldReportsSnapshot = await firestore
        .collection('reports')
        .where('status', 'in', ['reviewed', 'dismissed'])
        .where('timestamp', '<', thirtyDaysAgo)
        .get();

      if (oldReportsSnapshot.empty) {
        console.log('No old reports to clean up');
        return null;
      }

      // Delete in batches of 500 (Firestore limit)
      const batchSize = 500;
      let deletedCount = 0;

      for (let i = 0; i < oldReportsSnapshot.docs.length; i += batchSize) {
        const batch = firestore.batch();
        const chunk = oldReportsSnapshot.docs.slice(i, i + batchSize);

        chunk.forEach((doc) => {
          batch.delete(doc.ref);
        });

        await batch.commit();
        deletedCount += chunk.length;
      }

      console.log(`Cleaned up ${deletedCount} old reports`);
      return null;
    } catch (error) {
      console.error('Error cleaning up old reports:', error);
      throw error;
    }
  });
