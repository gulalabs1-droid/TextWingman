import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import SignOutButton from './sign-out-button'
import FeedbackSection from './feedback-section'
import ManageSubscriptionButton from './manage-subscription-button'
import { MessageCircle, Zap, Crown, Sparkles, TrendingUp, Settings, Shield, Megaphone, ArrowRight, Lock, User } from 'lucide-react'
import { LATEST_UPDATE, CURRENT_VERSION } from '@/lib/changelog'
import { isAdminEmail } from '@/lib/isAdmin'
import { Logo } from '@/components/Logo'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('full_name, email').eq('id', user.id).single()

  const { data: subscription } = await supabase
    .from('subscriptions').select('plan_type, status, current_period_end').eq('user_id', user.id).single()

  const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { count: userIdCount } = await supabase
    .from('usage_logs').select('*', { count: 'exact', head: true })
    .eq('user_id', user.id).gte('created_at', cutoffTime)
  const usageCount = userIdCount || 0

  const { data: recentReplies } = await supabase
    .from('reply_history').select('id, their_message, generated_replies, created_at')
    .eq('user_id', user.id).order('created_at', { ascending: false }).limit(3)

  const { count: totalReplies } = await supabase
    .from('reply_history').select('*', { count: 'exact', head: true }).eq('user_id', user.id)

  const isAdmin = isAdminEmail(user.email)

  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data: entitlement } = await adminSupabase
    .from('entitlements').select('tier, source, expires_at').eq('user_id', user.id).single()

  const hasEntitlementAccess = entitlement?.tier === 'pro' || entitlement?.tier === 'elite'
  const isSubActive = subscription?.status === 'active' || subscription?.status === 'trialing'
  const isPro = isSubActive || hasEntitlementAccess || isAdmin
  const isTrialEntitlement = !!entitlement?.expires_at

  let daysLeft: number | null = null
  let showCountdown = false
  if (entitlement?.expires_at) {
    daysLeft = Math.ceil((new Date(entitlement.expires_at).getTime() - Date.now()) / 86400000)
    showCountdown = true
  } else if (isPro && subscription?.current_period_end) {
    daysLeft = Math.ceil((new Date(subscription.current_period_end).getTime() - Date.now()) / 86400000)
    if (subscription.plan_type === 'weekly' || daysLeft <= 7) showCountdown = true
  }

  const usageLimit = 3
  const isAtLimit = !isPro && usageCount >= usageLimit
  const usagePercent = Math.min((usageCount / usageLimit) * 100, 100)

  const planLabel = isAdmin
    ? 'Owner'
    : isTrialEntitlement
      ? 'Trial'
      : isPro
        ? subscription?.plan_type === 'weekly' ? 'Pro Weekly'
          : subscription?.plan_type === 'annual' ? 'Pro Annual'
          : 'Pro'
        : 'Free'

  const planColor = isAdmin
    ? 'text-amber-400'
    : isTrialEntitlement || isPro
      ? 'text-emerald-400'
      : 'text-white/40'

  const email = profile?.email || user.email || ''
  const firstName = profile?.full_name?.split(' ')[0] || null

  return (
    <div className="min-h-screen bg-[#030305] relative overflow-hidden">
      {/* Ambient orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full" style={{ background: 'rgba(139,92,246,0.08)', filter: 'blur(120px)' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full" style={{ background: 'rgba(236,72,153,0.07)', filter: 'blur(120px)' }} />
      </div>

      {/* Nav */}
      <nav className="relative z-10 max-w-2xl mx-auto px-5 py-6">
        <div className="flex items-center justify-between">
          <Link href="/dashboard">
            <Logo size="sm" showText={true} />
          </Link>
          <div className="flex items-center gap-2">
            {/* Contextual status pill */}
            {isAdmin ? (
              <Link href="/admin" className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-bold hover:bg-amber-500/15 transition-all">
                <Settings className="h-3 w-3" /> Admin
              </Link>
            ) : isTrialEntitlement && daysLeft !== null ? (
              <Link href="/pricing" className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all ${
                daysLeft <= 1 ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/15'
                : daysLeft <= 3 ? 'bg-orange-500/10 border-orange-500/20 text-orange-400 hover:bg-orange-500/15'
                : 'bg-violet-500/10 border-violet-500/20 text-violet-400 hover:bg-violet-500/15'
              }`}>
                <Sparkles className="h-3 w-3" />
                {daysLeft <= 0 ? 'Trial expired' : `${daysLeft}d trial left`}
              </Link>
            ) : isPro ? (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold">
                <Shield className="h-3 w-3" /> Pro
              </span>
            ) : isAtLimit ? (
              <Link href="/pricing" className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] font-bold hover:bg-red-500/15 transition-all">
                <Lock className="h-3 w-3" /> Limit reached
              </Link>
            ) : null}
            <Link href="/profile" className="w-8 h-8 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-white/40 hover:text-white/70 hover:border-white/[0.15] transition-all">
              <User className="h-3.5 w-3.5" />
            </Link>
            <SignOutButton />
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-2xl mx-auto px-5 pb-16 space-y-4">

        {/* Greeting */}
        <div className="pt-2 pb-1">
          <h1 className="text-2xl md:text-3xl font-black text-white">
            {firstName ? `Hey ${firstName}.` : 'Your next reply sets the tone.'}
          </h1>
          {firstName && <p className="text-white/30 text-sm mt-1 font-medium">Your next reply sets the tone.</p>}
        </div>

        {/* Main CTA */}
        {isAtLimit ? (
          <Link href="/pricing" className="block rounded-3xl p-6 border border-red-500/20 bg-red-500/[0.06] hover:bg-red-500/[0.09] transition-all group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 font-black text-lg">3 free replies used today</p>
                <p className="text-white/35 text-sm mt-1">Go unlimited — never miss the right reply.</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(139,92,246,0.3)] group-hover:scale-105 transition-transform">
                <Crown className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-violet-300 text-sm font-bold">
              Upgrade to Pro <ArrowRight className="h-4 w-4" />
            </div>
          </Link>
        ) : (
          <Link href="/app" className={`block rounded-3xl p-6 border transition-all hover:scale-[1.01] active:scale-[0.99] group ${
            isAdmin ? 'bg-amber-500/[0.06] border-amber-500/20 hover:bg-amber-500/[0.09]'
            : isPro ? 'bg-emerald-500/[0.06] border-emerald-500/20 hover:bg-emerald-500/[0.09]'
            : 'bg-violet-500/[0.06] border-violet-500/20 hover:bg-violet-500/[0.09]'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/90 font-black text-lg">
                  {isAdmin ? 'Owner Mode — Elite access'
                    : isPro ? 'Verified replies. Never overthink a text.'
                    : 'Paste any message. Get 3 perfect replies.'}
                </p>
                <p className="text-white/35 text-sm mt-1 font-medium">
                  {isAdmin ? 'Full access to all features'
                    : isPro ? 'Draft → Rule-Check → Tone-Verify'
                    : 'AI-powered, tone-matched, strategy-aware'}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform ${
                isAdmin ? 'bg-amber-500/15' : isPro ? 'bg-emerald-500/15' : 'bg-violet-500/15'
              }`}>
                <MessageCircle className={`h-6 w-6 ${isAdmin ? 'text-amber-400' : isPro ? 'text-emerald-400' : 'text-violet-400'}`} />
              </div>
            </div>
            {/* Usage bar for free users */}
            {!isPro && !isAdmin && (
              <div className="mt-4 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-white/25 text-[10px] font-mono">{usageCount}/{usageLimit} today</span>
                  <span className="text-white/20 text-[10px]">resets in 24h</span>
                </div>
                <div className="w-full bg-white/[0.07] rounded-full h-1">
                  <div className={`h-1 rounded-full transition-all ${usagePercent >= 100 ? 'bg-red-500' : usagePercent >= 67 ? 'bg-orange-500' : 'bg-violet-500'}`}
                    style={{ width: `${usagePercent}%` }} />
                </div>
              </div>
            )}
            {/* Pro stats inline */}
            {isPro && !isAdmin && (
              <div className="mt-4 flex items-center gap-4">
                <span className="text-emerald-400/50 text-xs font-medium">∞ unlimited replies</span>
                {showCountdown && daysLeft !== null && (
                  <span className={`text-xs font-bold ${daysLeft <= 1 ? 'text-red-400' : daysLeft <= 3 ? 'text-orange-400' : 'text-white/25'}`}>
                    {daysLeft <= 0 ? 'Expires today' : `${daysLeft}d left`}
                  </span>
                )}
              </div>
            )}
          </Link>
        )}

        {/* Plan + stats row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4">
            <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.15em] mb-1.5">Plan</p>
            <p className={`font-black text-sm ${planColor}`}>{planLabel}</p>
            {!isPro && !isAdmin && (
              <Link href="/pricing" className="text-[10px] text-violet-400/60 hover:text-violet-400 font-bold mt-1 block transition-colors">Upgrade →</Link>
            )}
            {isPro && !isAdmin && !isTrialEntitlement && (
              <ManageSubscriptionButton compact />
            )}
          </div>
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4">
            <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.15em] mb-1.5">Today</p>
            <p className="font-black text-sm text-white/70">{usageCount}<span className="text-white/20 font-normal text-xs">/{isPro ? '∞' : usageLimit}</span></p>
          </div>
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4">
            <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.15em] mb-1.5">Total</p>
            <p className="font-black text-sm text-white/70">{totalReplies || 0}</p>
          </div>
        </div>

        {/* Upgrade nudge — free users only, single placement */}
        {!isPro && !isAdmin && (
          <Link href="/pricing" className="block rounded-2xl border border-violet-500/15 bg-violet-500/[0.05] p-4 hover:bg-violet-500/[0.09] transition-all group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-violet-500/15 flex items-center justify-center shrink-0">
                  <Crown className="h-4 w-4 text-violet-400" />
                </div>
                <div>
                  <p className="text-white/70 font-bold text-sm group-hover:text-white transition-colors">Unlock unlimited replies</p>
                  <p className="text-white/25 text-xs">Strategy coaching + V2 verified pipeline</p>
                </div>
              </div>
              <span className="text-violet-400/50 text-xs font-bold hidden sm:block">$9.99/wk →</span>
            </div>
          </Link>
        )}

        {/* Recent Wins */}
        {recentReplies && recentReplies.length > 0 && (
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-4 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.15em]">Recent Wins</span>
              </div>
              <Link href="/profile" className="text-[10px] text-violet-400/50 hover:text-violet-400 font-bold transition-colors">View all →</Link>
            </div>
            <div className="divide-y divide-white/[0.05]">
              {recentReplies.map((reply) => {
                let parsedReplies: Array<{tone: string; text: string}> = []
                try {
                  const raw = reply.generated_replies
                  parsedReplies = typeof raw === 'string' ? JSON.parse(raw) : Array.isArray(raw) ? raw : []
                } catch { parsedReplies = [] }
                const firstReply = parsedReplies?.[0]?.text || 'No reply'
                return (
                  <div key={reply.id} className="px-5 py-3">
                    <p className="text-white/20 text-[10px] font-medium mb-0.5 truncate">They said: &quot;{reply.their_message}&quot;</p>
                    <p className="text-white/65 text-sm font-medium truncate">&quot;{firstReply}&quot;</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* What's New */}
        <Link href="/changelog" className="block rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 hover:bg-white/[0.05] transition-all group">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500/15 flex items-center justify-center shrink-0">
              <Megaphone className="h-4 w-4 text-orange-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] font-bold text-orange-400/70">v{CURRENT_VERSION}</span>
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-orange-500/15 text-orange-400">NEW</span>
              </div>
              <p className="font-bold text-white/75 text-sm group-hover:text-white transition-colors truncate">{LATEST_UPDATE.title}</p>
              <p className="text-[11px] text-white/25 mt-0.5 line-clamp-1">{LATEST_UPDATE.description}</p>
            </div>
            <span className="text-white/15 group-hover:text-white/40 text-xs shrink-0 mt-1 transition-colors font-bold">→</span>
          </div>
        </Link>

        {/* Feedback */}
        <FeedbackSection
          userEmail={email}
          planType={!isPro ? 'Free' : `Pro ${subscription?.plan_type || ''}`}
        />

      </div>
    </div>
  )
}
