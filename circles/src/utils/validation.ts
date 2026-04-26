/**
 * Validation utilities
 */

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number (Indian format)
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  // Remove spaces, dashes, and parentheses
  const cleaned = phone.replace(/[\s\-()]/g, '');

  // Indian phone numbers: 10 digits starting with 6-9
  const phoneRegex = /^[6-9]\d{9}$/;

  return phoneRegex.test(cleaned);
};

/**
 * Validate display name
 */
export const isValidDisplayName = (name: string): boolean => {
  // 2-50 characters, letters, numbers, spaces, and basic punctuation
  const nameRegex = /^[a-zA-Z0-9\s\-'.]{2,50}$/;
  return nameRegex.test(name.trim());
};

/**
 * Validate bio
 */
export const isValidBio = (bio: string): boolean => {
  // Max 80 characters
  return bio.length <= 80;
};

/**
 * Validate circle name
 */
export const isValidCircleName = (name: string): boolean => {
  // 3-50 characters
  const trimmed = name.trim();
  return trimmed.length >= 3 && trimmed.length <= 50;
};

/**
 * Validate circle description
 */
export const isValidCircleDescription = (description: string): boolean => {
  // Max 200 characters
  return description.length <= 200;
};

/**
 * Validate plan title
 */
export const isValidPlanTitle = (title: string): boolean => {
  // 3-100 characters
  const trimmed = title.trim();
  return trimmed.length >= 3 && trimmed.length <= 100;
};

/**
 * Validate plan description
 */
export const isValidPlanDescription = (description: string): boolean => {
  // Max 500 characters
  return description.length <= 500;
};

/**
 * Validate message content
 */
export const isValidMessage = (message: string): boolean => {
  // 1-2000 characters
  const trimmed = message.trim();
  return trimmed.length >= 1 && trimmed.length <= 2000;
};

/**
 * Validate URL format
 */
export const isValidURL = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate train number (Indian Railways)
 */
export const isValidTrainNumber = (trainNumber: string): boolean => {
  // 5 digits
  const trainRegex = /^\d{5}$/;
  return trainRegex.test(trainNumber);
};

/**
 * Validate flight number
 */
export const isValidFlightNumber = (flightNumber: string): boolean => {
  // 2 letters followed by 3-4 digits (e.g., AI101, 6E2345)
  const flightRegex = /^[A-Z]{2}\d{3,4}$/i;
  return flightRegex.test(flightNumber.replace(/\s/g, ''));
};

/**
 * Validate date is in the future
 */
export const isFutureDate = (date: Date): boolean => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return date >= now;
};

/**
 * Validate date is within range
 */
export const isDateInRange = (
  date: Date,
  minDate: Date,
  maxDate: Date
): boolean => {
  return date >= minDate && date <= maxDate;
};

/**
 * Validate amount is positive
 */
export const isPositiveAmount = (amount: number): boolean => {
  return amount > 0 && !isNaN(amount) && isFinite(amount);
};

/**
 * Validate UPI ID format
 */
export const isValidUPIId = (upiId: string): boolean => {
  // Format: username@bankname
  const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/;
  return upiRegex.test(upiId);
};

/**
 * Validate password strength
 */
export const isStrongPassword = (password: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain a lowercase letter');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain an uppercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain a number');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Sanitize user input (remove dangerous characters)
 */
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
};

/**
 * Validate file size
 */
export const isValidFileSize = (
  sizeInBytes: number,
  maxSizeInMB: number
): boolean => {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return sizeInBytes <= maxSizeInBytes;
};

/**
 * Validate image file type
 */
export const isValidImageType = (mimeType: string): boolean => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  return validTypes.includes(mimeType.toLowerCase());
};

/**
 * Validate video file type
 */
export const isValidVideoType = (mimeType: string): boolean => {
  const validTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
  return validTypes.includes(mimeType.toLowerCase());
};

/**
 * Get validation error message
 */
export const getValidationError = (
  field: string,
  value: any,
  rules: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: any) => boolean;
  }
): string | null => {
  if (rules.required && (!value || value.toString().trim().length === 0)) {
    return `${field} is required`;
  }

  if (rules.minLength && value.toString().length < rules.minLength) {
    return `${field} must be at least ${rules.minLength} characters`;
  }

  if (rules.maxLength && value.toString().length > rules.maxLength) {
    return `${field} must be at most ${rules.maxLength} characters`;
  }

  if (rules.pattern && !rules.pattern.test(value.toString())) {
    return `${field} format is invalid`;
  }

  if (rules.custom && !rules.custom(value)) {
    return `${field} is invalid`;
  }

  return null;
};
