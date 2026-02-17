import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { SEO_GUIDES } from '@/lib/seo-guides';

export const metadata: Metadata = {
  title: 'Texting Guides — What to Say in Every Situation | Text Wingman',
  description: 'Free texting guides for every situation — how to reply to "wyd", what to do when left on read, flirting tips, first messages, and more. Backed by AI analysis.',
  keywords: ['texting guide', 'what to text', 'how to reply', 'texting tips', 'texting advice'],
  openGraph: {
    title: 'Texting Guides — What to Say in Every Situation',
    description: 'Free texting guides for every situation — backed by AI analysis of thousands of conversations.',
    type: 'website',
  },
};

export default function GuidesIndex() {
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Nav */}
      <nav className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="transition-transform hover:scale-105">
            <Logo size="md" showText={true} className="cursor-pointer" />
          </Link>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" className="text-white/60 hover:text-white hover:bg-white/[0.06] rounded-xl text-sm hidden sm:flex">
              <Link href="/features">Features</Link>
            </Button>
            <Button asChild size="sm" className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500 rounded-xl font-semibold shadow-lg shadow-violet-600/20">
              <Link href="/app">Try Free</Link>
            </Button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
            What to say in{' '}
            <span className="bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent">
              every situation.
            </span>
          </h1>
          <p className="text-lg text-white/50 max-w-xl mx-auto">
            Free texting guides with real examples — what to say, what not to say, and why. Backed by AI analysis.
          </p>
        </div>

        {/* Guide Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-16">
          {SEO_GUIDES.map(guide => (
            <Link
              key={guide.slug}
              href={`/guides/${guide.slug}`}
              className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5 hover:bg-white/[0.06] hover:border-white/[0.15] transition-all group"
            >
              <span className="text-3xl mb-3 block">{guide.heroEmoji}</span>
              <h2 className="font-bold text-white text-sm mb-2 group-hover:text-violet-300 transition-colors">{guide.title}</h2>
              <p className="text-white/40 text-xs leading-relaxed line-clamp-2">{guide.metaDescription}</p>
              <div className="flex items-center gap-1 mt-3 text-violet-400 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                Read guide <ArrowRight className="h-3 w-3" />
              </div>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center bg-gradient-to-br from-violet-600/15 to-fuchsia-600/15 border border-violet-500/20 rounded-3xl p-10 mb-16">
          <Sparkles className="h-8 w-8 text-violet-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-3">Skip the guides — get instant AI replies</h2>
          <p className="text-white/50 text-sm mb-6 max-w-md mx-auto">
            Paste what they sent and get 3 perfect replies in seconds. Or upload a screenshot and let AI read the whole conversation.
          </p>
          <Button asChild className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500 rounded-xl font-bold shadow-lg shadow-violet-600/20 px-8 h-12 text-base">
            <Link href="/app">
              Try Text Wingman Free <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
          <p className="text-white/25 text-xs mt-3">Free · No card · 5 replies per day</p>
        </div>
      </main>

      {/* Sticky mobile CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/90 to-transparent md:hidden z-50">
        <Button asChild className="w-full h-12 text-base font-bold rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-2xl shadow-violet-600/20">
          <Link href="/app">Get AI Replies Free →</Link>
        </Button>
      </div>
    </div>
  );
}
