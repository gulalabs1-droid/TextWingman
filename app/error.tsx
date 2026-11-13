'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import * as Sentry from '@sentry/nextjs';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
    if (process.env.NODE_ENV !== 'production') console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-panel border border-line rounded-2xl shadow-2xl shadow-black/40 p-8 text-center">
        <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-cream mb-4">Oops! Something went wrong</h1>
        <p className="text-sage mb-6">Don&apos;t worry, it&apos;s not you — it&apos;s us. We&apos;re on it!</p>
        <div className="flex gap-3 justify-center">
          <Button
            onClick={reset}
            className="bg-brand text-brand-ink hover:bg-brand-soft"
          >
            Try again
          </Button>
          <Button
            onClick={() => window.location.href = '/'}
            variant="outline"
            className="border border-line bg-transparent text-cream hover:bg-white/5 hover:text-cream"
          >
            Go home
          </Button>
        </div>
      </div>
    </div>
  );
}
