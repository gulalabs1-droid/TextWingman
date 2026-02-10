'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sparkles, CheckCircle2, Gift, ArrowRight, Loader2 } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { createClient } from '@/lib/supabase/client';
import { useParams } from 'next/navigation';

export default function InvitePage() {
  const params = useParams();
  const code = (params.code as string || '').toUpperCase();
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [result, setResult] = useState<{ success?: boolean; error?: string; days?: number; alreadyPro?: boolean } | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user ? { id: user.id, email: user.email || '' } : null);
      setCheckingAuth(false);
    };
    checkAuth();
  }, [supabase.auth]);

  const handleRedeem = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/invite/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ success: true, days: data.days });
      } else {
        setResult({ error: data.error, alreadyPro: data.alreadyPro });
      }
    } catch {
      setResult({ error: 'Something went wrong. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-900 to-purple-600 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block transition-transform hover:scale-105">
            <Logo size="md" showText={true} />
          </Link>
        </div>

        {/* Success State */}
        {result?.success ? (
          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-green-500/30 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">You&apos;re In!</h1>
            <p className="text-green-200 mb-1">
              {result.days}-day Pro access activated
            </p>
            <p className="text-white/60 text-sm mb-6">
              Unlimited replies + V2 Verified Mode unlocked
            </p>
            <Button asChild className="w-full h-14 text-lg font-bold rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white">
              <Link href="/app">
                Start Texting
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        ) : (
          /* Invite Card */
          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-purple-500/30 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
              <Gift className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">You&apos;re Invited!</h1>
            <p className="text-purple-200 mb-1">
              Free V2 Pro access — no payment needed
            </p>
            <p className="text-white/50 text-sm mb-6">
              Unlimited verified replies for 7 days
            </p>

            <div className="bg-white/5 rounded-xl p-4 mb-6 space-y-3">
              <div className="flex items-center gap-3 text-white/90 text-sm">
                <Sparkles className="h-4 w-4 text-green-400 flex-shrink-0" />
                Unlimited replies (no daily limit)
              </div>
              <div className="flex items-center gap-3 text-white/90 text-sm">
                <Sparkles className="h-4 w-4 text-green-400 flex-shrink-0" />
                V2 Verified Mode (3-agent pipeline)
              </div>
              <div className="flex items-center gap-3 text-white/90 text-sm">
                <Sparkles className="h-4 w-4 text-green-400 flex-shrink-0" />
                All tone styles + reply history
              </div>
            </div>

            {/* Invite Code Badge */}
            <div className="inline-flex items-center gap-2 bg-purple-500/20 px-4 py-2 rounded-full mb-6">
              <span className="text-purple-300 text-sm font-mono font-bold">{code}</span>
            </div>

            {result?.error && (
              <div className={`rounded-xl p-3 mb-4 text-sm ${
                result.alreadyPro 
                  ? 'bg-green-500/20 border border-green-500/30 text-green-200'
                  : 'bg-red-500/20 border border-red-500/30 text-red-200'
              }`}>
                {result.error}
                {result.alreadyPro && (
                  <Link href="/app" className="block mt-2 text-green-300 underline font-medium">
                    Go to App →
                  </Link>
                )}
              </div>
            )}

            {checkingAuth ? (
              <div className="flex items-center justify-center gap-2 text-white/60 py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                Checking...
              </div>
            ) : user ? (
              <div className="space-y-3">
                <p className="text-white/60 text-xs">Signed in as {user.email}</p>
                <Button
                  onClick={handleRedeem}
                  disabled={loading}
                  className="w-full h-14 text-lg font-bold rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-xl"
                >
                  {loading ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Activating...</>
                  ) : (
                    'Activate Free Pro Access'
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Button asChild className="w-full h-14 text-lg font-bold rounded-2xl bg-white text-purple-700 hover:bg-gray-100 shadow-xl">
                  <Link href={`/login?redirect=/invite/${code}`}>
                    Sign Up to Claim
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <p className="text-white/40 text-xs">
                  Already have an account? <Link href={`/login?redirect=/invite/${code}`} className="text-purple-300 underline">Log in</Link>
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
