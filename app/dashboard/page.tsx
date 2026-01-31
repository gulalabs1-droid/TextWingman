import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import SignOutButton from './sign-out-button'
import { MessageCircle, Zap, Crown, Sparkles, TrendingUp, Settings, CreditCard } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // if (!user) {
  //   redirect('/login')
  // }

  // Demo data - replace with actual user profile data from Supabase
  const userProfile = {
    email: user?.email || 'demo@example.com',
    subscription_status: 'free' as 'free' | 'monthly' | 'annual',
    usage_count: 3,
    usage_limit: 5,
  }

  const subscriptionConfig = {
    free: {
      label: 'Free Plan',
      color: 'bg-gray-500',
      textColor: 'text-gray-400',
      icon: Zap,
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
  const showUpgradeNudge = userProfile.subscription_status === 'free' && userProfile.usage_count >= 4

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-900 to-purple-600">
      {/* Header */}
      <nav className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <MessageCircle className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Text Wingman</span>
          </Link>
          <SignOutButton />
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Welcome Section */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold text-white">Your next reply sets the tone.</h1>
          </div>

          {/* Main CTA - Launch Text Wingman */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-10 text-center shadow-2xl shadow-purple-500/30">
            <h2 className="text-2xl font-bold text-white mb-6">Paste any message. Get 3 perfect replies.</h2>
            <Link 
              href="/app"
              className="inline-flex items-center gap-2 bg-white text-purple-600 px-10 py-5 rounded-2xl font-bold text-xl hover:bg-gray-100 transition-all hover:scale-105 active:scale-95 shadow-xl"
            >
              <MessageCircle className="h-6 w-6" />
              Start Texting
            </Link>
          </div>

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
            </div>

            {/* Usage Stats */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-white/60">Today&apos;s Usage</p>
                  <p className="font-bold text-white">
                    {userProfile.usage_count} / {userProfile.subscription_status === 'free' ? userProfile.usage_limit : '∞'}
                  </p>
                </div>
              </div>
              {userProfile.subscription_status === 'free' && (
                <>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${usagePercentage >= 80 ? 'bg-red-500' : 'bg-blue-500'}`}
                      style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                    />
                  </div>
                  {showUpgradeNudge && (
                    <p className="text-xs text-white/70 mt-2">You're almost out. Pro removes limits and unlocks full tone control.</p>
                  )}
                </>
              )}
              {userProfile.subscription_status !== 'free' && (
                <p className="text-sm text-green-400">Unlimited replies</p>
              )}
            </div>

            {/* Account */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-500 rounded-xl flex items-center justify-center">
                  <Settings className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-white/60">Account</p>
                  <p className="font-medium text-white truncate">{userProfile.email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Upgrade Card - Single strong placement for free users */}
          {userProfile.subscription_status === 'free' && (
            <Link 
              href="/#pricing"
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
              href="/#pricing"
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

        </div>
      </div>
    </div>
  )
}
