import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-ink flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-panel border border-line rounded-2xl shadow-2xl shadow-black/40 p-8 text-center">
        <div className="text-6xl font-bold text-brand mb-4">404</div>
        <h2 className="text-2xl font-bold text-cream mb-2">
          Page Not Found
        </h2>
        <p className="text-sage mb-6">
          Oops! The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <div className="flex gap-3 justify-center flex-col sm:flex-row">
          <Button asChild className="bg-brand text-brand-ink hover:bg-brand-soft">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Link>
          </Button>
          <Button asChild variant="outline" className="border border-line bg-transparent text-cream hover:bg-white/5 hover:text-cream">
            <Link href="/app">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Try the App
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
