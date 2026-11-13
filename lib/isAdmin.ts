/**
 * Admin Check Utility
 * Checks if a user email is in the ADMIN_EMAILS list
 */
import { createHash, timingSafeEqual } from 'crypto';

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;

  const adminList = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);

  return adminList.includes(email.trim().toLowerCase());
}

const digest = (value: string) => createHash('sha256').update(value).digest();

export function validateAdminSecret(secret: unknown): boolean {
  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret || typeof secret !== 'string' || !secret) return false;
  // Constant-time comparison so the secret cannot be recovered by timing.
  return timingSafeEqual(digest(secret), digest(adminSecret));
}
