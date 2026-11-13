'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, ArrowUpRight, Eye, EyeOff, Loader2, Mail, Send } from 'lucide-react'
import { track } from '@/lib/analytics'
import { PLAN_PRICES } from '@/lib/pricing'
import { FREE_REPLY_LIMIT, REPLY_USAGE_WINDOW_HOURS } from '@/lib/usage-limits'
import { isSavedThreadReturn, safeReturnPath } from '@/lib/navigation'
import { ARRIVAL_STORAGE_KEY } from '@/lib/first-run'
import {
  OTP_RESEND_COOLDOWN_SECONDS,
  authEmailOptions,
  friendlyAuthError,
  isNewlyCreatedUser,
  isPlausibleOtp,
  normalizeOtp,
  passwordSignupError,
  postAuthDestination,
} from '@/lib/auth-flow'

type Step = 'email' | 'code' | 'password' | 'signup-confirmation'

// Turn on only after the Supabase email templates include {{ .Token }} (scripts/apply-auth-email-templates.mjs).
// Until then the email contains a link, so we ask people to tap it instead of typing a code.
const EMAIL_CODE_ENABLED = process.env.NEXT_PUBLIC_AUTH_EMAIL_CODE === 'true'

const inputClass = 'mt-1.5 w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-base text-white placeholder-white/35 transition-colors focus:border-[#c7f75c] focus:outline-none focus:ring-4 focus:ring-[#c7f75c]/15'
const primaryButtonClass = 'flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#c7f75c] px-4 font-bold text-[#10180b] transition-colors hover:bg-[#dcff8e] disabled:opacity-60'
const linkButtonClass = 'min-h-11 text-sm font-semibold text-[#c7f75c] hover:text-white disabled:opacity-50'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [mode, setMode] = useState<'signin' | 'signup'>(searchParams.get('mode') === 'signin' ? 'signin' : 'signup')
  const [step, setStep] = useState<Step>(searchParams.get('error') === 'verification_failed' ? 'email' : 'password')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [resendIn, setResendIn] = useState(0)
  const [error, setError] = useState<string | null>(
    searchParams.get('error') === 'verification_failed'
      ? `That email link expired or opened in a different browser. Enter your email to get a new ${EMAIL_CODE_ENABLED ? 'code' : 'link'}.`
      : null,
  )

  const redirectUrl = searchParams.get('redirect') ? safeReturnPath(searchParams.get('redirect')) : null
  const selectedPlan = searchParams.get('plan')
  const isTrial = redirectUrl ? new URL(redirectUrl, 'https://textwingman.app').searchParams.get('trial') === '1' : false
  const isReplySaveFlow = redirectUrl ? isSavedThreadReturn(redirectUrl) : false
  const from = isReplySaveFlow ? 'save_thread' : redirectUrl ? 'checkout' : 'login'

  useEffect(() => {
    if (resendIn <= 0) return
    const timer = window.setTimeout(() => setResendIn(seconds => seconds - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [resendIn])

  const finishSignIn = async (userId: string) => {
    let onboardingComplete = false
    if (!redirectUrl) {
      const { data: profile } = await supabase.from('profiles').select('onboarding_completed').eq('id', userId).single()
      onboardingComplete = Boolean(profile?.onboarding_completed)
    }
    // Coach greets people once when they arrive from sign-in.
    try { sessionStorage.setItem(ARRIVAL_STORAGE_KEY, 'returning') } catch {}
    router.push(postAuthDestination(redirectUrl, onboardingComplete))
    router.refresh()
  }

  const sendCode = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const address = email.trim()
    if (!address) return
    setIsLoading(true)
    setError(null)
    track(mode === 'signup' ? 'signup_start' : 'sign_in_started', { from, method: 'email_code', plan: selectedPlan || undefined })

    const { error } = await supabase.auth.signInWithOtp({
      email: address,
      options: {
        shouldCreateUser: true,
        ...authEmailOptions(window.location.origin, redirectUrl),
      },
    })

    setIsLoading(false)
    if (error) {
      setError(friendlyAuthError(error.message))
      track('auth_code_failed', { from, stage: 'send', reason: error.message.slice(0, 80) })
      return
    }
    track('auth_code_sent', { from })
    setCode('')
    setStep('code')
    setResendIn(OTP_RESEND_COOLDOWN_SECONDS)
  }

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = normalizeOtp(code)
    if (!isPlausibleOtp(token)) {
      setError('Enter the full code from the email.')
      return
    }
    setIsLoading(true)
    setError(null)
    const { data, error } = await supabase.auth.verifyOtp({ email: email.trim(), token, type: 'email' })
    if (error || !data.user) {
      setIsLoading(false)
      setError(friendlyAuthError(error?.message))
      track('auth_code_failed', { from, stage: 'verify', reason: (error?.message || 'no_user').slice(0, 80) })
      return
    }
    const isNew = isNewlyCreatedUser(data.user.created_at, Date.now())
    track(isNew ? 'signup_complete' : 'sign_in_completed', { from, method: 'email_code', confirmed: true, plan: selectedPlan || undefined })
    await finishSignIn(data.user.id)
  }

  const signInWithPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    track('sign_in_started', { from, method: 'password' })
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error || !data.user) {
      setIsLoading(false)
      setError(friendlyAuthError(error?.message))
      return
    }
    track('sign_in_completed', { from, method: 'password' })
    await finishSignIn(data.user.id)
  }

  const signUpWithPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    const validationError = passwordSignupError(password, confirmation)
    if (validationError) {
      setError(validationError)
      return
    }
    setIsLoading(true)
    setError(null)
    track('signup_start', { from, method: 'password', plan: selectedPlan || undefined })
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: authEmailOptions(window.location.origin, redirectUrl),
      })
      if (error) {
        setError(friendlyAuthError(error.message))
        return
      }
      setPassword('')
      setConfirmation('')
      if (data.user && data.session) {
        track('signup_complete', { from, method: 'password', plan: selectedPlan || undefined })
        await finishSignIn(data.user.id)
        return
      }
      setStep('signup-confirmation')
    } catch {
      setError('Unable to connect. Please check your connection and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const goToStep = (next: Step) => {
    setError(null)
    if (next !== 'password') {
      setPassword('')
      setConfirmation('')
      setShowPassword(false)
    }
    setStep(next)
  }

  const switchMode = () => {
    setMode(mode === 'signup' ? 'signin' : 'signup')
    setPassword('')
    setConfirmation('')
    setShowPassword(false)
    goToStep('password')
  }

  const heading = step === 'code' || step === 'signup-confirmation'
    ? 'Check your email'
    : step === 'password'
      ? mode === 'signin' ? 'Welcome back' : isReplySaveFlow ? 'Save your thread' : 'Create your free account'
      : mode === 'signin'
        ? 'Welcome back'
        : isReplySaveFlow ? 'Save your thread' : 'Create your free account'

  const subheading = step === 'signup-confirmation'
    ? <>If this email can be used, we&apos;ll send a confirmation link to <span className="font-semibold text-white">{email.trim()}</span>. Open it to continue. If you already have an account, sign in instead.</>
    : step === 'code'
    ? EMAIL_CODE_ENABLED
      ? <>We sent a code to <span className="font-semibold text-white">{email.trim()}</span>. Copy it and paste it here. Keep this page open.</>
      : <>We sent a link to <span className="font-semibold text-white">{email.trim()}</span>. Tap it to finish. You&apos;ll be signed in right away.</>
    : step === 'password'
      ? mode === 'signin' ? 'Sign in to pick up where you left off.' : 'Create a password and confirm your email to continue.'
      : mode === 'signin'
        ? `Enter your email and we will send you a sign-in ${EMAIL_CODE_ENABLED ? 'code' : 'link'}. No password needed.`
        : isReplySaveFlow
          ? 'Free account. Keep this reply and come back when they answer.'
          : redirectUrl && selectedPlan ? 'Create an account to review your selected plan.' : 'Save your conversations and come back when they answer.'

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0b100c] p-4 text-white">
      <div aria-hidden="true" className="pointer-events-none fixed -top-40 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-[#a0e23d]/[0.07] blur-3xl" />
      <Link href="/" aria-label="Text Wingman home" className="relative mb-7 inline-flex items-center gap-2.5 text-lg font-bold tracking-tight">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#c7f75c] text-[#10180b]"><Send className="h-5 w-5" strokeWidth={2.4} /></span>
        <span>text<span className="text-[#c7f75c]">wingman</span><span className="text-white/45">.app</span></span>
      </Link>

      <main className="relative w-full max-w-md space-y-5 rounded-3xl border border-[#c7f75c]/15 bg-[#151c16] p-6 shadow-2xl sm:p-8">
        {(step === 'email' || step === 'password') && redirectUrl && selectedPlan && (
          <p className="rounded-xl border border-[#c7f75c]/20 bg-[#c7f75c]/[0.07] p-3 text-center text-sm text-[#e0f4be]">
            {isTrial ? <>Sign in to continue to your 7-day free trial. No card is needed to start; after seven days, access pauses unless you add a payment method. Monthly Pro is {PLAN_PRICES.monthly.displayAmount}/month.</> : <>Sign in to review your <span className="font-bold capitalize">{selectedPlan}</span> Pro plan.</>}
          </p>
        )}

        <div className="text-center">
          <h1 className="text-2xl font-bold sm:text-3xl">{heading}</h1>
          <p className="mt-2 text-sm leading-relaxed text-white/60">{subheading}</p>
        </div>

        {step === 'email' && (
          <form className="space-y-4" onSubmit={sendCode}>
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-white/80">Email</label>
              <input id="email" type="email" inputMode="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required className={inputClass} placeholder="you@example.com" />
            </div>
            <button type="submit" disabled={isLoading} className={primaryButtonClass}>
              {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</> : <><Mail className="h-4 w-4" /> {`Email me a ${EMAIL_CODE_ENABLED ? 'code' : 'link'}${isReplySaveFlow && mode === 'signup' ? ' to save it' : ''}`}</>}
            </button>
          </form>
        )}

        {step === 'code' && !EMAIL_CODE_ENABLED && (
          <div className="space-y-4">
            {isReplySaveFlow && (
              <p className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs leading-relaxed text-white/60">
                Your reply is saved on this device for 24 hours. For the smoothest return, open the link in this same browser.
              </p>
            )}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <button type="button" onClick={() => void sendCode()} disabled={isLoading || resendIn > 0} className={linkButtonClass}>
                {resendIn > 0 ? `Send a new link in ${resendIn}s` : 'Send a new link'}
              </button>
              <button type="button" onClick={() => goToStep('email')} className={linkButtonClass}>Use a different email</button>
            </div>
            <p className="text-xs leading-relaxed text-white/45">Not there? Check spam or promotions.</p>
          </div>
        )}

        {step === 'code' && EMAIL_CODE_ENABLED && (
          <form className="space-y-4" onSubmit={verifyCode}>
            <div>
              <label htmlFor="code" className="block text-sm font-semibold text-white/80">Code from the email</label>
              <input id="code" type="text" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={e => setCode(normalizeOtp(e.target.value))} required autoFocus maxLength={10} className={`${inputClass} text-center font-mono text-2xl tracking-[0.4em]`} placeholder="••••••" />
            </div>
            <button type="submit" disabled={isLoading} className={primaryButtonClass}>
              {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Checking…</> : isReplySaveFlow ? 'Verify and save my thread' : 'Verify and continue'}
            </button>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <button type="button" onClick={() => void sendCode()} disabled={isLoading || resendIn > 0} className={linkButtonClass}>
                {resendIn > 0 ? `Send a new code in ${resendIn}s` : 'Send a new code'}
              </button>
              <button type="button" onClick={() => goToStep('email')} className={linkButtonClass}>Use a different email</button>
            </div>
            <p className="text-xs leading-relaxed text-white/45">Not there? Check spam or promotions. The code expires after a while, so use the newest email.</p>
          </form>
        )}

        {step === 'password' && (
          <form className="space-y-4" onSubmit={mode === 'signup' ? signUpWithPassword : signInWithPassword}>
            <div>
              <label htmlFor="password-email" className="block text-sm font-semibold text-white/80">Email</label>
              <input id="password-email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required className={inputClass} placeholder="you@example.com" />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-white/80">Password</label>
              <div className="relative">
                <input id="password" type={showPassword ? 'text' : 'password'} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} minLength={mode === 'signup' ? 8 : undefined} value={password} onChange={e => setPassword(e.target.value)} required className={`${inputClass} pr-12`} placeholder={mode === 'signup' ? 'At least 8 characters' : 'Your password'} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-1 top-1/2 mt-0.5 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-white/45 hover:text-white">
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            {mode === 'signup' && (
              <div>
                <label htmlFor="confirm-password" className="block text-sm font-semibold text-white/80">Confirm password</label>
                <input id="confirm-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" minLength={8} value={confirmation} onChange={e => setConfirmation(e.target.value)} required className={inputClass} placeholder="Repeat your password" />
              </div>
            )}
            <button type="submit" disabled={isLoading} className={primaryButtonClass}>
              {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> {mode === 'signup' ? 'Creating account…' : 'Signing in…'}</> : <>{mode === 'signup' ? 'Create free account' : 'Sign in'} <ArrowUpRight className="h-4 w-4" /></>}
            </button>
            <button type="button" onClick={() => goToStep('email')} className={`${linkButtonClass} w-full`}>{mode === 'signin' ? 'Use an email link instead' : 'Continue with an email link instead'}</button>
          </form>
        )}

        {step === 'signup-confirmation' && (
          <div className="space-y-2 text-center">
            <p className="text-xs leading-relaxed text-white/55">Check spam or promotions if you don&apos;t see it. Open the link in this browser for the smoothest return.</p>
            <button type="button" onClick={() => { setMode('signin'); goToStep('password') }} className={`${linkButtonClass} w-full`}>Already have an account? Sign in</button>
            <button type="button" onClick={() => goToStep('email')} className={`${linkButtonClass} w-full`}>Try an email link instead</button>
          </div>
        )}

        {error && (
          <div role="alert" className="rounded-xl border border-red-300/20 bg-red-400/10 p-3 text-sm text-red-100">{error}</div>
        )}

        {(step === 'email' || step === 'password') && (
          <div className="space-y-2 border-t border-white/[0.08] pt-4 text-center text-sm text-white/55">
            <p>
              {mode === 'signup' ? 'Already have an account? ' : 'New here? '}
              <button type="button" onClick={switchMode} className="-my-3 inline-flex min-h-11 items-center px-1 font-semibold text-[#c7f75c] hover:text-white">
                {mode === 'signup' ? 'Sign in' : 'Create a free account'}
              </button>
            </p>
            {step === 'email' && <button type="button" onClick={() => goToStep('password')} className="min-h-11 text-xs text-white/65 hover:text-white">{mode === 'signup' ? 'Create an account with a password' : 'Sign in with a password'}</button>}
          </div>
        )}

        {mode === 'signup' && (step === 'email' || step === 'password') && (
          <p className="text-center text-xs text-white/45">Free plan: {FREE_REPLY_LIMIT} uses per {REPLY_USAGE_WINDOW_HOURS} hours · No card required for Free</p>
        )}
      </main>

      <Link href="/" className="relative mt-6 inline-flex min-h-11 items-center gap-1.5 text-sm text-white/50 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Back to home
      </Link>
    </div>
  )
}
