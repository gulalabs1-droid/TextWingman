'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Mail, Lock, Loader2, LogOut, Crown, Sparkles, Clock, MessageCircle } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

type User = {
  id: string;
  email: string;
};

type HistoryItem = {
  id: string;
  their_message: string;
  generated_replies: { tone: string; text: string }[];
  created_at: string;
};

type Subscription = {
  plan_type: 'weekly' | 'monthly' | 'annual';
  status: 'active' | 'canceled' | 'past_due';
  current_period_end: string;
} | null;

type Entitlement = {
  tier: 'free' | 'pro' | 'elite';
  source: string;
} | null;

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<Subscription>(null);
  const [entitlement, setEntitlement] = useState<Entitlement>(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [suggestion, setSuggestion] = useState('');
  const [suggestionSubmitting, setSuggestionSubmitting] = useState(false);
  const [suggestionSubmitted, setSuggestionSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSuggestionSubmit = async () => {
    if (!suggestion.trim()) return;
    setSuggestionSubmitting(true);
    try {
      const res = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suggestion: suggestion.trim() }),
      });
      if (res.ok) {
        setSuggestionSubmitted(true);
        setSuggestion('');
        toast({
          title: 'Thanks for sharing!',
          description: 'Your feedback helps shape what we build next.',
        });
      }
    } catch (error) {
      console.error('Failed to submit suggestion:', error);
    } finally {
      setSuggestionSubmitting(false);
    }
  };

  useEffect(() => {
    checkUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser({ id: user.id, email: user.email || '' });
        fetchHistory(user.id);
        fetchSubscription(user.id);
        fetchEntitlement(user.id);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscription = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('plan_type, status, current_period_end')
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();

      if (data && !error) {
        console.log('Subscription found:', data);
        setSubscription(data);
      } else if (error) {
        console.error('Subscription fetch error:', error);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  };

  const fetchEntitlement = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('entitlements')
        .select('tier, source')
        .eq('user_id', userId)
        .maybeSingle();

      if (data && !error) {
        console.log('Entitlement found:', data);
        setEntitlement(data);
      }
    } catch (error) {
      console.error('Error fetching entitlement:', error);
    }
  };

  const fetchHistory = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('reply_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        toast({
          title: 'Check your email',
          description: 'We sent you a confirmation link',
        });
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        if (data.user) {
          setUser({ id: data.user.id, email: data.user.email || '' });
          fetchHistory(data.user.id);
          toast({
            title: 'Welcome back!',
            description: 'You are now signed in',
          });
        }
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Authentication failed',
        variant: 'destructive',
      });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setHistory([]);
    toast({
      title: 'Signed out',
      description: 'See you next time!',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button asChild variant="ghost" size="sm" className="text-white/90 hover:text-white hover:bg-white/10 rounded-xl">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <Link href="/dashboard" className="transition-transform hover:scale-105">
            <Logo size="sm" showText={true} />
          </Link>
          <div className="w-20" />
        </div>

        {!user ? (
          /* Auth Form */
          <Card className="bg-white/95 backdrop-blur rounded-3xl overflow-hidden">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Crown className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold">
                {isSignUp ? 'Create Account' : 'Welcome Back'}
              </CardTitle>
              <CardDescription>
                {isSignUp ? 'Sign up to save your reply history' : 'Sign in to access your history'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pb-8">
              <form onSubmit={handleAuth} className="space-y-4">
                <div className="space-y-2">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12 rounded-xl"
                      required
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 h-12 rounded-xl"
                      required
                      minLength={6}
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={authLoading}
                  className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl"
                >
                  {authLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : isSignUp ? (
                    'Create Account'
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
              <div className="text-center">
                <button
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-sm text-purple-600 hover:text-purple-800"
                >
                  {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                </button>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Profile & History */
          <div className="space-y-6">
            {/* Profile Card */}
            <Card className="bg-white/95 backdrop-blur rounded-3xl overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                      entitlement?.tier === 'elite' || entitlement?.tier === 'pro'
                        ? 'bg-gradient-to-br from-yellow-500 to-orange-500'
                        : subscription?.status === 'active' 
                          ? 'bg-gradient-to-br from-green-500 to-emerald-500' 
                          : 'bg-gradient-to-br from-purple-600 to-pink-600'
                    }`}>
                      <span className="text-2xl text-white font-bold">
                        {user.email[0].toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{user.email}</p>
                      <p className={`text-sm ${
                        entitlement?.tier === 'elite' || entitlement?.tier === 'pro'
                          ? 'text-orange-600 font-semibold'
                          : subscription?.status === 'active' 
                            ? 'text-green-600 font-semibold' 
                            : 'text-gray-500'
                      }`}>
                        {entitlement?.tier === 'elite' 
                          ? '👑 Owner Access'
                          : entitlement?.tier === 'pro'
                            ? '⭐ Pro (Entitlement)'
                            : subscription?.status === 'active' 
                              ? `Pro ${subscription.plan_type.charAt(0).toUpperCase() + subscription.plan_type.slice(1)}` 
                              : 'Free Plan'}
                      </p>
                      {subscription?.status === 'active' && subscription.current_period_end && (() => {
                        const endDate = new Date(subscription.current_period_end);
                        const now = new Date();
                        const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                        const showCountdown = subscription.plan_type === 'weekly' || daysLeft <= 7;
                        return showCountdown ? (
                          <p className={`text-xs font-medium ${daysLeft <= 1 ? 'text-red-500' : daysLeft <= 3 ? 'text-orange-500' : 'text-purple-500'}`}>
                            {daysLeft <= 0 ? 'Expires today' : daysLeft === 1 ? '1 day left' : `${daysLeft} days left`}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-400">
                            Renews {endDate.toLocaleDateString()}
                          </p>
                        );
                      })()}
                    </div>
                  </div>
                  <Button
                    onClick={handleSignOut}
                    variant="outline"
                    size="sm"
                    className="rounded-xl"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Upgrade CTA or Subscription/Entitlement Info */}
            {entitlement?.tier === 'elite' ? (
              <Card className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-3xl overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Crown className="h-8 w-8" />
                      <div>
                        <p className="font-bold text-lg">👑 Owner Access</p>
                        <p className="text-yellow-100 text-sm">Full access to all features</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : entitlement?.tier === 'pro' ? (
              <Card className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-3xl overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Sparkles className="h-8 w-8" />
                      <div>
                        <p className="font-bold text-lg">⭐ Pro Access</p>
                        <p className="text-blue-100 text-sm">Unlimited replies unlocked</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : subscription?.status === 'active' ? (
              <Card className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-3xl overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Crown className="h-8 w-8" />
                      <div>
                        <p className="font-bold text-lg">Pro Member</p>
                        <p className="text-green-100 text-sm">Unlimited replies unlocked</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">${subscription.plan_type === 'weekly' ? '9.99/wk' : subscription.plan_type === 'annual' ? '99.99/yr' : '9.99/wk'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-3xl overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Sparkles className="h-8 w-8" />
                      <div>
                        <p className="font-bold text-lg">Upgrade to Pro</p>
                        <p className="text-purple-100 text-sm">Unlimited replies + history</p>
                      </div>
                    </div>
                    <Button asChild className="bg-white text-purple-700 hover:bg-gray-100 font-bold rounded-xl">
                      <Link href="/#pricing">$9.99/wk</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* History */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Reply History
              </h2>
              {history.length === 0 ? (
                <Card className="bg-white/10 backdrop-blur border-white/20 rounded-3xl">
                  <CardContent className="p-8 text-center">
                    <MessageCircle className="h-12 w-12 text-purple-300 mx-auto mb-4" />
                    <p className="text-white font-medium">No history yet</p>
                    <p className="text-purple-200 text-sm">Generate some replies to see them here</p>
                    <Button asChild className="mt-4 bg-white text-purple-700 hover:bg-gray-100 rounded-xl">
                      <Link href="/app">Start Generating</Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {history.map((item) => (
                    <Card key={item.id} className="bg-white/95 backdrop-blur rounded-2xl overflow-hidden">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Their message:</p>
                            <p className="text-gray-700 text-sm bg-gray-100 p-2 rounded-lg">
                              {item.their_message}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Your replies:</p>
                            <div className="space-y-2">
                              {(() => {
                                // Parse generated_replies - could be JSON string or already parsed array
                                let parsedReplies: Array<{tone: string; text: string}> = [];
                                try {
                                  const raw = item.generated_replies;
                                  if (typeof raw === 'string') {
                                    parsedReplies = JSON.parse(raw);
                                  } else if (Array.isArray(raw)) {
                                    parsedReplies = raw;
                                  }
                                } catch {
                                  parsedReplies = [];
                                }
                                return parsedReplies?.slice(0, 3).map((reply, idx) => (
                                  <div key={idx} className="text-sm p-2 rounded-lg bg-purple-50 border border-purple-100">
                                    <span className="text-purple-600 font-medium">{reply.tone}:</span> {reply.text}
                                  </div>
                                ));
                              })()}
                            </div>
                          </div>
                          <p className="text-xs text-gray-400">
                            {new Date(item.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Help Shape What's Next - Suggestion Box */}
            <div className="pt-6 border-t border-white/10">
              <h3 className="text-white font-medium text-center mb-2">Help shape what&apos;s next</h3>
              <p className="text-white/50 text-xs text-center mb-3">You&apos;re early — your input matters</p>
              {suggestionSubmitted ? (
                <p className="text-green-400 text-sm text-center">✓ Thanks! We read every suggestion.</p>
              ) : (
                <div className="flex gap-2">
                  <Input
                    value={suggestion}
                    onChange={(e) => setSuggestion(e.target.value)}
                    placeholder="What would make this better?"
                    className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-xl"
                    maxLength={500}
                  />
                  <Button
                    onClick={handleSuggestionSubmit}
                    disabled={suggestionSubmitting || !suggestion.trim()}
                    className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-4"
                  >
                    {suggestionSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send'}
                  </Button>
                </div>
              )}
            </div>

            {/* Billing Link - for Pro users */}
            {subscription?.status === 'active' && (
              <Link 
                href="/billing"
                className="block pt-4 text-center text-purple-300 hover:text-white text-sm transition-colors"
              >
                View billing & receipts →
              </Link>
            )}

            {/* Report an Issue - Lightweight Support */}
            <div className="pt-4 border-t border-white/10 mt-4">
              <p className="text-white/50 text-sm text-center mb-3">
                Something feel off? Tell us — we read everything.
              </p>
              <a
                href={`mailto:gulalabs1@gmail.com?subject=Text Wingman Feedback&body=${encodeURIComponent(
                  `\n\n---\nUser: ${user.email}\nPlan: ${subscription?.status === 'active' ? `Pro ${subscription.plan_type}` : 'Free'}\nBrowser: ${typeof window !== 'undefined' ? navigator.userAgent : 'Unknown'}`
                )}`}
                className="flex items-center justify-center gap-2 text-purple-300 hover:text-white text-sm transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                Report an issue
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
