// Client-side instrumentation. Runs before the app becomes interactive, so it
// stays tiny: Sentry itself is loaded later by lib/sentry-client.
// https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation-client

import { loadSentry, loadedSentry } from '@/lib/sentry-client';

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  const start = () => { void loadSentry(); };
  // Errors before this point are still caught: error boundaries load the SDK on demand.
  if ('requestIdleCallback' in window) window.requestIdleCallback(start, { timeout: 4000 });
  else setTimeout(start, 2000);
}

// Lets Sentry trace client-side navigations once it has loaded.
export function onRouterTransitionStart(url: string, navigationType: 'push' | 'replace' | 'traverse') {
  loadedSentry()?.captureRouterTransitionStart(url, navigationType);
}
