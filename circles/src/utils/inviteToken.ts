/**
 * Generate a secure invite token for circle invitations
 * Format: 8 characters, alphanumeric, suitable for sharing via links
 * Example: "a1b2c3d4"
 */
export function generateInviteToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 8; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Validate invite token format
 */
export function isValidInviteToken(token: string): boolean {
  return /^[A-Za-z0-9]{8}$/.test(token);
}
