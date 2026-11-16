'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

/**
 * Header link on the public pages: "Sign in" for visitors, a shortcut into
 * Coach for people who already have a session in this browser.
 */
export function HomeAccountLink({ className }: { className?: string }) {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    let active = true;
    // getSession reads the stored session; it does not need a network round trip.
    createClient().auth.getSession()
      .then(({ data }) => { if (active) setSignedIn(Boolean(data.session)); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  return signedIn
    ? <Link className={className} href="/app">Open Coach</Link>
    : <Link className={className} href="/login?mode=signin">Sign in</Link>;
}
