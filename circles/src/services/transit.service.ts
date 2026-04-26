/**
 * Transit Service
 * 
 * Handles transit-related functionality and affiliate links
 */

/**
 * Build IRCTC affiliate link for train booking
 * 
 * @param transitRoute - Train route (e.g., "12345 - Mumbai to Delhi")
 * @param transitDate - Journey date
 * @returns IRCTC booking URL with pre-filled details
 */
export const buildIRCTCLink = (transitRoute: string, transitDate: string): string => {
  // Extract train number from route
  const trainNumber = transitRoute.split(' ')[0];

  // Format date for IRCTC (DD-MM-YYYY)
  const date = new Date(transitDate);
  const formattedDate = `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1)
    .toString()
    .padStart(2, '0')}-${date.getFullYear()}`;

  // Build IRCTC URL
  // Note: Replace with actual IRCTC affiliate link structure
  const baseUrl = 'https://www.irctc.co.in/nget/train-search';
  const params = new URLSearchParams({
    trainNo: trainNumber,
    jDate: formattedDate,
  });

  return `${baseUrl}?${params.toString()}`;
};

/**
 * Build MakeMyTrip affiliate link for flight booking
 * 
 * @param transitRoute - Flight route (e.g., "DEL-BOM")
 * @param transitDate - Journey date
 * @returns MakeMyTrip booking URL with pre-filled details
 */
export const buildMakeMyTripLink = (transitRoute: string, transitDate: string): string => {
  // Extract origin and destination from route
  const [origin, destination] = transitRoute.split('-').map((s) => s.trim());

  // Format date for MakeMyTrip (MMDDYYYY)
  const date = new Date(transitDate);
  const formattedDate = `${(date.getMonth() + 1).toString().padStart(2, '0')}${date
    .getDate()
    .toString()
    .padStart(2, '0')}${date.getFullYear()}`;

  // Build MakeMyTrip URL
  // Note: Replace with actual MakeMyTrip affiliate link structure
  const baseUrl = 'https://www.makemytrip.com/flight/search';
  const params = new URLSearchParams({
    from: origin,
    to: destination,
    depart: formattedDate,
    tripType: 'O', // One-way
    adults: '1',
  });

  return `${baseUrl}?${params.toString()}`;
};

/**
 * Parse train number from user input
 * 
 * @param input - User input (e.g., "12345" or "12345 Rajdhani")
 * @returns Train number or null
 */
export const parseTrainNumber = (input: string): string | null => {
  const match = input.match(/\d{5}/);
  return match ? match[0] : null;
};

/**
 * Parse flight number from user input
 * 
 * @param input - User input (e.g., "AI101" or "Air India 101")
 * @returns Flight number or null
 */
export const parseFlightNumber = (input: string): string | null => {
  const match = input.match(/[A-Z]{2}\d{3,4}/i);
  return match ? match[0].toUpperCase() : null;
};

/**
 * Format train route for display
 * 
 * @param trainNumber - Train number
 * @param origin - Origin station
 * @param destination - Destination station
 * @returns Formatted route string
 */
export const formatTrainRoute = (
  trainNumber: string,
  origin: string,
  destination: string
): string => {
  return `${trainNumber} - ${origin} to ${destination}`;
};

/**
 * Format flight route for display
 * 
 * @param flightNumber - Flight number
 * @param origin - Origin airport code
 * @param destination - Destination airport code
 * @returns Formatted route string
 */
export const formatFlightRoute = (
  flightNumber: string,
  origin: string,
  destination: string
): string => {
  return `${flightNumber} - ${origin} to ${destination}`;
};

/**
 * Get transit mode from route
 * 
 * @param route - Transit route string
 * @returns 'train' or 'flight'
 */
export const getTransitMode = (route: string): 'train' | 'flight' => {
  // Check if route contains train number (5 digits)
  if (/\d{5}/.test(route)) {
    return 'train';
  }

  // Check if route contains flight number (2 letters + 3-4 digits)
  if (/[A-Z]{2}\d{3,4}/i.test(route)) {
    return 'flight';
  }

  // Default to train
  return 'train';
};

/**
 * Validate train number
 * 
 * @param trainNumber - Train number to validate
 * @returns true if valid
 */
export const isValidTrainNumber = (trainNumber: string): boolean => {
  return /^\d{5}$/.test(trainNumber);
};

/**
 * Validate flight number
 * 
 * @param flightNumber - Flight number to validate
 * @returns true if valid
 */
export const isValidFlightNumber = (flightNumber: string): boolean => {
  return /^[A-Z]{2}\d{3,4}$/i.test(flightNumber);
};

/**
 * Track affiliate click (imported from analytics.service)
 */
export { trackAffiliateClick } from './analytics.service';
