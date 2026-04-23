/**
 * Build invite URL for sharing
 * Format: circles.app/join/{token}
 */
export function buildInviteUrl(token: string): string {
  return `circles.app/join/${token}`;
}

/**
 * Build WhatsApp deep link with message
 */
export function buildWhatsAppDeepLink(message: string): string {
  const encodedMessage = encodeURIComponent(message);
  return `whatsapp://send?text=${encodedMessage}`;
}

/**
 * Build share message with circle name and URL
 */
export function buildShareMessage(circleName: string, url: string): string {
  return `Join my circle '${circleName}' on Circles app! ${url}`;
}

/**
 * Parse invite token from URL
 * Handles: circles.app/join/abc123 or https://circles.app/join/abc123
 */
export function parseInviteTokenFromUrl(url: string): string | null {
  try {
    // Remove protocol if present
    const cleanUrl = url.replace(/^https?:\/\//, '');
    const match = cleanUrl.match(/join\/([a-zA-Z0-9]{8})/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Check if URL is a valid Circles invite link
 */
export function isValidInviteLink(url: string): boolean {
  return parseInviteTokenFromUrl(url) !== null;
}
