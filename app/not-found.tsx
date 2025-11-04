import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-purple-600 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/95 backdrop-blur rounded-2xl shadow-2xl p-8 text-center">
        <div className="text-6xl font-bold text-purple-600 mb-4">404</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Page Not Found
        </h2>
        <p className="text-gray-600 mb-6">
          Oops! The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <div className="flex gap-3 justify-center flex-col sm:flex-row">
          <Button asChild className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Link>
          </Button>
          <Button asChild variant="outline">
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
