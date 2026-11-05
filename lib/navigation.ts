export function safeReturnPath(value: string | null | undefined, fallback = '/dashboard'): string {
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
  return url.pathname === '/app' && url.searchParams.get('restore') === '1';
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
  return '/dashboard';
}
