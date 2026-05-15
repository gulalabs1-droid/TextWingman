'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'src', 'via', 'video_id'] as const;

export default function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTracked = useRef<string>('');

  useEffect(() => {
    const key = `${pathname}?${searchParams?.toString() || ''}`;
    if (key === lastTracked.current) return;
    lastTracked.current = key;

    // Small delay so document.title is set
    const timer = setTimeout(() => {
      try {
        const utm: Record<string, string> = {};
        for (const k of UTM_KEYS) {
          const v = searchParams?.get(k);
          if (v) utm[k] = v;
        }

        const payload: Record<string, unknown> = {
          page: pathname,
          referrer: document.referrer || null,
          screen: `${window.screen.width}x${window.screen.height}`,
          title: document.title || null,
        };

        if (Object.keys(utm).length > 0) {
          payload.utm = utm;
        }

        navigator.sendBeacon?.('/api/track', JSON.stringify(payload)) ||
          fetch('/api/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            keepalive: true,
          });
      } catch {
        // tracking must never break UX
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  return null;
}
