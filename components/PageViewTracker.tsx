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
    // Do not lose a visit when someone navigates or backgrounds the tab quickly.
    persistAnalyticsEvent('page_view', {
      page_path: pathname,
      screen: `${window.screen.width}x${window.screen.height}`,
      title: document.title || null,
    });
  }, [pathname, searchParams]);

  return null;
}
