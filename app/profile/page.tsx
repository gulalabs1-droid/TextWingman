'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Mail, Lock, Loader2, LogOut, Crown, Sparkles, Clock, MessageCircle, Trash2, AlertTriangle, ChevronRight, Shield, Zap, Star } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

type User = { id: string; email: string };
type HistoryItem = { id: string; their_message: string; generated_replies: { tone: string; text: string }[]; created_at: string };
type SavedThread = { id: string; name: string; type: string; updated_at: string; message_count: number; last_message: any };
type Subscription = { plan_type: 'weekly' | 'monthly' | 'annual'; status: 'active' | 'trialing' | 'canceled' | 'past_due'; current_period_end: string } | null;
type Entitlement = { tier: 'free' | 'pro' | 'elite'; source: string } | null;

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
  const [savedThreads, setSavedThreads] = useState<SavedThread[]>([]);
  const [suggestion, setSuggestion] = useState('');
  const [suggestionSubmitting, setSuggestionSubmitting] = useState(false);
  const [suggestionSubmitted, setSuggestionSubmitted] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    setDeleting(true);
    try {
      const res = await fetch('/api/account/delete', { method: 'DELETE' });
      if (res.ok) {
        await supabase.auth.signOut();
        window.location.href = '/';
      } else {
        const data = await res.json();
        toast({ title: 'Error', description: data.error || 'Failed to delete account', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Something went wrong. Please try again.', variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  const handleSuggestionSubmit = async () => {
    if (!suggestion.trim()) return;
    setSuggestionSubmitting(true);
    try {
      const res = await fetch('/api/suggestions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ suggestion: suggestion.trim() }) });
      if (res.ok) {
        setSuggestionSubmitted(true);
        setSuggestion('');
        toast({ title: 'Thanks for sharing!', description: 'Your feedback helps shape what we build next.' });
      }
    } catch { console.error('Failed to submit suggestion'); }
    finally { setSuggestionSubmitting(false); }
  };

  useEffect(() => { checkUser(); }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser({ id: user.id, email: user.email || '' });
        fetchHistory(user.id);
        fetchSavedThreads();
        fetchSubscription(user.id);
        fetchEntitlement(user.id);
      }
    } catch { console.error('Error checking user'); }
    finally { setLoading(false); }
  };

  const fetchSubscription = async (userId: string) => {
    try {
      const { data, error } = await supabase.from('subscriptions').select('plan_type, status, current_period_end').eq('user_id', userId).in('status', ['active', 'trialing']).maybeSingle();
      if (data && !error) setSubscription(data);
    } catch { console.error('Error fetching subscription'); }
  };

  const fetchEntitlement = async (userId: string) => {
    try {
      const { data, error } = await supabase.from('entitlements').select('tier, source').eq('user_id', userId).maybeSingle();
      if (data && !error) setEntitlement(data);
    } catch { console.error('Error fetching entitlement'); }
  };

  const fetchHistory = async (userId: string) => {
    try {
      const { data, error } = await supabase.from('reply_history').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20);
      if (error) throw error;
      setHistory(data || []);
    } catch { console.error('Error fetching history'); }
  };

  const fetchSavedThreads = async () => {
    try {
      const res = await fetch('/api/threads');
      if (res.ok) {
        const data = await res.json();
        setSavedThreads(data.threads || []);
      }
    } catch { console.error('Error fetching threads'); }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast({ title: 'Check your email', description: 'We sent you a confirmation link' });
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) {
          setUser({ id: data.user.id, email: data.user.email || '' });
          fetchHistory(data.user.id);
          toast({ title: 'Welcome back!', description: 'You are now signed in' });
        }
      }
    } catch (error: unknown) {
      toast({ title: 'Error', description: (error as Error).message || 'Authentication failed', variant: 'destructive' });
    } finally { setAuthLoading(false); }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setHistory([]);
    toast({ title: 'Signed out', description: 'See you next time!' });
  };

  const isPro = entitlement?.tier === 'pro' || entitlement?.tier === 'elite' || subscription?.status === 'active' || subscription?.status === 'trialing';
  const planLabel = entitlement?.tier === 'elite' ? 'Owner' : entitlement?.tier === 'pro' ? 'Pro' : (subscription?.status === 'active' || subscription?.status === 'trialing') ? (subscription?.status === 'trialing' ? 'Trial' : 'Pro') : 'Free';
  const planGradient = entitlement?.tier === 'elite' ? 'from-yellow-500 to-orange-500' : isPro ? 'from-emerald-500 to-cyan-500' : 'from-violet-600 to-fuchsia-600';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030305] flex items-center justify-center">
        <Loader2 className="h-6 w-6 text-violet-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030305] relative">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute w-[500px] h-[500px] rounded-full top-[-15%] left-[-10%]" style={{ background: 'rgba(139,92,246,0.12)', filter: 'blur(120px)' }} />
        <div className="absolute w-[400px] h-[400px] rounded-full bottom-[-10%] right-[-10%]" style={{ background: 'rgba(236,72,153,0.10)', filter: 'blur(120px)' }} />
      </div>

      <div className="relative z-10 max-w-lg mx-auto px-4 py-8 pb-20">
        {/* Nav */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/dashboard" className="w-9 h-9 rounded-2xl border border-white/[0.08] bg-white/[0.04] flex items-center justify-center text-white/40 hover:text-white/70 transition-all active:scale-90">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <Link href="/dashboard" className="transition-transform hover:scale-105">
            <Logo size="sm" showText={true} />
          </Link>
          <div className="w-9" />
        </div>

        {!user ? (
          /* Auth Form */
          <div className="rounded-3xl border border-white/[0.08] p-8 space-y-6" style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(40px)' }}>
            <div className="text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(139,92,246,0.3)]">
                <Crown className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-white font-black text-xl">{isSignUp ? 'Create Account' : 'Welcome Back'}</h1>
              <p className="text-white/35 text-sm">{isSignUp ? 'Sign up to save your history' : 'Sign in to access your account'}</p>
            </div>
            <form onSubmit={handleAuth} className="space-y-3">
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  className="w-full pl-10 pr-4 h-12 rounded-xl bg-white/[0.06] border border-white/[0.10] text-white placeholder-white/25 text-sm focus:outline-none focus:border-violet-500/40 transition-all" />
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
                  className="w-full pl-10 pr-4 h-12 rounded-xl bg-white/[0.06] border border-white/[0.10] text-white placeholder-white/25 text-sm focus:outline-none focus:border-violet-500/40 transition-all" />
              </div>
              <button type="submit" disabled={authLoading}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-black text-sm shadow-[0_4px_20px_rgba(139,92,246,0.3)] transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2">
                {authLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : isSignUp ? 'Create Account' : 'Sign In'}
              </button>
            </form>
            <p className="text-center">
              <button onClick={() => setIsSignUp(!isSignUp)} className="text-violet-400 hover:text-violet-300 transition-colors text-sm font-medium">
                {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
              </button>
            </p>
          </div>
        ) : (
          <div className="space-y-4">

            {/* Profile row */}
            <div className="rounded-3xl border border-white/[0.08] p-5 flex items-center gap-4" style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(40px)' }}>
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${planGradient} flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.2)] shrink-0`}>
                <span className="text-white font-black text-xl">{user.email[0].toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm truncate">{user.email}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full bg-gradient-to-r ${planGradient} text-white`}>{planLabel}</span>
                  {subscription?.current_period_end && isPro && (() => {
                    const daysLeft = Math.ceil((new Date(subscription.current_period_end).getTime() - Date.now()) / 86400000);
                    return daysLeft <= 7
                      ? <span key="days" className={`text-[10px] font-bold ${daysLeft <= 1 ? 'text-red-400' : daysLeft <= 3 ? 'text-orange-400' : 'text-white/40'}`}>{daysLeft <= 0 ? 'Expires today' : `${daysLeft}d left`}</span>
                      : <span key="renews" className="text-white/25 text-[10px]">Renews {new Date(subscription.current_period_end).toLocaleDateString()}</span>;
                  })()}
                </div>
              </div>
              <button onClick={handleSignOut} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/40 hover:text-white/70 hover:border-white/[0.15] text-xs font-bold transition-all active:scale-95 shrink-0">
                <LogOut className="h-3.5 w-3.5" /> Out
              </button>
            </div>

            {/* Plan banner */}
            {entitlement?.tier === 'elite' ? (
              <div className="rounded-2xl p-4 border border-yellow-500/25 bg-yellow-500/10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(251,191,36,0.3)]"><Crown className="h-5 w-5 text-white" /></div>
                <div><p className="text-yellow-300 font-black text-sm">Owner Access</p><p className="text-white/35 text-xs">Full access to everything</p></div>
              </div>
            ) : isPro ? (
              <div className="rounded-2xl p-4 border border-emerald-500/20 bg-emerald-500/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(52,211,153,0.3)]"><Shield className="h-5 w-5 text-white" /></div>
                  <div><p className="text-emerald-300 font-black text-sm">Pro Member</p><p className="text-white/35 text-xs">Unlimited replies unlocked</p></div>
                </div>
                {subscription && <span className="text-emerald-300/60 text-xs font-bold">{subscription.plan_type === 'weekly' ? '$9.99/wk' : subscription.plan_type === 'annual' ? '$99.99/yr' : '$9.99/mo'}</span>}
              </div>
            ) : (
              <Link href="/#pricing" className="rounded-2xl p-4 border border-violet-500/20 bg-violet-500/10 flex items-center justify-between group hover:border-violet-500/40 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(139,92,246,0.3)]"><Zap className="h-5 w-5 text-white" /></div>
                  <div><p className="text-violet-300 font-black text-sm">Upgrade to Pro</p><p className="text-white/35 text-xs">Unlimited replies + strategy</p></div>
                </div>
                <span className="text-violet-300 font-black text-sm">$9.99/wk →</span>
              </Link>
            )}

            {/* Quick links */}
            <div className="rounded-2xl border border-white/[0.08] overflow-hidden divide-y divide-white/[0.06]" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <Link href="/app" className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.04] transition-all group">
                <div className="flex items-center gap-3"><Sparkles className="h-4 w-4 text-violet-400" /><span className="text-white/70 text-sm font-medium">Open App</span></div>
                <ChevronRight className="h-4 w-4 text-white/20 group-hover:text-white/40 transition-colors" />
              </Link>
              {isPro && (
                <Link href="/billing" className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.04] transition-all group">
                  <div className="flex items-center gap-3"><Star className="h-4 w-4 text-emerald-400" /><span className="text-white/70 text-sm font-medium">Billing & Receipts</span></div>
                  <ChevronRight className="h-4 w-4 text-white/20 group-hover:text-white/40 transition-colors" />
                </Link>
              )}
              <a href={`mailto:gulalabs1@gmail.com?subject=Text Wingman Feedback&body=${encodeURIComponent(`\n\n---\nUser: ${user.email}\nPlan: ${planLabel}\nBrowser: ${typeof window !== 'undefined' ? navigator.userAgent : 'Unknown'}`)}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.04] transition-all group">
                <div className="flex items-center gap-3"><MessageCircle className="h-4 w-4 text-cyan-400" /><span className="text-white/70 text-sm font-medium">Report an Issue</span></div>
                <ChevronRight className="h-4 w-4 text-white/20 group-hover:text-white/40 transition-colors" />
              </a>
            </div>

            {/* Unified History — saved threads + coach sessions */}
            <div className="space-y-3">
              <p className="text-white/25 text-[9px] font-mono font-bold tracking-[0.4em] px-1 flex items-center gap-2"><Clock className="h-3 w-3" />HISTORY</p>
              {savedThreads.length === 0 && history.length === 0 ? (
                <div className="rounded-2xl border border-white/[0.08] p-8 text-center space-y-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <MessageCircle className="h-8 w-8 text-white/15 mx-auto" />
                  <p className="text-white/40 text-sm font-medium">No history yet</p>
                  <Link href="/app" className="inline-block px-4 py-2 rounded-xl bg-violet-500/15 border border-violet-500/25 text-violet-300 text-xs font-bold hover:bg-violet-500/25 transition-all">Start a session</Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Saved threads + coach sessions */}
                  {savedThreads.map((t) => {
                    const isCoach = t.type === 'coach';
                    const lastMsg = t.last_message;
                    const preview = lastMsg?.content || lastMsg?.text || null;
                    return (
                      <Link key={t.id} href="/app" className="block rounded-2xl border border-white/[0.08] p-4 space-y-2 hover:bg-white/[0.04] transition-all active:scale-[0.99]" style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <div className="flex items-center gap-2">
                          <div className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 ${isCoach ? 'bg-violet-500/20' : 'bg-white/[0.07]'}`}>
                            {isCoach
                              ? <Sparkles className="h-3 w-3 text-violet-400" />
                              : <MessageCircle className="h-3 w-3 text-white/40" />
                            }
                          </div>
                          <span className={`text-[9px] font-black uppercase tracking-widest ${isCoach ? 'text-violet-400/70' : 'text-white/30'}`}>{isCoach ? 'Coach' : 'Thread'}</span>
                          <span className="text-white/15 text-[9px] ml-auto">{new Date(t.updated_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-white/75 text-sm font-semibold truncate">{t.name}</p>
                        {preview && <p className="text-white/35 text-xs truncate">{preview}</p>}
                        <p className="text-white/20 text-[10px]">{t.message_count} messages</p>
                      </Link>
                    );
                  })}
                  {/* Reply history (quick generations without a thread) */}
                  {history.length > 0 && (
                    <>
                      <p className="text-white/15 text-[9px] font-mono font-bold tracking-[0.3em] px-1 pt-2">QUICK REPLIES</p>
                      {history.map((item) => {
                        let parsedReplies: Array<{tone: string; text: string}> = [];
                        try { const r = item.generated_replies; parsedReplies = typeof r === 'string' ? JSON.parse(r) : Array.isArray(r) ? r : []; } catch { parsedReplies = []; }
                        return (
                          <div key={item.id} className="rounded-2xl border border-white/[0.08] p-4 space-y-2.5" style={{ background: 'rgba(255,255,255,0.03)' }}>
                            <p className="text-white/50 text-xs font-medium bg-white/[0.05] px-3 py-2 rounded-xl truncate">{item.their_message}</p>
                            <div className="space-y-1.5">
                              {parsedReplies.slice(0, 3).map((reply, idx) => (
                                <div key={idx} className="flex items-start gap-2">
                                  <span className="text-[9px] font-black text-violet-400/60 uppercase mt-0.5 shrink-0 w-10">{reply.tone}</span>
                                  <p className="text-white/70 text-xs leading-relaxed">{reply.text}</p>
                                </div>
                              ))}
                            </div>
                            <p className="text-white/20 text-[10px] font-mono">{new Date(item.created_at).toLocaleDateString()}</p>
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Suggestion box */}
            <div className="rounded-2xl border border-white/[0.08] p-5 space-y-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div>
                <p className="text-white/60 text-sm font-bold">Help shape what&apos;s next</p>
                <p className="text-white/25 text-xs mt-0.5">You&apos;re early — your input matters</p>
              </div>
              {suggestionSubmitted ? (
                <p className="text-emerald-400 text-sm font-medium">✓ Thanks! We read every suggestion.</p>
              ) : (
                <div className="flex gap-2">
                  <input value={suggestion} onChange={(e) => setSuggestion(e.target.value)} placeholder="What would make this better?" maxLength={500}
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.10] text-white placeholder-white/20 text-sm focus:outline-none focus:border-violet-500/30 transition-all" />
                  <button onClick={handleSuggestionSubmit} disabled={suggestionSubmitting || !suggestion.trim()}
                    className="px-4 py-2.5 rounded-xl bg-violet-500/20 border border-violet-500/30 text-violet-300 text-sm font-bold hover:bg-violet-500/30 transition-all active:scale-95 disabled:opacity-30 shrink-0 flex items-center justify-center">
                    {suggestionSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send'}
                  </button>
                </div>
              )}
            </div>

            {/* Delete account */}
            <div className="pt-2">
              {!showDeleteConfirm ? (
                <button onClick={() => setShowDeleteConfirm(true)} className="flex items-center justify-center gap-2 text-red-400/40 hover:text-red-400/70 text-xs transition-colors w-full py-2">
                  <Trash2 className="h-3.5 w-3.5" /> Delete my account
                </button>
              ) : (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/[0.06] p-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-red-400 font-bold text-sm">This cannot be undone</p>
                      <p className="text-white/40 text-xs mt-1">Permanently deletes your account, history, subscription, and all data.</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-white/40 text-xs block mb-1.5">Type <span className="font-bold text-red-400">DELETE</span> to confirm</label>
                    <input value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} placeholder="DELETE"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-red-500/30 text-white placeholder-white/20 text-sm focus:outline-none transition-all" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }}
                      className="flex-1 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.10] text-white/50 text-sm font-bold hover:bg-white/[0.08] transition-all">Cancel</button>
                    <button onClick={handleDeleteAccount} disabled={deleteConfirmText !== 'DELETE' || deleting}
                      className="flex-1 py-2.5 rounded-xl bg-red-600/80 text-white text-sm font-bold hover:bg-red-600 transition-all disabled:opacity-30 flex items-center justify-center gap-2">
                      {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete Forever'}
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
