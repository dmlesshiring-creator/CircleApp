/**
 * Transit Affiliate Service
 * 
 * Generates affiliate links for IRCTC (train bookings) and MakeMyTrip (flight bookings)
 * to enable transit circle members to book tickets with pre-filled information.
 */

/**
 * Build IRCTC affiliate link with pre-filled train details
 * @param transitRoute - Train route string (e.g., "12163 Chennai Egmore - Mumbai CST")
 * @param transitDate - Journey date in ISO format (YYYY-MM-DD)
 * @returns IRCTC booking URL with affiliate code
 */
export function buildIRCTCLink(transitRoute: string, transitDate: string): string {
  // Extract train number from route (first numeric sequence)
  const trainNumberMatch = transitRoute.match(/\d+/);
  const trainNumber = trainNumberMatch ? trainNumberMatch[0] : '';

  // Format date as YYYYMMDD for IRCTC
  const date = new Date(transitDate);
  const formattedDate = date.toISOString().split('T')[0].replace(/-/g, '');

  // Build IRCTC URL with affiliate code
  const baseUrl = 'https://www.irctc.co.in/nget/train-search';
  const params = new URLSearchParams({
    trainNumber,
    journeyDate: formattedDate,
    affiliateCode: 'CIRCLES2026',
  });

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Build MakeMyTrip affiliate link with pre-filled flight details
 * @param flightCode - Flight code string (e.g., "6E-2134 BLR-DEL")
 * @param transitDate - Journey date in ISO format (YYYY-MM-DD)
 * @returns MakeMyTrip booking URL with affiliate parameters
 */
export function buildMakeMyTripLink(flightCode: string, transitDate: string): string {
  // Extract origin and destination airport codes
  // Expected format: "6E-2134 BLR-DEL" or "BLR-DEL"
  const routeMatch = flightCode.match(/([A-Z]{3})-([A-Z]{3})/);
  const origin = routeMatch ? routeMatch[1] : 'BLR';
  const destination = routeMatch ? routeMatch[2] : 'DEL';

  // Format date as DD/MM/YYYY for MakeMyTrip
  const date = new Date(transitDate);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const formattedDate = `${day}/${month}/${year}`;

  // Build MakeMyTrip URL with affiliate parameters
  const baseUrl = 'https://www.makemytrip.com/flight/search';
  const params = new URLSearchParams({
    from: origin,
    to: destination,
    depart: formattedDate,
    tripType: 'O', // One-way
    adults: '1',
    children: '0',
    infants: '0',
    class: 'E', // Economy
    intl: 'false',
    campaign: 'circles_app',
    affiliate: 'CIRCLES2026',
  });

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Track affiliate link click for analytics
 * @param circleId - Circle ID
 * @param transitMode - 'train' or 'flight'
 * @param route - Transit route string
 * @param date - Journey date
 * @param uid - User ID
 */
export async function trackAffiliateClick(
  circleId: string,
  transitMode: 'train' | 'flight',
  route: string,
  date: string,
  uid: string
): Promise<void> {
  try {
    const { firestore } = await import('./firebase');
    const { addDoc, collection } = await import('firebase/firestore');

    await addDoc(collection(firestore, 'analytics'), {
      type: 'transit_affiliate_click',
      transitMode,
      route,
      date,
      circleId,
      uid,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error tracking affiliate click:', error);
    // Fail silently - don't block user action
  }
}
