import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Check } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { CHANGELOG, CURRENT_VERSION, TYPE_CONFIG } from '@/lib/changelog';

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-gray-950">
      {/* Header */}
      <nav className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="transition-transform hover:scale-105">
            <Logo size="md" showText={true} className="cursor-pointer" />
          </Link>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" className="text-white hover:bg-white/10 rounded-xl text-sm">
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Page Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-purple-500/20 text-purple-300 px-4 py-2 rounded-full text-sm font-medium border border-purple-500/30 mb-4">
            v{CURRENT_VERSION}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
            What&apos;s New
          </h1>
          <p className="text-white/60 text-lg">
            Every update, improvement, and milestone — all in one place.
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500 via-purple-500/50 to-transparent" />

          <div className="space-y-8">
            {CHANGELOG.map((entry, idx) => {
              const config = TYPE_CONFIG[entry.type];
              const isLatest = idx === 0;
              const dateStr = new Date(entry.date + 'T12:00:00').toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
              });

              return (
                <div key={entry.version} className="relative pl-12">
                  {/* Timeline dot */}
                  <div className={`absolute left-0 top-1 w-10 h-10 rounded-xl flex items-center justify-center ${config.bg} border ${config.border} ${isLatest ? 'ring-2 ring-purple-500/50 ring-offset-2 ring-offset-gray-900' : ''}`}>
                    <span className="text-lg">{config.emoji}</span>
                  </div>

                  <div className={`rounded-2xl border p-6 transition-all ${
                    isLatest 
                      ? 'bg-white/10 border-purple-500/40 shadow-lg shadow-purple-500/10' 
                      : 'bg-white/5 border-white/10 hover:bg-white/[0.07]'
                  }`}>
                    {/* Version + Date + Type badge */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className="text-white font-bold text-lg">v{entry.version}</span>
                      <span className="text-white/40 text-sm">•</span>
                      <span className="text-white/50 text-sm">{dateStr}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${config.bg} ${config.color} border ${config.border}`}>
                        {config.label}
                      </span>
                      {isLatest && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-500 text-white animate-pulse">
                          Latest
                        </span>
                      )}
                    </div>

                    {/* Title + Description */}
                    <h2 className="text-xl font-bold text-white mb-2">{entry.title}</h2>
                    <p className="text-white/70 mb-4">{entry.description}</p>

                    {/* Highlights */}
                    <div className="space-y-2">
                      {entry.highlights.map((item, i) => (
                        <div key={i} className="flex items-start gap-2.5">
                          <div className="w-5 h-5 rounded-md bg-green-500/20 flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="h-3 w-3 text-green-400" />
                          </div>
                          <span className="text-white/80 text-sm">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer CTA */}
        <div className="text-center mt-16 mb-8">
          <p className="text-white/40 text-sm mb-4">We ship fast. Stay tuned for more.</p>
          <Button asChild className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold">
            <Link href="/app">Try the latest features →</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
