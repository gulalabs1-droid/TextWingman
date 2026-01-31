'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';
import { Sparkles, MessageCircle } from 'lucide-react';

type ShareData = {
  theirMessage: string;
  myReply: string;
  tone?: 'shorter' | 'spicier' | 'softer';
  type?: 'best' | 'playful' | 'direct' | 'escalation';
};

const TONE_CONFIG = {
  shorter: {
    label: 'Shorter',
    gradient: 'from-blue-500 to-cyan-500',
    emoji: '⚡',
  },
  spicier: {
    label: 'Spicier',
    gradient: 'from-rose-500 to-pink-500',
    emoji: '🔥',
  },
  softer: {
    label: 'Softer',
    gradient: 'from-green-500 to-emerald-500',
    emoji: '💚',
  },
  best: {
    label: 'Best Option',
    gradient: 'from-green-500 to-emerald-500',
    emoji: '✅',
  },
  playful: {
    label: 'Playful',
    gradient: 'from-purple-500 to-pink-500',
    emoji: '😏',
  },
  direct: {
    label: 'Direct',
    gradient: 'from-blue-500 to-indigo-500',
    emoji: '🎯',
  },
  escalation: {
    label: 'Escalation',
    gradient: 'from-orange-500 to-red-500',
    emoji: '🔥',
  },
};

export default function SharePage() {
  const params = useParams();
  const [shareData, setShareData] = useState<ShareData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    try {
      if (params.slug) {
        const decoded = atob(params.slug as string);
        const data = JSON.parse(decoded);
        setShareData(data);
      }
    } catch (err) {
      setError(true);
    }
  }, [params.slug]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-white/95 backdrop-blur">
          <CardContent className="p-8 text-center space-y-4">
            <div className="text-6xl mb-4">😅</div>
            <h1 className="text-2xl font-bold text-gray-900">Oops!</h1>
            <p className="text-gray-600">This share link isn&apos;t valid.</p>
            <Button asChild className="bg-gradient-to-r from-purple-600 to-indigo-600">
              <Link href="/app">Try Text Wingman</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!shareData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  const styleKey = shareData.type || shareData.tone || 'best';
  const config = TONE_CONFIG[styleKey as keyof typeof TONE_CONFIG];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <Link href="/" className="inline-block transition-transform hover:scale-105">
            <Logo size="lg" showText={true} />
          </Link>
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              Check out this reply! 🔥
            </h1>
            <p className="text-purple-200">
              AI-powered by Text Wingman
            </p>
          </div>
        </div>

        {/* Share Card */}
        <Card className="bg-white/95 backdrop-blur-xl border-0 shadow-2xl rounded-3xl overflow-hidden">
          <div className={`h-2 bg-gradient-to-r ${config.gradient}`} />
          
          <CardContent className="p-8 space-y-6">
            {/* Their Message */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-500">
                <MessageCircle className="h-4 w-4" />
                <span>They said:</span>
              </div>
              <div className="bg-gray-100 rounded-2xl p-4 border-l-4 border-gray-300">
                <p className="text-gray-800 text-lg italic">
                  &ldquo;{shareData.theirMessage}&rdquo;
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
              <Sparkles className="h-5 w-5 text-purple-500" />
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
            </div>

            {/* My Reply */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-500">
                <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${config.gradient}`} />
                <span>I replied with ({config.label} {config.emoji}):</span>
              </div>
              <div className={`bg-gradient-to-br ${config.gradient} rounded-2xl p-6 shadow-xl`}>
                <p className="text-white text-lg font-medium leading-relaxed">
                  &ldquo;{shareData.myReply}&rdquo;
                </p>
              </div>
            </div>

            {/* Success Badge */}
            <div className="flex items-center justify-center gap-2 py-4">
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-2 rounded-full font-bold text-sm shadow-lg">
                ✨ Crafted with AI
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center space-y-4">
          <p className="text-purple-200 text-lg font-medium">
            Want perfect replies like this?
          </p>
          <Button 
            asChild 
            size="lg"
            className="bg-white text-purple-700 hover:bg-gray-100 rounded-2xl font-bold text-lg px-8 h-14 shadow-2xl hover:shadow-purple-500/50 transition-all hover:scale-105"
          >
            <Link href="/app">
              <Sparkles className="h-5 w-5 mr-2" />
              Try Text Wingman Free
            </Link>
          </Button>
          <p className="text-purple-300 text-sm">
            Get 5 free AI replies every day ⚡
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 pt-8">
          <div className="text-center space-y-2">
            <div className="text-3xl">⚡</div>
            <p className="text-purple-200 text-sm font-medium">Instant Replies</p>
          </div>
          <div className="text-center space-y-2">
            <div className="text-3xl">🎯</div>
            <p className="text-purple-200 text-sm font-medium">3 Tones</p>
          </div>
          <div className="text-center space-y-2">
            <div className="text-3xl">✨</div>
            <p className="text-purple-200 text-sm font-medium">AI-Powered</p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-8 border-t border-white/10">
          <p className="text-purple-300 text-xs">
            &copy; 2024 Text Wingman. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
