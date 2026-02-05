import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import SignOutButton from './sign-out-button'
import { MessageCircle, Zap, Crown, Sparkles, TrendingUp, Settings, CreditCard, Lock, AlertCircle, User } from 'lucide-react'

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

  const isPro = subscription?.status === 'active'
  const userProfile = {
    email: profile?.email || user.email || 'user@example.com',
    full_name: profile?.full_name,
    subscription_status: (isPro ? (subscription?.plan_type || 'monthly') : 'free') as 'free' | 'monthly' | 'annual' | 'weekly',
    usage_count: usageCount || 0,
    usage_limit: 3, // Matches homepage pricing: 3 free replies per day
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

  const currentPlan = subscriptionConfig[userProfile.subscription_status]
  const PlanIcon = currentPlan.icon
  const usagePercentage = (userProfile.usage_count / userProfile.usage_limit) * 100
  const isAtLimit = userProfile.subscription_status === 'free' && userProfile.usage_count >= userProfile.usage_limit

  // Calculate days left in subscription
  let daysLeft: number | null = null
  let showCountdown = false
  if (isPro && subscription?.current_period_end) {
    const endDate = new Date(subscription.current_period_end)
    const now = new Date()
    const diffTime = endDate.getTime() - now.getTime()
    daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    // Show countdown for weekly plans always, or for annual/monthly when 7 days or less
    if (subscription.plan_type === 'weekly' || daysLeft <= 7) {
      showCountdown = true
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-900 to-purple-600">
      {/* Header */}
      <nav className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <MessageCircle className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Text Wingman</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link 
              href="/profile" 
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors"
            >
              <User className="h-4 w-4" />
              Profile
            </Link>
            <SignOutButton />
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Pro V2 Banner - shows for Pro users */}
          {isPro && (
            <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-2xl p-4 flex items-center justify-center gap-3">
              <span className="text-green-400 text-sm font-medium">✨ You&apos;re using Verified Replies (V2)</span>
            </div>
          )}

          {/* Welcome Section */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold text-white">Your next reply sets the tone.</h1>
          </div>

          {/* Main CTA - Changes based on limit status */}
          {isAtLimit ? (
            <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-3xl p-10 text-center shadow-2xl shadow-red-500/30">
              <div className="flex items-center justify-center gap-2 mb-4">
                <AlertCircle className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">You&apos;ve used all 3 free replies today</h2>
              <p className="text-white/80 mb-6">Unlimited Verified Replies — never send a risky text again.</p>
              <Link 
                href="/pricing"
                className="inline-flex items-center gap-2 bg-white text-red-600 px-10 py-5 rounded-2xl font-bold text-xl hover:bg-gray-100 transition-all hover:scale-105 active:scale-95 shadow-xl"
              >
                <Crown className="h-6 w-6" />
                Upgrade to Pro →
              </Link>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-10 text-center shadow-2xl shadow-purple-500/30">
              <h2 className="text-2xl font-bold text-white mb-6">{isPro ? 'Get verified replies. Never overthink a text again.' : 'Paste any message. Get 3 perfect replies.'}</h2>
              <Link 
                href="/app"
                className="inline-flex items-center gap-2 bg-white text-purple-600 px-10 py-5 rounded-2xl font-bold text-xl hover:bg-gray-100 transition-all hover:scale-105 active:scale-95 shadow-xl"
              >
                <MessageCircle className="h-6 w-6" />
                Start Texting
              </Link>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid md:grid-cols-3 gap-4">
            {/* Subscription Status */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${currentPlan.color} rounded-xl flex items-center justify-center`}>
                  <PlanIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-white/60">Current Plan</p>
                  <p className={`font-bold ${currentPlan.textColor}`}>{currentPlan.label}</p>
                </div>
              </div>
              {/* Subscription countdown */}
              {showCountdown && daysLeft !== null && (
                <div className={`mt-3 text-xs font-medium px-3 py-1.5 rounded-lg inline-block ${
                  daysLeft <= 1 ? 'bg-red-500/20 text-red-400' : 
                  daysLeft <= 3 ? 'bg-orange-500/20 text-orange-400' : 
                  'bg-purple-500/20 text-purple-300'
                }`}>
                  {daysLeft <= 0 ? 'Expires today' : daysLeft === 1 ? '1 day left' : `${daysLeft} days left`}
                </div>
              )}
            </div>

            {/* Usage Stats */}
            <div className={`bg-white/10 backdrop-blur-sm rounded-2xl border p-6 ${isAtLimit ? 'border-red-500/50' : 'border-white/20'}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isAtLimit ? 'bg-red-500' : 'bg-blue-500'}`}>
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-white/60">Today&apos;s Usage</p>
                  <p className={`font-bold ${isAtLimit ? 'text-red-400' : 'text-white'}`}>
                    {userProfile.usage_count} / {userProfile.subscription_status === 'free' ? userProfile.usage_limit : '∞'}
                  </p>
                </div>
              </div>
              {userProfile.subscription_status === 'free' && (
                <>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${isAtLimit ? 'bg-red-500' : usagePercentage >= 67 ? 'bg-orange-500' : 'bg-blue-500'}`}
                      style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                    />
                  </div>
                  {isAtLimit && (
                    <p className="text-xs text-red-400 mt-2 font-medium">Free limit reached • Resets in 24h</p>
                  )}
                </>
              )}
              {userProfile.subscription_status !== 'free' && (
                <p className="text-sm text-green-400">Unlimited verified replies</p>
              )}
            </div>

            {/* Account - Links to Profile */}
            <Link href="/profile" className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6 hover:bg-white/15 transition-colors block">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-white/60">Account</p>
                  <p className="font-medium text-white truncate">{userProfile.email}</p>
                </div>
              </div>
            </Link>
          </div>

          {/* Style Snapshot - Show after 3+ copies */}
          {totalCopies >= 3 && favoriteTone && (
            <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 backdrop-blur-sm rounded-2xl border border-indigo-500/30 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center">
                  <span className="text-lg">🧠</span>
                </div>
                <div>
                  <h3 className="font-bold text-white">Your Style Snapshot</h3>
                  <p className="text-xs text-white/50">Based on {totalCopies} copied replies</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{toneEmojis[favoriteTone] || '✨'}</span>
                  <div>
                    <p className="text-xs text-white/50">You usually pick</p>
                    <p className="font-bold text-white">{toneLabels[favoriteTone] || favoriteTone} replies</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Upgrade Card - Single strong placement for free users */}
          {userProfile.subscription_status === 'free' && (
            <Link 
              href="/pricing"
              className="block bg-white/10 backdrop-blur-sm rounded-2xl border border-purple-500/30 p-6 hover:bg-white/15 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
                    <Crown className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white group-hover:text-purple-300 transition-colors">Unlock unlimited replies</h3>
                    <p className="text-sm text-white/60">Remove limits. Get the best reply every time.</p>
                  </div>
                </div>
                <span className="text-purple-400 font-medium text-sm hidden sm:block">View Plans</span>
              </div>
            </Link>
          )}

          {/* Manage Subscription - for paying users */}
          {userProfile.subscription_status !== 'free' && (
            <Link 
              href="/billing"
              className="block bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:bg-white/10 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-600 rounded-xl flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-medium text-white/80 group-hover:text-white transition-colors">Manage Subscription</h3>
                  <p className="text-sm text-white/50">View billing and plan details</p>
                </div>
              </div>
            </Link>
          )}

          {/* Recent Replies Section */}
          {recentReplies && recentReplies.length > 0 && (
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-green-400" />
                Your Recent Wins
              </h3>
              <div className="space-y-3">
                {recentReplies.map((reply) => {
                  // Parse generated_replies - could be JSON string or already parsed array
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
                    <div key={reply.id} className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <p className="text-white/60 text-xs mb-1 truncate">They said: &quot;{reply.their_message}&quot;</p>
                      <p className="text-white font-medium">&quot;{firstReply}&quot;</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Locked Features Teaser - for free users */}
          {userProfile.subscription_status === 'free' && (
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <Lock className="h-5 w-5 text-purple-400" />
                Unlock with Pro
              </h3>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 text-white/60">
                  <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                    <span className="text-lg">♾️</span>
                  </div>
                  <span className="text-sm">Unlimited verified replies</span>
                </div>
                <div className="flex items-center gap-3 text-white/60">
                  <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                    <span className="text-lg">🎯</span>
                  </div>
                  <span className="text-sm">All tone styles</span>
                </div>
                <div className="flex items-center gap-3 text-white/60">
                  <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                    <span className="text-lg">📱</span>
                  </div>
                  <span className="text-sm">Shareable cards</span>
                </div>
              </div>
              <Link 
                href="/pricing"
                className="mt-4 block text-center text-purple-400 hover:text-purple-300 text-sm font-medium"
              >
                See all Pro features →
              </Link>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
