'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { captureAttribution, getClientIdentity, persistAnalyticsEvent } from '@/lib/analytics';

export default function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTracked = useRef<string>('');

  useEffect(() => {
    const key = `${pathname}?${searchParams?.toString() || ''}`;
    if (key === lastTracked.current) return;
    lastTracked.current = key;

    captureAttribution();
    getClientIdentity();
    const timer = setTimeout(() => {
      persistAnalyticsEvent('page_view', {
        page_path: pathname,
        screen: `${window.screen.width}x${window.screen.height}`,
        title: document.title || null,
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  return null;
}
