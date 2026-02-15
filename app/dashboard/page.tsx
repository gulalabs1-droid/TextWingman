import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import SignOutButton from './sign-out-button'
import FeedbackSection from './feedback-section'
import ManageSubscriptionButton from './manage-subscription-button'
import { MessageCircle, Zap, Crown, Sparkles, TrendingUp, Settings, CreditCard, Lock, AlertCircle, User, Shield, Megaphone } from 'lucide-react'
import { LATEST_UPDATE, CURRENT_VERSION, TYPE_CONFIG } from '@/lib/changelog'
import { isAdminEmail } from '@/lib/isAdmin'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch profile data
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', user.id)
    .single()

  // Fetch subscription data
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan_type, status, current_period_end')
    .eq('user_id', user.id)
    .single()

  // Get usage count (24-hour rolling window to match generate API)
  const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  
  // Check usage by user_id first
  const { count: userIdCount } = await supabase
    .from('usage_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', cutoffTime)
  
  // Use the count (will be 0 if no logs with user_id yet)
  const usageCount = userIdCount || 0

  // Fetch recent replies for this user
  const { data: recentReplies } = await supabase
    .from('reply_history')
    .select('id, their_message, generated_replies, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(3)

  // Get total reply count for stats
  const { count: totalReplies } = await supabase
    .from('reply_history')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  // Fetch style stats (tone preferences from copy_logs)
  const { data: copyLogs } = await supabase
    .from('copy_logs')
    .select('tone')
    .eq('user_id', user.id)

  // Calculate favorite tone
  let favoriteTone: string | null = null
  let totalCopies = 0
  if (copyLogs && copyLogs.length > 0) {
    totalCopies = copyLogs.length
    const toneCounts: Record<string, number> = {}
    copyLogs.forEach(log => {
      if (log.tone) {
        toneCounts[log.tone] = (toneCounts[log.tone] || 0) + 1
      }
    })
    let maxCount = 0
    for (const [tone, count] of Object.entries(toneCounts)) {
      if (count > maxCount) {
        maxCount = count
        favoriteTone = tone
      }
    }
  }

  // Format tone label
  const toneLabels: Record<string, string> = {
    shorter: 'Shorter',
    spicier: 'Spicier', 
    softer: 'Softer',
  }
  const toneEmojis: Record<string, string> = {
    shorter: '⚡',
    spicier: '🔥',
    softer: '💚',
  }

  // Check if user is admin
  const isAdmin = isAdminEmail(user.email)
  
  // Check entitlements table for admin/elite access
  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data: entitlement } = await adminSupabase
    .from('entitlements')
    .select('tier, source, expires_at')
    .eq('user_id', user.id)
    .single()
  
  // Admin or entitlement-based Pro access
  const hasEntitlementAccess = entitlement?.tier === 'pro' || entitlement?.tier === 'elite'
  const isSubActive = subscription?.status === 'active' || subscription?.status === 'trialing'
  const isPro = isSubActive || hasEntitlementAccess || isAdmin
  const tier = entitlement?.tier || (isSubActive ? 'pro' : 'free')
  const accessSource = entitlement?.source || (isSubActive ? 'stripe' : null)
  
  const userProfile = {
    email: profile?.email || user.email || 'user@example.com',
    full_name: profile?.full_name,
    subscription_status: (isPro ? (subscription?.plan_type || 'monthly') : 'free') as 'free' | 'monthly' | 'annual' | 'weekly',
    usage_count: usageCount || 0,
    usage_limit: 3, // Matches homepage pricing: 3 free replies per day
    isAdmin,
    tier,
    accessSource,
  }

  const subscriptionConfig = {
    free: {
      label: 'Free Plan',
      color: 'bg-gray-500',
      textColor: 'text-gray-400',
      icon: Zap,
    },
    weekly: {
      label: 'Pro Weekly',
      color: 'bg-purple-500',
      textColor: 'text-purple-400',
      icon: Crown,
    },
    monthly: {
      label: 'Pro Monthly',
      color: 'bg-purple-500',
      textColor: 'text-purple-400',
      icon: Crown,
    },
    annual: {
      label: 'Pro Annual',
      color: 'bg-gradient-to-r from-yellow-400 to-orange-400',
      textColor: 'text-yellow-400',
      icon: Crown,
    },
  }

  // Calculate days left in subscription or trial entitlement
  let daysLeft: number | null = null
  let showCountdown = false
  let isTrialEntitlement = false
  
  // Check entitlement expiry (invite codes / beta access)
  if (entitlement?.expires_at) {
    const expiresAt = new Date(entitlement.expires_at)
    const now = new Date()
    const diffTime = expiresAt.getTime() - now.getTime()
    daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    showCountdown = true
    isTrialEntitlement = true
  }
  // Check Stripe subscription period end
  else if (isPro && subscription?.current_period_end) {
    const endDate = new Date(subscription.current_period_end)
    const now = new Date()
    const diffTime = endDate.getTime() - now.getTime()
    daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    if (subscription.plan_type === 'weekly' || daysLeft <= 7) {
      showCountdown = true
    }
  }

  const currentPlan = isTrialEntitlement 
    ? { label: 'Free Trial', color: 'bg-purple-500', textColor: 'text-purple-400', icon: Sparkles }
    : subscriptionConfig[userProfile.subscription_status]
  const PlanIcon = currentPlan.icon
  const usagePercentage = (userProfile.usage_count / userProfile.usage_limit) * 100
  const isAtLimit = userProfile.subscription_status === 'free' && userProfile.usage_count >= userProfile.usage_limit

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Ambient background mesh */}
      <div className="fixed inset-0 pointer-events-none hidden md:block">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-violet-600/8 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-fuchsia-600/8 blur-[120px]" />
        <div className="absolute top-[40%] left-[50%] w-[40%] h-[40%] rounded-full bg-cyan-600/5 blur-[100px]" />
      </div>
      <div className="fixed inset-0 pointer-events-none md:hidden">
        <div className="absolute top-[-10%] left-[-5%] w-[50%] h-[50%] rounded-full bg-violet-600/6 blur-[80px]" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[40%] h-[40%] rounded-full bg-fuchsia-600/6 blur-[80px]" />
      </div>

      {/* Header */}
      <nav className="relative z-10 mx-auto max-w-4xl px-5 py-6">
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-white/[0.08] border border-white/[0.12] rounded-2xl flex items-center justify-center">
              <MessageCircle className="h-5 w-5 text-white/70" />
            </div>
            <span className="text-lg font-bold text-white/90 hidden sm:inline">Text Wingman</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link 
              href="/features" 
              className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/[0.06] border border-white/[0.10] hover:bg-white/[0.12] text-white/50 hover:text-white/80 text-xs font-bold transition-all hidden sm:flex"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Features
            </Link>
            <Link 
              href="/profile" 
              className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/[0.06] border border-white/[0.10] hover:bg-white/[0.12] text-white/50 hover:text-white/80 text-xs font-bold transition-all"
            >
              <User className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Profile</span>
            </Link>
            <SignOutButton />
          </div>
        </div>
      </nav>

      <div className="relative z-10 mx-auto max-w-4xl px-5 pb-12">
        <div className="space-y-6">
          
          {/* Admin Badge - shows for owner/admin users */}
          {isAdmin && (
            <div className="rounded-2xl bg-amber-500/8 border border-amber-500/20 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center">
                  <Shield className="h-4 w-4 text-amber-400" />
                </div>
                <span className="text-amber-400 text-sm font-bold">Owner Access</span>
                <span className="text-amber-400/40 text-xs hidden sm:inline">• Elite tier • No billing required</span>
              </div>
              <Link
                href="/admin"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500/15 border border-amber-500/25 hover:bg-amber-500/25 text-amber-400 text-xs font-bold transition-all w-full sm:w-auto justify-center sm:justify-start"
              >
                <Settings className="h-3.5 w-3.5" />
                Admin Dashboard
              </Link>
            </div>
          )}
          
          {/* Trial Banner - shows for invite/beta trial users */}
          {isTrialEntitlement && daysLeft !== null && !isAdmin && (
            <div className={`rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
              daysLeft <= 1 
                ? 'bg-red-500/8 border border-red-500/20' 
                : daysLeft <= 3 
                  ? 'bg-orange-500/8 border border-orange-500/20'
                  : 'bg-violet-500/8 border border-violet-500/20'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  daysLeft <= 1 ? 'bg-red-500/20' : daysLeft <= 3 ? 'bg-orange-500/20' : 'bg-violet-500/20'
                }`}>
                  <Sparkles className={`h-4 w-4 ${
                    daysLeft <= 1 ? 'text-red-400' : daysLeft <= 3 ? 'text-orange-400' : 'text-violet-400'
                  }`} />
                </div>
                <div>
                  <p className="text-white/90 font-bold text-sm">
                    {daysLeft <= 0 
                      ? 'Your free trial expires today!' 
                      : daysLeft === 1 
                        ? '1 day left on your free Pro trial' 
                        : `${daysLeft} days left on your free Pro trial`}
                  </p>
                  <p className="text-white/30 text-xs">Unlimited V2 verified replies included</p>
                </div>
              </div>
              {daysLeft <= 3 && (
                <Link 
                  href="/pricing" 
                  className="px-4 py-2 bg-white/[0.08] border border-white/[0.15] hover:bg-white/[0.14] rounded-xl text-white/80 text-xs font-bold transition-all whitespace-nowrap w-full sm:w-auto text-center"
                >
                  Keep Pro Access
                </Link>
              )}
            </div>
          )}

          {/* Pro V2 Banner - shows for paid Pro users (not admins or trial) */}
          {isPro && !isAdmin && !isTrialEntitlement && (
            <div className="rounded-2xl bg-emerald-500/8 border border-emerald-500/20 p-3.5 flex items-center justify-center gap-2.5">
              <Shield className="h-4 w-4 text-emerald-400" />
              <span className="text-emerald-400/80 text-xs font-bold">V2 Verified Replies Active</span>
            </div>
          )}

          {/* Welcome Section */}
          <div className="text-center space-y-2 py-2">
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              {profile?.full_name ? `Hey ${profile.full_name} 👋` : 'Your next reply sets the tone.'}
            </h1>
            {profile?.full_name && (
              <p className="text-white/40 text-sm font-medium">Your next reply sets the tone.</p>
            )}
          </div>

          {/* Main CTA - Changes based on limit status (admins never see upgrade prompts) */}
          {isAtLimit && !isAdmin ? (
            <div className="rounded-3xl bg-red-500/8 border border-red-500/20 p-6 text-center">
              <h2 className="text-lg font-bold text-white/90 mb-1">You&apos;ve used all 3 free replies today</h2>
              <p className="text-white/40 text-sm mb-5">Go unlimited — never miss a perfect reply.</p>
              <Link 
                href="/pricing"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 via-purple-500 to-fuchsia-500 text-white px-8 py-3 rounded-2xl font-extrabold text-sm hover:opacity-90 transition-all active:scale-95 shadow-xl shadow-violet-600/30"
              >
                <Crown className="h-5 w-5" />
                Upgrade to Pro
              </Link>
            </div>
          ) : (
            <Link 
              href="/app"
              className={`block rounded-3xl p-6 transition-all hover:scale-[1.01] active:scale-[0.98] border ${
                isAdmin 
                  ? 'bg-amber-500/8 border-amber-500/20 hover:bg-amber-500/12' 
                  : isPro
                    ? 'bg-emerald-500/8 border-emerald-500/20 hover:bg-emerald-500/12'
                    : 'bg-violet-500/8 border-violet-500/20 hover:bg-violet-500/12'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <h2 className="text-lg font-bold text-white/90">
                    {isAdmin 
                      ? 'Owner Mode — Elite access' 
                      : isPro 
                        ? 'Verified replies. Never overthink a text.' 
                        : 'Paste any message. Get 3 perfect replies.'}
                  </h2>
                  <p className="text-white/40 text-sm mt-1 font-medium">
                    {isAdmin ? 'Full access to all features' : isPro ? 'V2 pipeline: Draft → Rule-Check → Tone-Verify' : 'AI-powered, tone-matched replies'}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  isAdmin ? 'bg-amber-500/15' : isPro ? 'bg-emerald-500/15' : 'bg-violet-500/15'
                }`}>
                  <MessageCircle className={`h-6 w-6 ${
                    isAdmin ? 'text-amber-400' : isPro ? 'text-emerald-400' : 'text-violet-400'
                  }`} />
                </div>
              </div>
            </Link>
          )}

          {/* Stats Grid */}
          <div className="grid md:grid-cols-3 gap-3">
            {/* Subscription Status */}
            <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-5">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  isPro ? 'bg-violet-500/15' : 'bg-white/[0.06]'
                }`}>
                  <PlanIcon className={`h-4 w-4 ${
                    isPro ? 'text-violet-400' : 'text-white/40'
                  }`} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Plan</p>
                  <p className={`font-bold text-sm ${isPro ? 'text-violet-300' : 'text-white/60'}`}>{currentPlan.label}</p>
                </div>
              </div>
              {showCountdown && daysLeft !== null && (
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${
                    daysLeft <= 1 ? 'bg-red-500/15 text-red-400' : 
                    daysLeft <= 3 ? 'bg-orange-500/15 text-orange-400' : 
                    'bg-violet-500/15 text-violet-300'
                  }`}>
                    {daysLeft <= 0 ? 'Expires today' : daysLeft === 1 ? '1 day left' : `${daysLeft} days left`}
                  </span>
                  {daysLeft <= 3 && (
                    <Link href="/pricing" className="text-[10px] font-bold text-violet-400 hover:text-violet-300 transition-colors">
                      Renew →
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Usage Stats */}
            <div className={`rounded-2xl bg-white/[0.04] border p-5 ${
              isAtLimit ? 'border-red-500/25' : 'border-white/[0.08]'
            }`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  isAtLimit ? 'bg-red-500/15' : 'bg-blue-500/15'
                }`}>
                  <TrendingUp className={`h-4 w-4 ${
                    isAtLimit ? 'text-red-400' : 'text-blue-400'
                  }`} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Today</p>
                  <p className={`font-bold text-sm ${isAtLimit ? 'text-red-400' : 'text-white/80'}`}>
                    {userProfile.usage_count} / {userProfile.subscription_status === 'free' ? userProfile.usage_limit : '∞'}
                  </p>
                </div>
              </div>
              {userProfile.subscription_status === 'free' && (
                <>
                  <div className="w-full bg-white/[0.08] rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full transition-all ${isAtLimit ? 'bg-red-500' : usagePercentage >= 67 ? 'bg-orange-500' : 'bg-blue-500'}`}
                      style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                    />
                  </div>
                  {isAtLimit && (
                    <p className="text-[10px] text-red-400/80 mt-2 font-medium">Limit reached • Resets in 24h</p>
                  )}
                </>
              )}
              {userProfile.subscription_status !== 'free' && (
                <p className="text-xs text-emerald-400/60 font-medium">Unlimited verified replies</p>
              )}
            </div>

            {/* Total Replies */}
            <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-emerald-500/15 rounded-xl flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Total</p>
                  <p className="font-bold text-sm text-white/80">{totalReplies || 0}</p>
                </div>
              </div>
              {(totalReplies || 0) > 0 && (
                <p className="text-xs text-emerald-400/50 mt-3 font-medium">Keep going!</p>
              )}
            </div>
          </div>

          {/* Style Snapshot - Show after 3+ copies */}
          {totalCopies >= 3 && favoriteTone && (
            <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 bg-indigo-500/15 rounded-xl flex items-center justify-center">
                  <span className="text-base">🧠</span>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Style Snapshot</p>
                  <p className="text-xs text-white/40">Based on {totalCopies} copied replies</p>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xl">{toneEmojis[favoriteTone] || '✨'}</span>
                <div>
                  <p className="text-[10px] text-white/30 font-medium">You usually pick</p>
                  <p className="font-bold text-sm text-white/80">{toneLabels[favoriteTone] || favoriteTone} replies</p>
                </div>
              </div>
            </div>
          )}

          {/* Upgrade Card - Single strong placement for free users */}
          {userProfile.subscription_status === 'free' && (
            <Link 
              href="/pricing"
              className="block rounded-2xl bg-violet-500/8 border border-violet-500/20 p-5 hover:bg-violet-500/12 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-violet-500/15 rounded-xl flex items-center justify-center">
                    <Crown className="h-5 w-5 text-violet-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white/80 group-hover:text-white transition-colors">Unlock unlimited replies</h3>
                    <p className="text-xs text-white/30">Remove limits. Get the best reply every time.</p>
                  </div>
                </div>
                <span className="text-violet-400/60 font-bold text-xs hidden sm:block">View Plans →</span>
              </div>
            </Link>
          )}

          {/* Manage Subscription - for paying users (Stripe Customer Portal) */}
          {userProfile.subscription_status !== 'free' && !isAdmin && (
            <ManageSubscriptionButton />
          )}

          {/* Recent Replies Section */}
          {recentReplies && recentReplies.length > 0 && (
            <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] overflow-hidden">
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest">Recent Wins</span>
                </div>
                <Link href="/profile" className="text-[10px] text-violet-400/60 hover:text-violet-400 font-bold transition-colors">
                  View all →
                </Link>
              </div>
              <div className="divide-y divide-white/[0.06]">
                {recentReplies.map((reply) => {
                  let parsedReplies: Array<{tone: string; text: string}> = []
                  try {
                    const raw = reply.generated_replies
                    if (typeof raw === 'string') {
                      parsedReplies = JSON.parse(raw)
                    } else if (Array.isArray(raw)) {
                      parsedReplies = raw
                    }
                  } catch {
                    parsedReplies = []
                  }
                  const firstReply = parsedReplies?.[0]?.text || 'No reply'
                  return (
                    <div key={reply.id} className="px-5 py-3.5">
                      <p className="text-white/25 text-[10px] font-medium mb-1 truncate">They said: &quot;{reply.their_message}&quot;</p>
                      <p className="text-white/70 text-sm font-medium truncate">&quot;{firstReply}&quot;</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* What's New Widget */}
          <Link 
            href="/changelog"
            className="block rounded-2xl bg-white/[0.04] border border-white/[0.08] p-5 hover:bg-white/[0.06] transition-all group"
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-500/15 flex items-center justify-center shrink-0">
                <Megaphone className="h-4 w-4 text-orange-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-[10px] font-bold text-orange-400/80">v{CURRENT_VERSION}</span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-orange-500/20 text-orange-400">NEW</span>
                </div>
                <h3 className="font-bold text-white/80 text-sm group-hover:text-white transition-colors truncate">{LATEST_UPDATE.title}</h3>
                <p className="text-[11px] text-white/30 mt-0.5 line-clamp-1">{LATEST_UPDATE.description}</p>
              </div>
              <span className="text-white/20 group-hover:text-white/50 text-xs shrink-0 mt-1 transition-colors font-bold">View all →</span>
            </div>
          </Link>

          {/* Locked Features Teaser - for free users */}
          {userProfile.subscription_status === 'free' && (
            <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-5">
              <div className="flex items-center gap-2 mb-4">
                <Lock className="h-4 w-4 text-violet-400" />
                <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest">Unlock with Pro</span>
              </div>
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="flex items-center gap-2.5 text-white/50">
                  <div className="w-7 h-7 bg-white/[0.06] rounded-lg flex items-center justify-center">
                    <span className="text-sm">♾️</span>
                  </div>
                  <span className="text-xs font-medium">Unlimited replies</span>
                </div>
                <div className="flex items-center gap-2.5 text-white/50">
                  <div className="w-7 h-7 bg-white/[0.06] rounded-lg flex items-center justify-center">
                    <span className="text-sm">🎯</span>
                  </div>
                  <span className="text-xs font-medium">All tone styles</span>
                </div>
                <div className="flex items-center gap-2.5 text-white/50">
                  <div className="w-7 h-7 bg-white/[0.06] rounded-lg flex items-center justify-center">
                    <span className="text-sm">📱</span>
                  </div>
                  <span className="text-xs font-medium">Shareable cards</span>
                </div>
              </div>
              <Link 
                href="/pricing"
                className="mt-4 block text-center text-violet-400/60 hover:text-violet-400 text-xs font-bold transition-colors"
              >
                See all Pro features →
              </Link>
            </div>
          )}

          {/* Feedback Section */}
          <FeedbackSection 
            userEmail={userProfile.email} 
            planType={userProfile.subscription_status === 'free' ? 'Free' : `Pro ${userProfile.subscription_status}`} 
          />

        </div>
      </div>
    </div>
  )
}
