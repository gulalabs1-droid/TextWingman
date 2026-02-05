/**
 * Admin Check Utility
 * Checks if a user email is in the ADMIN_EMAILS list
 */

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  
  const adminEmails = process.env.ADMIN_EMAILS || '';
  const adminList = adminEmails.split(',').map(e => e.trim().toLowerCase());
  
  return adminList.includes(email.toLowerCase());
}

export function validateAdminSecret(secret: string | null): boolean {
  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret) return false;
  return secret === adminSecret;
}
