'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

// Catches errors thrown in the root layout, which app/error.tsx cannot.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b0b0f', color: '#f5f5f7', fontFamily: 'system-ui, -apple-system, sans-serif', padding: 16 }}>
        <div style={{ maxWidth: 420, textAlign: 'center' }}>
          <h1 style={{ fontSize: 24, marginBottom: 12 }}>Something went wrong</h1>
          <p style={{ opacity: 0.75, marginBottom: 24 }}>Please try again. If it keeps happening, reload the page.</p>
          <button onClick={reset} style={{ padding: '10px 20px', borderRadius: 10, border: 0, background: '#7c3aed', color: '#fff', fontSize: 16, cursor: 'pointer' }}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
