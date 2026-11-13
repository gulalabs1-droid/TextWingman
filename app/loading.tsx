import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-ink flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-16 w-16 text-brand animate-spin mx-auto mb-4" />
        <p className="text-cream text-lg font-medium">Loading Text Wingman...</p>
      </div>
    </div>
  );
}
