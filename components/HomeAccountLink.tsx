'use client';

import Link from 'next/link';
import { useSyncExternalStore } from 'react';

// Supabase keeps the session in an `sb-<project>-auth-token` cookie, split
// into `.0`, `.1`… parts when it is large.
const SESSION_COOKIE = /(?:^|;\s*)sb-[^=;]+-auth-token(?:\.\d+)?=/;

/**
 * Header link on the public pages: "Sign in" for visitors, a shortcut into
 * Coach for people who already have a session in this browser. Checks the
 * session cookie instead of loading the Supabase client, which would add
 * about 60 KB to every marketing page. An expired session still lands
 * safely: /app sends signed-out people where they need to go.
 */
const noSubscription = () => () => {};

export function HomeAccountLink({ className }: { className?: string }) {
  // The server renders "Sign in"; the browser switches after hydration.
  const signedIn = useSyncExternalStore(noSubscription, () => SESSION_COOKIE.test(document.cookie), () => false);

  return signedIn
    ? <Link className={className} href="/app">Open Coach</Link>
    : <Link className={className} href="/login?mode=signin">Sign in</Link>;
}
