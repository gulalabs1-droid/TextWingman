export function safeReturnPath(value: string | null | undefined, fallback = '/app'): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || /[\\\u0000-\u001f\u007f]/.test(value)) return fallback;
  try {
    const base = 'https://text-wingman.invalid';
    const url = new URL(value, base);
    return url.origin === base ? `${url.pathname}${url.search}${url.hash}` : fallback;
  } catch {
    return fallback;
  }
}

export function isSavedThreadReturn(value: string): boolean {
  const url = new URL(safeReturnPath(value), 'https://text-wingman.invalid');
  // restore=1: the homepage handoff; resume=1: a Coach chat saved before sign-up.
  return url.pathname === '/app' && (url.searchParams.get('restore') === '1' || url.searchParams.get('resume') === '1');
}

export function confirmationReturnPath(redirectTo: string | null): string | null {
  if (!redirectTo) return null;
  try {
    const url = new URL(redirectTo);
    if (!['https://textwingman.app', 'https://gula-agents2.vercel.app'].includes(url.origin) || url.pathname !== '/auth/confirm') return null;
    return url.searchParams.get('next');
  } catch {
    return null;
  }
}

export function confirmationDestination(
  requested: string | null | undefined,
  stored: unknown,
  onboardingComplete: boolean,
): string {
  const candidate = requested || (typeof stored === 'string' ? stored : null);
  const next = safeReturnPath(candidate, '/onboarding');
  const path = new URL(next, 'https://text-wingman.invalid').pathname;
  if (isSavedThreadReturn(next) || path === '/pricing') return next;
  if (!onboardingComplete) return '/onboarding';
  if (path.startsWith('/invite/')) return next;
  return '/app';
}
