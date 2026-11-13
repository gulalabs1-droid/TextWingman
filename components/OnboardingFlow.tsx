'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Camera, Loader2, MessageSquareText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Logo } from '@/components/Logo'
import { track } from '@/lib/analytics'
import { FREE_REPLY_LIMIT } from '@/lib/usage-limits'
import {
  ARRIVAL_STORAGE_KEY,
  CONTEXT_STORAGE_KEY,
  ONBOARDING_CONTEXTS,
  TOUR_STORAGE_KEY,
  firstNameOf,
  onboardingDestination,
  type OnboardingContext,
  type StartIntent,
} from '@/lib/first-run'

const PENDING_THREAD_MAX_AGE_MS = 24 * 60 * 60 * 1000

function hasFreshPendingThread(): boolean {
  try {
    const raw = localStorage.getItem('tw_pending_thread')
    if (!raw) return false
    const pending = JSON.parse(raw)
    if (pending.savedAt && Date.now() - pending.savedAt <= PENDING_THREAD_MAX_AGE_MS) return true
    localStorage.removeItem('tw_pending_thread')
  } catch {}
  return false
}

type Step = 'name' | 'context' | 'start'

export default function OnboardingFlow() {
  const router = useRouter()
  const [supabase] = useState(() => createClient())
  const [step, setStep] = useState<Step>('name')
  const [fullName, setFullName] = useState('')
  const [context, setContext] = useState<OnboardingContext | null>(null)
  const [saving, setSaving] = useState<StartIntent | 'explore' | null>(null)
  const [error, setError] = useState<string | null>(null)
  // People who arrive with an invite to redeem or a reply already in progress
  // have a destination waiting, so they skip the "pick a first action" step.
  const [hasDestination, setHasDestination] = useState(false)
  const pendingInviteCode = useRef<unknown>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    let cancelled = false
    const pendingThread = hasFreshPendingThread()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (cancelled) return
      pendingInviteCode.current = user?.user_metadata?.pending_invite_code ?? null
      setHasDestination(pendingThread || Boolean(pendingInviteCode.current))
      const knownName = user?.user_metadata?.full_name || user?.user_metadata?.name
      if (typeof knownName === 'string') setFullName(current => current || knownName.slice(0, 80))
    }).catch(() => {
      if (!cancelled) setHasDestination(pendingThread)
    })
    track('onboarding_started')
    return () => { cancelled = true }
  }, [supabase])

  // Move focus to each step's heading so keyboard and screen-reader users follow along.
  useEffect(() => {
    if (step !== 'name') headingRef.current?.focus()
  }, [step])

  const steps: Step[] = hasDestination ? ['name', 'context'] : ['name', 'context', 'start']
  const stepIndex = steps.indexOf(step)
  const firstName = firstNameOf(fullName)

  const finish = async (start: StartIntent | null, chosenContext = context) => {
    if (saving) return
    setSaving(start ?? 'explore')
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/login')
        return
      }
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          ...(fullName.trim() ? { full_name: fullName.trim().slice(0, 80) } : {}),
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
      if (updateError) throw updateError

      const pendingThread = hasFreshPendingThread()
      try {
        if (chosenContext) localStorage.setItem(CONTEXT_STORAGE_KEY, chosenContext)
        // Onboarding already covered what the first-visit tour explains.
        localStorage.setItem(TOUR_STORAGE_KEY, 'onboarding')
        sessionStorage.setItem(ARRIVAL_STORAGE_KEY, 'new')
      } catch {}
      track('onboarding_completed', {
        named: Boolean(fullName.trim()),
        context: chosenContext || 'skipped',
        start: start || 'explore',
      })
      router.push(onboardingDestination({
        pendingInviteCode: user.user_metadata?.pending_invite_code ?? pendingInviteCode.current,
        hasPendingThread: pendingThread,
        start,
      }))
      router.refresh()
    } catch {
      setError("We couldn't save that. Check your connection and try again.")
      setSaving(null)
    }
  }

  const afterContext = (chosen: OnboardingContext | null) => {
    setContext(chosen)
    if (hasDestination) void finish(null, chosen)
    else setStep('start')
  }

  const busy = saving !== null

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-ink text-white">
      <div className="pointer-events-none fixed inset-0" aria-hidden="true">
        <div className="absolute left-[-10%] top-[-20%] h-[60%] w-[60%] rounded-full" style={{ background: 'rgba(211,255,104,0.10)', filter: 'blur(120px)' }} />
        <div className="absolute bottom-[-10%] right-[-10%] h-[50%] w-[50%] rounded-full" style={{ background: 'rgba(211,255,104,0.05)', filter: 'blur(120px)' }} />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))]">
        <header className="flex h-10 items-center justify-between">
          {stepIndex > 0 ? (
            <button
              type="button"
              onClick={() => setStep(steps[stepIndex - 1])}
              disabled={busy}
              aria-label="Back"
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/[0.10] bg-white/[0.05] text-white/70 transition-all hover:bg-white/[0.10] active:scale-95 disabled:opacity-40"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          ) : (
            <Logo size="sm" showText={true} />
          )}
          <div className="flex items-center gap-1.5" role="img" aria-label={`Step ${stepIndex + 1} of ${steps.length}`}>
            {steps.map((name, index) => (
              <span
                key={name}
                className={`h-1.5 rounded-full transition-all duration-300 ${index === stepIndex ? 'w-6 bg-brand' : index < stepIndex ? 'w-1.5 bg-white/40' : 'w-1.5 bg-white/15'}`}
              />
            ))}
          </div>
          {step !== 'start' ? (
            <button
              type="button"
              onClick={() => void finish(null)}
              disabled={busy}
              className="flex h-10 items-center rounded-xl px-2 text-sm font-semibold text-white/55 transition-colors hover:text-white/85 disabled:opacity-40"
            >
              Skip
            </button>
          ) : (
            <span className="w-10" />
          )}
        </header>

        <main className="flex flex-1 flex-col justify-center py-8">
          {step === 'name' && (
            <form
              key="name"
              onSubmit={(event) => { event.preventDefault(); setStep('context') }}
              className="animate-in fade-in slide-in-from-bottom-3 duration-300"
            >
              <p className="text-sm font-semibold text-brand">Welcome to Text Wingman</p>
              <h1 className="mt-2 text-3xl font-black leading-tight">What should Coach call you?</h1>
              <p className="mt-2 text-[15px] leading-relaxed text-white/60">Coach talks to you like a friend would. A first name is plenty.</p>
              <label htmlFor="fullName" className="sr-only">Your name</label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                autoComplete="given-name"
                autoCapitalize="words"
                enterKeyHint="next"
                maxLength={80}
                autoFocus
                placeholder="Your first name"
                className="mt-6 h-14 w-full rounded-2xl border border-white/[0.12] bg-white/[0.06] px-4 text-lg text-white placeholder-white/35 outline-none transition-colors focus:border-brand/70 focus:bg-white/[0.08]"
              />
              <button
                type="submit"
                className="mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-brand text-base font-bold text-brand-ink shadow-lg shadow-brand/20 transition-all hover:bg-brand-soft active:scale-[0.98]"
              >
                Continue <ArrowRight className="h-5 w-5" />
              </button>
            </form>
          )}

          {step === 'context' && (
            <section key="context" className="animate-in fade-in slide-in-from-bottom-3 duration-300">
              <h1 ref={headingRef} tabIndex={-1} className="text-3xl font-black leading-tight outline-none">
                {firstName ? `${firstName}, who are you texting most?` : 'Who are you texting most?'}
              </h1>
              <p className="mt-2 text-[15px] leading-relaxed text-white/60">Coach tunes its tone to match. You can switch any time.</p>
              <div className="mt-6 grid grid-cols-2 gap-2.5">
                {ONBOARDING_CONTEXTS.map(option => {
                  const selected = context === option.value
                  return (
                    <button
                      key={option.value}
                      type="button"
                      disabled={busy}
                      aria-pressed={selected}
                      onClick={() => afterContext(option.value)}
                      className={`flex min-h-[4.5rem] items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all active:scale-[0.97] disabled:opacity-50 ${selected ? 'border-brand/60 bg-brand/[0.16]' : 'border-white/[0.10] bg-white/[0.05] hover:border-white/[0.20] hover:bg-white/[0.08]'}`}
                    >
                      <span className="text-2xl" aria-hidden="true">{option.emoji}</span>
                      <span className="min-w-0">
                        <span className="block text-[15px] font-bold text-white/90">{option.label}</span>
                        <span className="block text-xs text-white/55">{option.hint}</span>
                      </span>
                    </button>
                  )
                })}
              </div>
              {busy && (
                <p className="mt-5 flex items-center justify-center gap-2 text-sm text-white/60" role="status">
                  <Loader2 className="h-4 w-4 animate-spin" /> Setting up Coach…
                </p>
              )}
            </section>
          )}

          {step === 'start' && (
            <section key="start" className="animate-in fade-in slide-in-from-bottom-3 duration-300">
              <h1 ref={headingRef} tabIndex={-1} className="text-3xl font-black leading-tight outline-none">Start with a real text.</h1>
              <p className="mt-2 text-[15px] leading-relaxed text-white/60">
                You get {FREE_REPLY_LIMIT} free replies every 24 hours. Pick how you want to bring in the conversation.
              </p>
              <div className="mt-6 space-y-2.5">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void finish('screenshot')}
                  className="flex w-full items-center gap-4 rounded-2xl bg-brand p-4 text-left text-brand-ink shadow-lg shadow-brand/20 transition-all hover:bg-brand-soft active:scale-[0.98] disabled:opacity-60"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-ink/10">
                    {saving === 'screenshot' ? <Loader2 className="h-6 w-6 animate-spin" /> : <Camera className="h-6 w-6" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-bold">Upload a screenshot</span>
                    <span className="block text-sm text-brand-ink/75">Coach reads the whole thread for you</span>
                  </span>
                  <ArrowRight className="h-5 w-5 shrink-0 text-brand-ink/80" />
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void finish('paste')}
                  className="flex w-full items-center gap-4 rounded-2xl border border-white/[0.12] bg-white/[0.06] p-4 text-left transition-all hover:border-white/[0.22] hover:bg-white/[0.09] active:scale-[0.98] disabled:opacity-60"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/[0.08]">
                    {saving === 'paste' ? <Loader2 className="h-6 w-6 animate-spin" /> : <MessageSquareText className="h-6 w-6 text-brand" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-bold text-white/90">Paste their message</span>
                    <span className="block text-sm text-white/60">Get three replies in seconds</span>
                  </span>
                  <ArrowRight className="h-5 w-5 shrink-0 text-white/50" />
                </button>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => void finish(null)}
                className="mx-auto mt-5 flex min-h-11 items-center gap-2 px-3 text-sm font-semibold text-white/55 transition-colors hover:text-white/85 disabled:opacity-40"
              >
                {saving === 'explore' && <Loader2 className="h-4 w-4 animate-spin" />}
                I&apos;ll look around first
              </button>
            </section>
          )}

          {error && (
            <p role="alert" className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>
          )}
        </main>
      </div>
    </div>
  )
}
