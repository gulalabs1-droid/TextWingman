'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Crown, Check, ArrowLeft, ArrowUpRight, CheckCircle2, Sparkles, Target, Shield, Send } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'
import { ANNUAL_SAVINGS_DISPLAY, ANNUAL_SAVINGS_PERCENT, ANNUAL_MONTHLY_EQUIVALENT_DISPLAY, PLAN_PRICES } from '@/lib/pricing'
import { FREE_REPLY_LIMIT, REPLY_USAGE_WINDOW_HOURS } from '@/lib/usage-limits'
import { captureAttribution, track } from '@/lib/analytics'

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [user, setUser] = useState<{ email: string; id: string } | null>(null)
  const [isPro, setIsPro] = useState(false)
  const [planType, setPlanType] = useState<string | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [planLoadFailed, setPlanLoadFailed] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual' | null>(null)
  const [returningForTrial, setReturningForTrial] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setReturningForTrial(params.get('trial') === '1' && params.get('plan') === 'monthly')
    const requestedPlan = params.get('plan')
    setSelectedPlan(requestedPlan === 'monthly' || requestedPlan === 'annual' ? requestedPlan : null)
    const attribution = captureAttribution()
    track('pricing_viewed', {
      source: typeof attribution.utm_source === 'string' ? attribution.utm_source : 'direct',
      from: typeof attribution.src === 'string' ? attribution.src : undefined,
    })

    const checkAuth = async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError && authError.name !== 'AuthSessionMissingError') throw authError
      setUser(user ? { email: user.email || '', id: user.id } : null)
      
      if (user) {
        const res = await fetch('/api/usage')
        if (!res.ok) throw new Error('Could not verify plan access')
        const data = await res.json()
        if (typeof data.isPro !== 'boolean') throw new Error('Invalid plan response')
        setIsPro(data.isPro)
        
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
    checkAuth().catch(() => {
      setPlanLoadFailed(true)
      setCheckingAuth(false)
    })
  }, [supabase.auth, supabase])

  const handleCheckout = async (plan: 'monthly' | 'weekly' | 'annual') => {
    const attribution = captureAttribution()
    const source = typeof attribution.utm_source === 'string' ? attribution.utm_source : 'direct'
    if (!user) {
      track('signup_cta_clicked', { from: 'pricing', plan, source })
      const pricingParams = new URLSearchParams()
      pricingParams.set('plan', plan)
      ;['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'video_id', 'src'].forEach((key) => {
        const value = attribution[key as keyof typeof attribution]
        if (typeof value === 'string' && value) pricingParams.set(key, value)
      })
      const destination = pricingParams.toString() ? `/pricing?${pricingParams.toString()}` : '/pricing'
      const loginParams = new URLSearchParams({ mode: 'signup', redirect: destination, plan })
      window.location.href = `/login?${loginParams.toString()}`
      return
    }

    setLoading(plan)
    track('checkout_started', { plan, trial: false, from: 'pricing', source })
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, analytics: { attribution } }),
      })

      const data = await res.json()
      if (data.url) {
        track('checkout_viewed', { plan, trial: false, source })
        window.location.href = data.url
      } else {
        track('checkout_failed', { plan, trial: false, source, reason: data.error || 'missing_url' })
        toast({ title: 'Could not start checkout', description: typeof data.error === 'string' ? data.error : 'Please try again.', variant: 'destructive' })
      }
    } catch {
      track('checkout_failed', { plan, trial: false, source, reason: 'network_error' })
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
    <div className="min-h-screen bg-[#0b0f0c] relative overflow-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-[#b4fe57]/[0.07] blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#5f9745]/[0.06] blur-[120px]" />
      </div>

      {/* Header */}
      <nav className="relative z-10 container mx-auto px-4 py-3 sm:py-6">
        <div className="flex items-center justify-between">
          <Link href={user ? '/dashboard' : '/'} aria-label={user ? 'Back to dashboard' : 'Back to home'} className="-m-2 flex min-h-11 min-w-11 items-center justify-center gap-2 p-2 text-white/60 hover:text-white transition-all">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden text-sm font-medium sm:inline">{user ? 'Dashboard' : 'Home'}</span>
          </Link>
          <Link href="/" aria-label="Text Wingman home" className="inline-flex items-center gap-2 whitespace-nowrap text-base font-bold tracking-tight sm:text-lg">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#d3ff68] text-[#10180b]"><Send className="h-5 w-5" strokeWidth={2.4} /></span>
            <span>text<span className="text-[#d3ff68]">wingman</span><span className="text-white/45">.app</span></span>
          </Link>
          <div>
            {!checkingAuth && (
              user ? (
                <button onClick={handleSignOut} className="inline-flex min-h-11 items-center whitespace-nowrap px-2 text-white/60 hover:text-white text-sm font-medium transition-colors">Sign Out</button>
              ) : (
                <Link href="/login" className="inline-flex min-h-11 items-center whitespace-nowrap text-white/70 hover:text-white hover:bg-white/[0.06] rounded-xl px-3 text-sm font-semibold transition-all">Sign Up</Link>
              )
            )}
          </div>
        </div>
      </nav>

      <main className="relative z-10 container mx-auto px-4 py-6 sm:py-12">
        <div className="max-w-4xl mx-auto">
          {checkingAuth ? (
            <div role="status" className="py-20 text-center text-sm text-white/60">Checking your plan...</div>
          ) : planLoadFailed ? (
            <div role="alert" className="mx-auto max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center">
              <h1 className="text-xl font-black text-white">We couldn&apos;t check your plan.</h1>
              <p className="mt-3 text-sm text-white/60">Please try again before starting checkout.</p>
              <button type="button" onClick={() => window.location.reload()} className="mt-5 min-h-12 rounded-xl bg-[#d3ff68] px-6 font-bold text-[#10180b]">Try again</button>
            </div>
          ) : (<>
          {/* Pro User View */}
          {isPro ? (
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-[#d3ff68]/10 px-4 py-2 rounded-full mb-6 border border-[#d3ff68]/20">
                <CheckCircle2 className="h-4 w-4 text-[#d3ff68]" />
                <span className="text-[#d3ff68] font-bold text-sm">Pro access active</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
                You&apos;re Pro.
              </h1>
              <p className="text-lg text-white/50 mb-8">
                Unlimited access to Coach Mode, Intel, Strategy, and the verified pipeline.
              </p>
              
              <div className="bg-[#171f19] border border-[#465b48] rounded-3xl p-8 max-w-md mx-auto">
                <div className="flex items-center justify-center gap-2 mb-6">
                  <Sparkles className="h-5 w-5 text-[#d3ff68]" />
                  <h2 className="text-xl font-black text-white">Your Pro Benefits</h2>
                </div>
                <ul className="space-y-3 text-left mb-6">
                  <li className="flex items-center gap-3 text-white/80 text-sm">
                    <Check className="h-4 w-4 text-[#d3ff68] flex-shrink-0" />
                    Unlimited replies + Coach Mode
                  </li>
                  <li className="flex items-center gap-3 text-white/80 text-sm">
                    <Check className="h-4 w-4 text-[#d3ff68] flex-shrink-0" />
                    Intel sidebar — health, risk, timing
                  </li>
                  <li className="flex items-center gap-3 text-white/80 text-sm">
                    <Check className="h-4 w-4 text-[#d3ff68] flex-shrink-0" />
                    V2 Verified pipeline + Strategy
                  </li>
                  <li className="flex items-center gap-3 text-white/80 text-sm">
                    <Check className="h-4 w-4 text-[#d3ff68] flex-shrink-0" />
                    Simulated outcomes + confidence scores
                  </li>
                  <li className="flex items-center gap-3 text-white/80 text-sm">
                    <Check className="h-4 w-4 text-[#d3ff68] flex-shrink-0" />
                    Unlimited decodes, openers &amp; revives
                  </li>
                </ul>
                <p className="text-white/30 text-xs mb-4">
                  Plan: <span className="text-[#d3ff68] font-bold capitalize">{planType || 'Pro'}</span>
                </p>
                <Link href="/app" className="block w-full py-3.5 bg-[#d3ff68] text-[#10180b] font-black text-sm rounded-xl hover:bg-[#e4ffad] transition-colors text-center">
                  Open Coach →
                </Link>
                {planType && <Link href="/billing" className="mt-3 inline-block min-h-11 px-3 py-3 text-sm font-semibold text-white/65 hover:text-white">View billing</Link>}
              </div>
            </div>
          ) : (
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-[#d3ff68]/10 px-4 py-2 rounded-full mb-6 border border-[#d3ff68]/20">
                <Crown className="h-4 w-4 text-[#d3ff68]" />
                <span className="text-[#d3ff68] font-bold text-sm">PLANS FOR YOUR NEXT MOVE</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
                Say less. <span className="text-[#d3ff68]">Text better.</span>
              </h1>
              <p className="text-lg text-white/50">
                Get reply ideas, follow-up suggestions, and a coach to help you think through your next move.
              </p>
              <p className="mt-3 text-sm text-white/55">The free plan includes {FREE_REPLY_LIMIT} uses per {REPLY_USAGE_WINDOW_HOURS} hours, shared between reply generations and coach messages.</p>
            </div>
          )}

          <div className="flex flex-col">
          {!isPro && returningForTrial && (
            <div role="status" className="mx-auto mb-10 max-w-2xl rounded-3xl border border-[#56694a] bg-[#1b281a] p-6 text-center text-sm text-white/80">
              New Pro trials are temporarily unavailable. You can use the free plan or choose a paid plan below. No payment will start until you confirm it at checkout.
            </div>
          )}

          {/* Pricing Cards */}
          {!isPro && (
          <><h2 className="sr-only">Choose a plan</h2><div className="grid md:grid-cols-3 gap-5 w-full max-w-5xl mx-auto">
            {/* Monthly Plan — lower-commitment first choice */}
            <div className="relative flex flex-col bg-[#263528] border border-[#a4c778] rounded-3xl p-7">
              {selectedPlan === 'monthly' && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#d3ff68] px-4 py-1.5 text-[10px] font-black tracking-wider text-[#10180b] whitespace-nowrap">SELECTED PLAN</span>}
              <div className="text-center mb-6 pt-2">
                <h3 className="text-xl font-black text-white mb-1">Monthly</h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-black text-white">{PLAN_PRICES.monthly.displayAmount}</span>
                  <span className="text-white/30 text-sm">{PLAN_PRICES.monthly.displayInterval}</span>
                </div>
                <p className="text-white/40 text-xs mt-1.5">Full access. Cancel anytime.</p>
              </div>
              <ul className="space-y-2.5 mb-7 flex-1">
                <li className="flex items-center gap-2.5 text-white/80 text-sm">
                  <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" /> Unlimited replies + Coach Mode
                </li>
                <li className="flex items-center gap-2.5 text-white/80 text-sm">
                  <Target className="h-4 w-4 text-emerald-400 flex-shrink-0" /> Get context and suggestions for your next move
                </li>
                <li className="flex items-center gap-2.5 text-white/80 text-sm">
                  <Shield className="h-4 w-4 text-emerald-400 flex-shrink-0" /> Review and edit every reply before sending
                </li>
                <li className="flex items-center gap-2.5 text-white/60 text-sm">
                  <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" /> Openers, message reads and follow-up ideas
                </li>
                <li className="flex items-center gap-2.5 text-white/60 text-sm">
                  <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" /> Cancel anytime
                </li>
              </ul>
              <button
                onClick={() => handleCheckout('monthly')}
                disabled={loading !== null}
                className="w-full py-3.5 bg-[#d3ff68] text-[#10180b] font-black text-sm rounded-xl hover:bg-[#e4ffad] transition-colors disabled:opacity-50"
              >
                {loading === 'monthly' ? 'Loading...' : 'Get Pro Monthly →'}
              </button>
            </div>

            <div className="relative flex flex-col rounded-3xl border border-[#465b48] bg-[#171f19] p-7">
              <div className="text-center mb-6 pt-2">
                <h3 className="text-xl font-black text-white mb-1">Free</h3>
                <div className="flex items-baseline justify-center gap-1"><span className="text-4xl font-black text-white">$0</span><span className="text-white/40 text-sm"> to start</span></div>
                <p className="text-white/45 text-xs mt-1.5">No card required.</p>
              </div>
              <ul className="space-y-2.5 mb-7 flex-1">
                <li className="flex items-start gap-2.5 text-white/80 text-sm"><Check className="mt-0.5 h-4 w-4 text-[#d3ff68] flex-shrink-0" /> {FREE_REPLY_LIMIT} free uses per {REPLY_USAGE_WINDOW_HOURS} hours</li>
                <li className="flex items-start gap-2.5 text-white/80 text-sm"><Check className="mt-0.5 h-4 w-4 text-[#d3ff68] flex-shrink-0" /> 3 reply options per generation</li>
                <li className="flex items-start gap-2.5 text-white/80 text-sm"><Check className="mt-0.5 h-4 w-4 text-[#d3ff68] flex-shrink-0" /> Paste a text or upload a screenshot</li>
                <li className="flex items-start gap-2.5 text-white/80 text-sm"><Check className="mt-0.5 h-4 w-4 text-[#d3ff68] flex-shrink-0" /> Save conversations with a free account</li>
              </ul>
              <Link href="/#studio" className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#64765b] font-black text-sm text-white hover:border-[#d3ff68]">Try it free <ArrowUpRight className="h-4 w-4" /></Link>
            </div>

            {/* Annual Plan — best value without a misleading weekly anchor */}
            <div className="relative flex flex-col bg-[#171f19] border border-[#465b48] rounded-3xl p-7">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#d3ff68] text-[#10180b] px-4 py-1 rounded-full text-[10px] font-black tracking-wider whitespace-nowrap">
                {selectedPlan === 'annual' ? 'SELECTED · ' : ''}SAVE {ANNUAL_SAVINGS_PERCENT}%
              </div>
              <div className="text-center mb-6 pt-2">
                <h3 className="text-xl font-black text-white mb-1">Annual</h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-black text-white">{PLAN_PRICES.annual.displayAmount}</span>
                  <span className="text-white/30 text-sm">{PLAN_PRICES.annual.displayInterval}</span>
                </div>
                <p className="text-[#d3ff68] text-xs font-bold mt-1.5">{ANNUAL_MONTHLY_EQUIVALENT_DISPLAY}/month — save {ANNUAL_SAVINGS_DISPLAY}</p>
              </div>
              <ul className="space-y-2.5 mb-7 flex-1">
                <li className="flex items-center gap-2.5 text-white/80 text-sm">
                  <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" /> Everything in Pro Monthly
                </li>
                <li className="flex items-center gap-2.5 text-white/80 text-sm">
                  <Target className="h-4 w-4 text-emerald-400 flex-shrink-0" /> One annual payment
                </li>
                <li className="flex items-center gap-2.5 text-white/60 text-sm">
                  <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" /> First access to new features
                </li>
                <li className="flex items-center gap-2.5 text-white/60 text-sm">
                  <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" /> Priority support
                </li>
              </ul>
              <button
                onClick={() => handleCheckout('annual')}
                disabled={loading !== null}
                className="w-full py-3.5 border border-[#859c72] bg-[#263528] text-white font-black text-sm rounded-xl hover:border-[#d3ff68] transition-colors disabled:opacity-50"
              >
                {loading === 'annual' ? 'Loading...' : 'Get Annual →'}
              </button>
            </div>
          </div>
          </>
          )}
          </div>

          <section className="mx-auto mt-12 max-w-3xl rounded-3xl border border-[#465b48] bg-[#151e17] p-5 sm:p-7" aria-labelledby="compare-plans">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#d3ff68]">THE DETAILS</p>
            <h2 id="compare-plans" className="mt-2 text-2xl font-black text-white">Free vs. Pro</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full table-fixed border-collapse text-left text-xs text-white/70 sm:text-sm">
                <caption className="sr-only">Compare the Free and Pro plans</caption>
                <thead><tr className="border-b border-white/10 text-xs uppercase tracking-wider text-white/50"><th scope="col" className="w-1/2 py-3 pr-4">Feature</th><th scope="col" className="w-1/4 px-2 py-3">Free</th><th scope="col" className="w-1/4 pl-2 py-3">Pro</th></tr></thead>
                <tbody>
                  <tr className="border-b border-white/[0.06]"><th scope="row" className="py-4 pr-4 font-semibold text-white/85">Current public price</th><td className="px-3 py-4">$0</td><td className="pl-3 py-4">{PLAN_PRICES.monthly.displayAmount}/mo or {PLAN_PRICES.annual.displayAmount}/yr</td></tr>
                  <tr className="border-b border-white/[0.06]"><th scope="row" className="py-4 pr-4 font-semibold text-white/85">Reply and coach uses</th><td className="px-3 py-4">{FREE_REPLY_LIMIT} per {REPLY_USAGE_WINDOW_HOURS} hours</td><td className="pl-3 py-4">Unlimited</td></tr>
                  <tr className="border-b border-white/[0.06]"><th scope="row" className="py-4 pr-4 font-semibold text-white/85">Reply options per generation</th><td className="px-3 py-4">3</td><td className="pl-3 py-4">3</td></tr>
                  <tr><th scope="row" className="py-4 pr-4 font-semibold text-white/85">Save conversations</th><td className="px-3 py-4">With a free account</td><td className="pl-3 py-4">Included</td></tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-white/55">Free uses are shared between reply generations and coach messages in a rolling 24-hour window. Each reply generation provides three options. Paid subscriptions renew automatically until cancelled.{isPro && ' Public prices may differ from your current subscription; check your billing details.'}</p>
          </section>

          {/* Trust badges */}
          {!isPro && (
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-10 text-white/25 text-xs font-medium">
            <span>✓ Secure payment</span>
            <span>✓ Cancel anytime</span>
            <span>✓ Instant access</span>
            <span>✓ {FREE_REPLY_LIMIT} free uses per {REPLY_USAGE_WINDOW_HOURS} hours</span>
          </div>
          )}
          </>)}
        </div>
      </main>
    </div>
  )
}
