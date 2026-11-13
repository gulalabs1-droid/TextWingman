import * as Sentry from '@sentry/nextjs';

// Next.js loads this once per server runtime. Without it the Sentry server and
// edge configs are never imported, so server errors are not reported.
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

// Reports errors thrown in server components, route handlers and proxy.
export const onRequestError = Sentry.captureRequestError;
