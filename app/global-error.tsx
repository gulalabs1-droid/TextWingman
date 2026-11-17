'use client';

import { useEffect } from 'react';
import { reportError } from '@/lib/sentry-client';

// Catches errors thrown in the root layout, which app/error.tsx cannot.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    reportError(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b0f0c', color: '#f5f7ec', fontFamily: 'system-ui, -apple-system, sans-serif', padding: 16 }}>
        <div style={{ maxWidth: 420, textAlign: 'center' }}>
          <h1 style={{ fontSize: 24, marginBottom: 12 }}>Something went wrong</h1>
          <p style={{ color: '#abb7aa', marginBottom: 24 }}>Please try again. If it keeps happening, reload the page.</p>
          <button onClick={reset} style={{ padding: '10px 20px', borderRadius: 10, border: 0, background: '#d3ff68', color: '#14200e', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
