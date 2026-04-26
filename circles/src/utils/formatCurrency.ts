/**
 * Format currency for Indian Rupees
 * 
 * @param amount - Amount in rupees
 * @param showSymbol - Whether to show ₹ symbol (default: true)
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number, showSymbol: boolean = true): string => {
  // Handle negative amounts
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  // Format with Indian number system (lakhs, crores)
  const formatted = formatIndianNumber(absAmount);

  // Add symbol
  const result = showSymbol ? `₹${formatted}` : formatted;

  // Add negative sign if needed
  return isNegative ? `-${result}` : result;
};

/**
 * Format number in Indian numbering system
 * 
 * Examples:
 * - 1000 -> 1,000
 * - 100000 -> 1,00,000 (1 lakh)
 * - 10000000 -> 1,00,00,000 (1 crore)
 */
export const formatIndianNumber = (num: number): string => {
  // Round to 2 decimal places
  const rounded = Math.round(num * 100) / 100;

  // Convert to string
  const str = rounded.toString();

  // Split into integer and decimal parts
  const [integerPart, decimalPart] = str.split('.');

  // Format integer part with Indian comma placement
  let formatted = '';
  let count = 0;

  // Process from right to left
  for (let i = integerPart.length - 1; i >= 0; i--) {
    if (count === 3 || (count > 3 && (count - 3) % 2 === 0)) {
      formatted = ',' + formatted;
    }
    formatted = integerPart[i] + formatted;
    count++;
  }

  // Add decimal part if exists
  if (decimalPart) {
    formatted += '.' + decimalPart;
  }

  return formatted;
};

/**
 * Format currency in compact form
 * 
 * Examples:
 * - 1000 -> ₹1K
 * - 100000 -> ₹1L (lakh)
 * - 10000000 -> ₹1Cr (crore)
 */
export const formatCompactCurrency = (amount: number): string => {
  const absAmount = Math.abs(amount);
  const isNegative = amount < 0;

  let formatted: string;

  if (absAmount >= 10000000) {
    // Crores
    formatted = `₹${(absAmount / 10000000).toFixed(1)}Cr`;
  } else if (absAmount >= 100000) {
    // Lakhs
    formatted = `₹${(absAmount / 100000).toFixed(1)}L`;
  } else if (absAmount >= 1000) {
    // Thousands
    formatted = `₹${(absAmount / 1000).toFixed(1)}K`;
  } else {
    formatted = `₹${absAmount}`;
  }

  // Remove trailing .0
  formatted = formatted.replace('.0', '');

  return isNegative ? `-${formatted}` : formatted;
};

/**
 * Parse currency string to number
 * 
 * @param str - Currency string (e.g., "₹1,000" or "1000")
 * @returns Number value
 */
export const parseCurrency = (str: string): number => {
  // Remove currency symbol and commas
  const cleaned = str.replace(/[₹,]/g, '').trim();

  // Parse as float
  const value = parseFloat(cleaned);

  return isNaN(value) ? 0 : value;
};

/**
 * Format amount for UPI payment
 * 
 * UPI requires amount without commas or symbols
 * 
 * @param amount - Amount in rupees
 * @returns Formatted amount for UPI (e.g., "1000.00")
 */
export const formatUPIAmount = (amount: number): string => {
  return amount.toFixed(2);
};

/**
 * Split amount equally among people
 * 
 * @param total - Total amount
 * @param count - Number of people
 * @returns Array of split amounts (handles rounding)
 */
export const splitEqually = (total: number, count: number): number[] => {
  if (count <= 0) return [];

  const baseAmount = Math.floor((total * 100) / count) / 100;
  const remainder = Math.round((total - baseAmount * count) * 100) / 100;

  const splits = new Array(count).fill(baseAmount);

  // Distribute remainder to first person
  if (remainder > 0) {
    splits[0] += remainder;
  }

  return splits;
};

/**
 * Calculate percentage of total
 * 
 * @param amount - Amount
 * @param total - Total amount
 * @returns Percentage (0-100)
 */
export const calculatePercentage = (amount: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((amount / total) * 100);
};

/**
 * Format percentage
 * 
 * @param value - Percentage value (0-100)
 * @returns Formatted percentage string
 */
export const formatPercentage = (value: number): string => {
  return `${Math.round(value)}%`;
};
