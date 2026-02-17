import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, Check, X, Sparkles, MessageCircle, Lightbulb, Target } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { SEO_GUIDES, getGuideBySlug } from '@/lib/seo-guides';
import { notFound } from 'next/navigation';

export async function generateStaticParams() {
  return SEO_GUIDES.map(guide => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) return { title: 'Guide Not Found' };

  return {
    title: guide.metaTitle,
    description: guide.metaDescription,
    keywords: guide.keywords,
    openGraph: {
      title: guide.metaTitle,
      description: guide.metaDescription,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: guide.metaTitle,
      description: guide.metaDescription,
    },
  };
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: guide.metaTitle,
    description: guide.metaDescription,
    keywords: guide.keywords.join(', '),
    author: { '@type': 'Organization', name: 'Text Wingman' },
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Nav */}
      <nav className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="transition-transform hover:scale-105">
            <Logo size="md" showText={true} className="cursor-pointer" />
          </Link>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" className="text-white/60 hover:text-white hover:bg-white/[0.06] rounded-xl text-sm">
              <Link href="/guides">All Guides</Link>
            </Button>
            <Button asChild size="sm" className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500 rounded-xl font-semibold shadow-lg shadow-violet-600/20">
              <Link href="/app">Try Free</Link>
            </Button>
          </div>
        </div>
      </nav>

      <article className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-white/30 mb-8">
          <Link href="/" className="hover:text-white/60 transition">Home</Link>
          <span>/</span>
          <Link href="/guides" className="hover:text-white/60 transition">Guides</Link>
          <span>/</span>
          <span className="text-white/50">{guide.title}</span>
        </div>

        {/* Hero */}
        <div className="mb-12">
          <span className="text-4xl mb-4 block">{guide.heroEmoji}</span>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">{guide.title}</h1>
          <p className="text-lg text-white/50 leading-relaxed">{guide.situation}</p>
        </div>

        {/* Their message */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle className="h-4 w-4 text-violet-400" />
            <span className="text-xs font-bold text-white/40 uppercase tracking-wider">They sent</span>
          </div>
          <div className="bg-white/[0.06] border border-white/[0.10] rounded-2xl rounded-bl-md px-5 py-3 max-w-[80%]">
            <p className="text-white/80 text-base">&ldquo;{guide.theirMessage}&rdquo;</p>
          </div>
        </div>

        {/* Bad reply */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-3">
            <X className="h-4 w-4 text-red-400" />
            <span className="text-xs font-bold text-red-400/60 uppercase tracking-wider">Don&apos;t say this</span>
          </div>
          <div className="bg-red-500/[0.06] border border-red-500/20 rounded-2xl p-5">
            <p className="text-red-200/80 text-base mb-2">&ldquo;{guide.badReply}&rdquo;</p>
            <p className="text-red-400/60 text-sm">{guide.badWhy}</p>
          </div>
        </div>

        {/* Good replies */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-5">
            <Check className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-bold text-emerald-400/60 uppercase tracking-wider">Say this instead</span>
          </div>
          <div className="space-y-4">
            {guide.goodReplies.map((reply, i) => (
              <div key={i} className="bg-emerald-500/[0.04] border border-emerald-500/15 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 uppercase tracking-wider">
                    {reply.tone}
                  </span>
                </div>
                <p className="text-emerald-100 text-lg font-medium mb-2">&ldquo;{reply.text}&rdquo;</p>
                <p className="text-emerald-400/60 text-sm">{reply.why}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tips */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-5">
            <Lightbulb className="h-4 w-4 text-amber-400" />
            <span className="text-xs font-bold text-amber-400/60 uppercase tracking-wider">Pro tips</span>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6">
            <ul className="space-y-3">
              {guide.tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-3 text-white/60 text-sm">
                  <span className="text-amber-400/60 font-bold shrink-0">{i + 1}.</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 border border-violet-500/20 rounded-3xl p-8 text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Sparkles className="h-5 w-5 text-violet-400" />
            <h2 className="text-xl font-bold text-white">Get custom replies for your situation</h2>
          </div>
          <p className="text-white/50 text-sm mb-6 max-w-md mx-auto">
            Paste what they sent (or upload a screenshot) and get 3 AI-crafted replies in seconds — tailored to your exact conversation.
          </p>
          <Button asChild className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500 rounded-xl font-bold shadow-lg shadow-violet-600/20 px-8 h-12 text-base">
            <Link href="/app">
              Try Text Wingman Free <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
          <p className="text-white/25 text-xs mt-3">Free · No card · Works with any messaging app</p>
        </div>

        {/* Related guides */}
        <div className="mb-16">
          <h3 className="text-sm font-bold text-white/40 uppercase tracking-wider mb-4">More texting guides</h3>
          <div className="grid grid-cols-2 gap-3">
            {SEO_GUIDES.filter(g => g.slug !== guide.slug).slice(0, 4).map(g => (
              <Link
                key={g.slug}
                href={`/guides/${g.slug}`}
                className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 hover:bg-white/[0.06] transition-all"
              >
                <span className="text-lg mb-2 block">{g.heroEmoji}</span>
                <p className="text-white/80 text-sm font-medium leading-snug">{g.title}</p>
              </Link>
            ))}
          </div>
        </div>
      </article>

      {/* Sticky mobile CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/90 to-transparent md:hidden z-50">
        <Button asChild className="w-full h-12 text-base font-bold rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-2xl shadow-violet-600/20">
          <Link href="/app">Get AI Replies Free →</Link>
        </Button>
      </div>
    </div>
  );
}
