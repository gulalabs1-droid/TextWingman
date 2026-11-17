// Browser-side Sentry, loaded on demand. The SDK (with session replay) is
// about 115 KB gzipped, so it is kept out of every page's first load: it
// starts once the browser is idle, or straight away when an error needs
// reporting. Nothing is downloaded when no DSN is configured.

type SentryModule = typeof import('@sentry/nextjs');

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

let loaded: SentryModule | undefined;
let loading: Promise<SentryModule | undefined> | undefined;

export function loadSentry(): Promise<SentryModule | undefined> {
  if (!SENTRY_DSN || typeof window === 'undefined') return Promise.resolve(undefined);
  loading ??= import('@sentry/nextjs')
    .then((Sentry) => {
      Sentry.init({
        dsn: SENTRY_DSN,
        // Capture 10% of transactions for performance monitoring
        tracesSampleRate: 0.1,
        // Session replays only on errors (saves quota)
        replaysSessionSampleRate: 0,
        replaysOnErrorSampleRate: 1.0,
        // Filter out noisy/expected errors
        ignoreErrors: [
          'ResizeObserver loop limit exceeded',
          'ResizeObserver loop completed with undelivered notifications',
          'Non-Error promise rejection captured',
          'Network request failed',
          'Failed to fetch',
          'Load failed',
        ],
        integrations: [
          Sentry.replayIntegration({
            maskAllText: true,
            blockAllMedia: true,
          }),
        ],
        environment: process.env.NODE_ENV,
      });
      loaded = Sentry;
      return Sentry;
    })
    .catch(() => undefined);
  return loading;
}

/** The SDK if it has finished loading, for synchronous hooks. */
export function loadedSentry(): SentryModule | undefined {
  return loaded;
}

/** Report an error caught by an error boundary. */
export function reportError(error: unknown) {
  void loadSentry().then((Sentry) => Sentry?.captureException(error));
}
