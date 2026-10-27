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
