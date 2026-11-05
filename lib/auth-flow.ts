export const OTP_RESEND_COOLDOWN_SECONDS = 60;

export function normalizeOtp(value: string): string {
  return value.replace(/\D/g, '').slice(0, 10);
}

export function isPlausibleOtp(value: string): boolean {
  return /^\d{6,10}$/.test(value);
}

export function postAuthDestination(redirectUrl: string | null, onboardingComplete: boolean): string {
  if (redirectUrl) return redirectUrl;
  return onboardingComplete ? '/dashboard' : '/onboarding';
}

export function isNewlyCreatedUser(createdAt: string | undefined, now: number): boolean {
  const created = createdAt ? Date.parse(createdAt) : Number.NaN;
  return Number.isFinite(created) && now - created < 15 * 60 * 1000;
}

export function friendlyAuthError(message: string | null | undefined): string {
  const text = message || '';
  if (/rate limit|only request this after|security purposes|too many/i.test(text)) {
    return 'Too many attempts. Wait a minute, then try again.';
  }
  if (/token has expired|otp.*(expired|invalid)|invalid.*(token|otp)|expired/i.test(text)) {
    return 'That code is wrong or expired. Check the newest email or send a new code.';
  }
  if (/invalid login credentials/i.test(text)) {
    return 'Email or password is incorrect. You can also sign in with an email code.';
  }
  if (/email not confirmed/i.test(text)) {
    return 'Confirm your email first, or sign in with an email code instead.';
  }
  if (/signups? not allowed|signup.*disabled/i.test(text)) {
    return 'New accounts are paused right now. Please try again later.';
  }
  if (/valid email|invalid.*email|email.*invalid|unable to validate email/i.test(text)) {
    return 'Enter a valid email address.';
  }
  return 'Something went wrong. Please try again.';
}
