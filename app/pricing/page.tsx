'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Crown, Check, ArrowLeft, MessageCircle, CheckCircle2, Sparkles } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [user, setUser] = useState<{ email: string; id: string } | null>(null)
  const [isPro, setIsPro] = useState(false)
  const [planType, setPlanType] = useState<string | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user ? { email: user.email || '', id: user.id } : null)
      
      // Check Pro status
      if (user) {
        const res = await fetch('/api/usage')
        if (res.ok) {
          const data = await res.json()
          setIsPro(data.isPro || false)
        }
        
        // Get plan type from subscription
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('plan_type, status')
          .eq('user_id', user.id)
          .in('status', ['active', 'trialing'])
          .single()
        if (sub) {
          setPlanType(sub.plan_type)
        }
      }
      
      setCheckingAuth(false)
    }
    checkAuth()
  }, [supabase.auth, supabase])

  const handleCheckout = async (plan: 'weekly' | 'annual', trial = false) => {
    // CRITICAL: User must be logged in before checkout
    if (!user) {
      toast({
        title: 'Account Required',
        description: 'Please sign up or log in first to subscribe',
      })
      // Redirect to login with return URL to pricing page
      window.location.href = `/login?redirect=/pricing&plan=${plan}`
      return
    }

    setLoading(trial ? 'trial' : plan)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, trial }),
      })

      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        toast({
          title: 'Error',
          description: 'Failed to start checkout',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Something went wrong',
        variant: 'destructive',
      })
    } finally {
      setLoading(null)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-900 to-purple-600">
      {/* Header */}
      <nav className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          {user ? (
            <Link href="/dashboard" className="flex items-center gap-2 text-white/80 hover:text-white">
              <ArrowLeft className="h-5 w-5" />
              Back to Dashboard
            </Link>
          ) : (
            <Link href="/" className="flex items-center gap-2 text-white/80 hover:text-white">
              <ArrowLeft className="h-5 w-5" />
              Back to Home
            </Link>
          )}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white hidden sm:block">Text Wingman</span>
            </Link>
            {!checkingAuth && (
              user ? (
                <button
                  onClick={handleSignOut}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl font-medium transition-colors"
                >
                  Sign Out
                </button>
              ) : (
                <Link
                  href="/login"
                  className="bg-white text-purple-600 px-4 py-2 rounded-xl font-medium hover:bg-gray-100 transition-colors"
                >
                  Sign Up
                </Link>
              )
            )}
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Pro User View */}
          {isPro ? (
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-green-500/20 px-4 py-2 rounded-full mb-6">
                <CheckCircle2 className="h-5 w-5 text-green-400" />
                <span className="text-green-300 font-medium">You&apos;re a Pro Member</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Thanks for Being Pro! 🎉
              </h1>
              <p className="text-xl text-white/70 mb-8">
                You have unlimited access to all features including V2 Verified Mode
              </p>
              
              {/* Pro Benefits Card */}
              <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-green-500/30 max-w-md mx-auto">
                <div className="flex items-center justify-center gap-2 mb-6">
                  <Sparkles className="h-6 w-6 text-green-400" />
                  <h3 className="text-2xl font-bold text-white">Your Pro Benefits</h3>
                </div>
                <ul className="space-y-4 text-left mb-6">
                  <li className="flex items-center gap-3 text-white">
                    <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0" />
                    Unlimited replies
                  </li>
                  <li className="flex items-center gap-3 text-white">
                    <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0" />
                    V2 Verified Mode (3-agent pipeline)
                  </li>
                  <li className="flex items-center gap-3 text-white">
                    <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0" />
                    Strategy Mode — AI coaching every reply
                  </li>
                  <li className="flex items-center gap-3 text-white">
                    <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0" />
                    Thread-aware AI conversations
                  </li>
                  <li className="flex items-center gap-3 text-white">
                    <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0" />
                    Unlimited decodes, openers &amp; revives
                  </li>
                </ul>
                <p className="text-white/60 text-sm mb-4">
                  Plan: <span className="text-green-400 font-semibold capitalize">{planType || 'Pro'}</span>
                </p>
                <Link
                  href="/app"
                  className="block w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold text-lg rounded-2xl hover:opacity-90 transition-opacity text-center"
                >
                  Start Texting →
                </Link>
              </div>
            </div>
          ) : (
            /* Free User View */
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-purple-500/20 px-4 py-2 rounded-full mb-6">
                <Crown className="h-5 w-5 text-purple-400" />
                <span className="text-purple-300 font-medium">Upgrade to Pro</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Unlock Unlimited Replies
              </h1>
              <p className="text-xl text-white/70">
                Remove limits and get the perfect reply every time
              </p>
            </div>
          )}

          {/* Free Trial Banner */}
          {!isPro && (
            <div className="max-w-2xl mx-auto mb-8">
              <div className="relative bg-gradient-to-r from-green-600 to-emerald-600 rounded-3xl p-8 shadow-2xl text-center">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white text-green-700 px-6 py-2 rounded-full text-sm font-black shadow-xl whitespace-nowrap">
                  NO PAYMENT REQUIRED
                </div>
                <h3 className="text-2xl font-bold text-white mb-2 mt-2">7-Day Free Trial</h3>
                <p className="text-green-100 mb-1">Full Pro access — no credit card needed</p>
                <p className="text-green-200/70 text-sm mb-6">Try unlimited replies, Strategy Mode, Revive Mode, and V2 Verified free for 7 days</p>
                <button
                  onClick={() => handleCheckout('weekly', true)}
                  disabled={loading === 'trial'}
                  className="w-full max-w-sm mx-auto py-4 bg-white text-green-700 font-black text-lg rounded-2xl hover:bg-gray-100 transition-all hover:scale-105 active:scale-95 shadow-xl disabled:opacity-50"
                >
                  {loading === 'trial' ? 'Loading...' : 'Start Free Trial →'}
                </button>
                <p className="text-xs text-green-200/60 mt-3">Automatically converts to $9.99/week after trial. Cancel anytime.</p>
              </div>
            </div>
          )}

          {/* Pricing Cards - Only show for non-Pro users */}
          {!isPro && (
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {/* Annual Plan - Best Value */}
            <div className="relative bg-white rounded-3xl p-8 shadow-2xl border-4 border-purple-500">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1 rounded-full text-sm font-bold">
                Best Value
              </div>
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Annual</h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-5xl font-bold text-gray-900">$99</span>
                  <span className="text-gray-500">/year</span>
                </div>
                <p className="text-green-600 font-medium mt-2">Save $420 vs weekly</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-gray-700">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  Unlimited replies
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  Strategy Mode — AI coaching
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  V2 Verified (3-agent pipeline)
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  Unlimited decodes, openers & revives
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  Cancel anytime
                </li>
              </ul>
              <button
                onClick={() => handleCheckout('annual')}
                disabled={loading === 'annual'}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg rounded-2xl hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading === 'annual' ? 'Loading...' : 'Get Annual'}
              </button>
            </div>

            {/* Weekly Plan */}
            <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">Weekly</h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-5xl font-bold text-white">$9.99</span>
                  <span className="text-white/60">/week</span>
                </div>
                <p className="text-white/50 mt-2">Flexible option</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-white/80">
                  <Check className="h-5 w-5 text-purple-400 flex-shrink-0" />
                  Unlimited replies
                </li>
                <li className="flex items-center gap-3 text-white/80">
                  <Check className="h-5 w-5 text-purple-400 flex-shrink-0" />
                  Strategy Mode — AI coaching
                </li>
                <li className="flex items-center gap-3 text-white/80">
                  <Check className="h-5 w-5 text-purple-400 flex-shrink-0" />
                  V2 Verified (3-agent pipeline)
                </li>
                <li className="flex items-center gap-3 text-white/80">
                  <Check className="h-5 w-5 text-purple-400 flex-shrink-0" />
                  Cancel anytime
                </li>
              </ul>
              <button
                onClick={() => handleCheckout('weekly')}
                disabled={loading === 'weekly'}
                className="w-full py-4 bg-white/20 text-white font-bold text-lg rounded-2xl hover:bg-white/30 transition-colors disabled:opacity-50 border border-white/30"
              >
                {loading === 'weekly' ? 'Loading...' : 'Get Weekly'}
              </button>
            </div>
          </div>

          )}

          {/* Trust badges */}
          {!isPro && (
          <div className="flex items-center justify-center gap-6 mt-12 text-white/50 text-sm">
            <span>✓ Secure payment</span>
            <span>✓ Cancel anytime</span>
            <span>✓ Instant access</span>
            <span>✓ 7-day free trial</span>
          </div>
          )}
        </div>
      </div>
    </div>
  )
}
