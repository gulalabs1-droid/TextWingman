'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Crown, Check, ArrowLeft, CheckCircle2, Sparkles, Target, Shield } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'
import { Logo } from '@/components/Logo'

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
      
      if (user) {
        const res = await fetch('/api/usage')
        if (res.ok) {
          const data = await res.json()
          setIsPro(data.isPro || false)
        }
        
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
    if (!user) {
      toast({
        title: 'Account Required',
        description: 'Please sign up or log in first to subscribe',
      })
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
        toast({ title: 'Error', description: 'Failed to start checkout', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' })
    } finally {
      setLoading(null)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-violet-600/[0.06] blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-fuchsia-600/[0.06] blur-[120px]" />
      </div>

      {/* Header */}
      <nav className="relative z-10 container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <Link href={user ? '/dashboard' : '/'} className="flex items-center gap-2 text-white/60 hover:text-white transition-all">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">{user ? 'Dashboard' : 'Home'}</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/" className="transition-transform hover:scale-105">
              <Logo size="md" showText={true} />
            </Link>
          </div>
          <div>
            {!checkingAuth && (
              user ? (
                <button onClick={handleSignOut} className="text-white/40 hover:text-white/70 text-sm font-medium transition-colors">Sign Out</button>
              ) : (
                <Link href="/login" className="text-white/60 hover:text-white hover:bg-white/[0.06] rounded-xl px-3 py-2 text-sm transition-all">Sign Up</Link>
              )
            )}
          </div>
        </div>
      </nav>

      <div className="relative z-10 container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Pro User View */}
          {isPro ? (
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-emerald-500/10 px-4 py-2 rounded-full mb-6 border border-emerald-500/20">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span className="text-emerald-300 font-bold text-sm">Active Pro Member</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
                You&apos;re Pro.
              </h1>
              <p className="text-lg text-white/50 mb-8">
                Unlimited access to Coach Mode, Intel, Strategy, and the verified pipeline.
              </p>
              
              <div className="bg-white/[0.04] backdrop-blur-sm border border-emerald-500/20 rounded-3xl p-8 max-w-md mx-auto">
                <div className="flex items-center justify-center gap-2 mb-6">
                  <Sparkles className="h-5 w-5 text-emerald-400" />
                  <h3 className="text-xl font-black text-white">Your Pro Benefits</h3>
                </div>
                <ul className="space-y-3 text-left mb-6">
                  <li className="flex items-center gap-3 text-white/80 text-sm">
                    <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                    Unlimited replies + Coach Mode
                  </li>
                  <li className="flex items-center gap-3 text-white/80 text-sm">
                    <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                    Intel sidebar — health, risk, timing
                  </li>
                  <li className="flex items-center gap-3 text-white/80 text-sm">
                    <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                    V2 Verified pipeline + Strategy
                  </li>
                  <li className="flex items-center gap-3 text-white/80 text-sm">
                    <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                    Simulated outcomes + confidence scores
                  </li>
                  <li className="flex items-center gap-3 text-white/80 text-sm">
                    <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                    Unlimited decodes, openers &amp; revives
                  </li>
                </ul>
                <p className="text-white/30 text-xs mb-4">
                  Plan: <span className="text-emerald-400 font-bold capitalize">{planType || 'Pro'}</span>
                </p>
                <Link href="/app" className="block w-full py-3.5 bg-gradient-to-r from-emerald-500 to-cyan-400 text-black font-black text-sm rounded-xl hover:scale-[1.02] transition-all text-center shadow-lg shadow-emerald-500/20">
                  Open Coach →
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-violet-500/10 px-4 py-2 rounded-full mb-6 border border-violet-500/20">
                <Crown className="h-4 w-4 text-violet-400" />
                <span className="text-violet-300 font-bold text-sm">Upgrade to Pro</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
                Unlock unlimited everything.
              </h1>
              <p className="text-lg text-white/50">
                Coach Mode. Intel sidebar. Strategy. Verified pipeline. No limits.
              </p>
            </div>
          )}

          {/* Free Trial Banner */}
          {!isPro && (
            <div className="max-w-2xl mx-auto mb-10">
              <div className="relative bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-3xl p-8 text-center">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-5 py-1.5 rounded-full text-[10px] font-black tracking-wider shadow-lg shadow-emerald-500/30 whitespace-nowrap">
                  NO PAYMENT REQUIRED
                </div>
                <h3 className="text-xl font-black text-white mb-2 mt-1">7-Day Free Trial</h3>
                <p className="text-white/50 text-sm mb-1">Full Pro access — Coach, Intel, Strategy, unlimited replies</p>
                <p className="text-white/25 text-xs mb-6">No credit card needed</p>
                <button
                  onClick={() => handleCheckout('weekly', true)}
                  disabled={loading === 'trial'}
                  className="w-full max-w-sm mx-auto py-3.5 bg-gradient-to-r from-emerald-500 to-cyan-400 text-black font-black text-sm rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  {loading === 'trial' ? 'Loading...' : 'Start Free Trial →'}
                </button>
                <p className="text-xs text-white/20 mt-3">Converts to $9.99/week after trial. Cancel anytime.</p>
              </div>
            </div>
          )}

          {/* Pricing Cards */}
          {!isPro && (
          <div className="grid md:grid-cols-2 gap-5 max-w-2xl mx-auto">
            {/* Annual Plan - Best Value */}
            <div className="relative bg-white/[0.04] backdrop-blur-sm border border-violet-500/25 rounded-3xl p-7">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white px-4 py-1 rounded-full text-[10px] font-black tracking-wider shadow-lg shadow-violet-500/30">
                BEST VALUE
              </div>
              <div className="text-center mb-6 pt-2">
                <h3 className="text-xl font-black text-white mb-1">Annual</h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-black text-white">$99.99</span>
                  <span className="text-white/30 text-sm">/year</span>
                </div>
                <p className="text-emerald-400 text-xs font-bold mt-1.5">Save $420 vs weekly — $1.92/week</p>
              </div>
              <ul className="space-y-2.5 mb-7">
                <li className="flex items-center gap-2.5 text-white/80 text-sm">
                  <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" /> Unlimited replies + Coach Mode
                </li>
                <li className="flex items-center gap-2.5 text-white/80 text-sm">
                  <Target className="h-4 w-4 text-emerald-400 flex-shrink-0" /> Intel sidebar + Strategy
                </li>
                <li className="flex items-center gap-2.5 text-white/80 text-sm">
                  <Shield className="h-4 w-4 text-emerald-400 flex-shrink-0" /> V2 Verified pipeline
                </li>
                <li className="flex items-center gap-2.5 text-white/60 text-sm">
                  <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" /> Unlimited decodes, openers &amp; revives
                </li>
                <li className="flex items-center gap-2.5 text-white/60 text-sm">
                  <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" /> Price locked forever
                </li>
              </ul>
              <button
                onClick={() => handleCheckout('annual')}
                disabled={loading === 'annual'}
                className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white font-black text-sm rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-violet-500/20 disabled:opacity-50"
              >
                {loading === 'annual' ? 'Loading...' : 'Get Annual →'}
              </button>
            </div>

            {/* Weekly Plan */}
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-3xl p-7">
              <div className="text-center mb-6">
                <h3 className="text-xl font-black text-white mb-1">Weekly</h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-black text-white">$9.99</span>
                  <span className="text-white/30 text-sm">/week</span>
                </div>
                <p className="text-white/30 text-xs mt-1.5">Flexible — cancel anytime</p>
              </div>
              <ul className="space-y-2.5 mb-7">
                <li className="flex items-center gap-2.5 text-white/70 text-sm">
                  <Check className="h-4 w-4 text-violet-400 flex-shrink-0" /> Unlimited replies + Coach Mode
                </li>
                <li className="flex items-center gap-2.5 text-white/70 text-sm">
                  <Check className="h-4 w-4 text-violet-400 flex-shrink-0" /> Intel sidebar + Strategy
                </li>
                <li className="flex items-center gap-2.5 text-white/70 text-sm">
                  <Check className="h-4 w-4 text-violet-400 flex-shrink-0" /> V2 Verified pipeline
                </li>
                <li className="flex items-center gap-2.5 text-white/50 text-sm">
                  <Check className="h-4 w-4 text-violet-400 flex-shrink-0" /> Cancel anytime
                </li>
              </ul>
              <button
                onClick={() => handleCheckout('weekly')}
                disabled={loading === 'weekly'}
                className="w-full py-3.5 bg-white/[0.06] border border-white/[0.12] text-white font-bold text-sm rounded-xl hover:bg-white/[0.10] transition-all disabled:opacity-50"
              >
                {loading === 'weekly' ? 'Loading...' : 'Get Weekly →'}
              </button>
            </div>
          </div>
          )}

          {/* Trust badges */}
          {!isPro && (
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-10 text-white/25 text-xs font-medium">
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
