import {
  collection,
  doc,
  addDoc,
  updateDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { firestore } from './firebase';

/**
 * Circle Service
 * 
 * Handles circle-related operations including reporting
 */

export interface ReportData {
  cardId: string;
  reason: string;
  reporterUid: string;
  timestamp: number;
  status: 'pending' | 'reviewed' | 'dismissed';
}

/**
 * Report a circle card
 * 
 * @param cardId - The ID of the circle card to report
 * @param reason - The reason for reporting (spam, inappropriate, misleading, harassment)
 * @param reporterUid - The UID of the user reporting
 * @returns Promise that resolves when report is submitted
 */
export const reportCard = async (
  cardId: string,
  reason: string,
  reporterUid: string
): Promise<void> => {
  try {
    // 1. Write report to Firestore
    const reportsRef = collection(firestore, 'reports');
    await addDoc(reportsRef, {
      cardId,
      reason,
      reporterUid,
      timestamp: Date.now(),
      status: 'pending',
    });

    // 2. Count reports for this card in the last 24 hours
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
    const recentReportsQuery = query(
      reportsRef,
      where('cardId', '==', cardId),
      where('timestamp', '>', twentyFourHoursAgo)
    );

    const recentReportsSnapshot = await getDocs(recentReportsQuery);
    const reportCount = recentReportsSnapshot.size;

    console.log(`Card ${cardId} has ${reportCount} reports in last 24h`);

    // 3. If count >= 5, auto-hide the card
    if (reportCount >= 5) {
      const cardRef = doc(firestore, 'public_circles', cardId);
      await updateDoc(cardRef, {
        isHidden: true,
        hiddenReason: 'auto_reports',
        hiddenAt: serverTimestamp(),
      });

      console.log(`Card ${cardId} auto-hidden due to ${reportCount} reports`);
    }
  } catch (error) {
    console.error('Error reporting card:', error);
    throw error;
  }
};

/**
 * Check if a user has already reported a card
 * 
 * @param cardId - The ID of the circle card
 * @param reporterUid - The UID of the user
 * @returns Promise that resolves to true if user has already reported
 */
export const hasUserReportedCard = async (
  cardId: string,
  reporterUid: string
): Promise<boolean> => {
  try {
    const reportsRef = collection(firestore, 'reports');
    const userReportsQuery = query(
      reportsRef,
      where('cardId', '==', cardId),
      where('reporterUid', '==', reporterUid)
    );

    const userReportsSnapshot = await getDocs(userReportsQuery);
    return !userReportsSnapshot.empty;
  } catch (error) {
    console.error('Error checking user reports:', error);
    return false;
  }
};

/**
 * Get report count for a card in the last 24 hours
 * 
 * @param cardId - The ID of the circle card
 * @returns Promise that resolves to the report count
 */
export const getReportCount = async (cardId: string): Promise<number> => {
  try {
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
    const reportsRef = collection(firestore, 'reports');
    const recentReportsQuery = query(
      reportsRef,
      where('cardId', '==', cardId),
      where('timestamp', '>', twentyFourHoursAgo)
    );

    const recentReportsSnapshot = await getDocs(recentReportsQuery);
    return recentReportsSnapshot.size;
  } catch (error) {
    console.error('Error getting report count:', error);
    return 0;
  }
};

/**
 * Get all reports for a card
 * 
 * @param cardId - The ID of the circle card
 * @returns Promise that resolves to array of reports
 */
export const getCardReports = async (cardId: string): Promise<ReportData[]> => {
  try {
    const reportsRef = collection(firestore, 'reports');
    const cardReportsQuery = query(
      reportsRef,
      where('cardId', '==', cardId)
    );

    const cardReportsSnapshot = await getDocs(cardReportsQuery);
    const reports: ReportData[] = [];

    cardReportsSnapshot.forEach((doc) => {
      reports.push(doc.data() as ReportData);
    });

    return reports;
  } catch (error) {
    console.error('Error getting card reports:', error);
    return [];
  }
};

/**
 * Unhide a card (admin function)
 * 
 * @param cardId - The ID of the circle card
 * @returns Promise that resolves when card is unhidden
 */
export const unhideCard = async (cardId: string): Promise<void> => {
  try {
    const cardRef = doc(firestore, 'public_circles', cardId);
    await updateDoc(cardRef, {
      isHidden: false,
      hiddenReason: null,
      hiddenAt: null,
      reviewedAt: serverTimestamp(),
    });

    console.log(`Card ${cardId} unhidden`);
  } catch (error) {
    console.error('Error unhiding card:', error);
    throw error;
  }
};

/**
 * Mark reports as reviewed (admin function)
 * 
 * @param cardId - The ID of the circle card
 * @param status - The new status ('reviewed' or 'dismissed')
 * @returns Promise that resolves when reports are updated
 */
export const updateReportStatus = async (
  cardId: string,
  status: 'reviewed' | 'dismissed'
): Promise<void> => {
  try {
    const reportsRef = collection(firestore, 'reports');
    const cardReportsQuery = query(
      reportsRef,
      where('cardId', '==', cardId),
      where('status', '==', 'pending')
    );

    const cardReportsSnapshot = await getDocs(cardReportsQuery);

    // Update all pending reports for this card
    const updatePromises = cardReportsSnapshot.docs.map((reportDoc) =>
      updateDoc(reportDoc.ref, {
        status,
        reviewedAt: serverTimestamp(),
      })
    );

    await Promise.all(updatePromises);

    console.log(`Updated ${cardReportsSnapshot.size} reports for card ${cardId} to ${status}`);
  } catch (error) {
    console.error('Error updating report status:', error);
    throw error;
  }
};
