'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Logo } from '@/components/Logo'
import { Sparkles } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [mode, setMode] = useState<'signin' | 'signup'>('signup')
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  
  // Get redirect URL from query params (for checkout flow)
  const redirectUrl = searchParams.get('redirect')
  const selectedPlan = searchParams.get('plan')

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setIsLoading(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      // If there's a redirect URL (from checkout flow), go there
      if (redirectUrl) {
        router.push(redirectUrl)
      } else {
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', user.id)
          .single()
        
        router.push(profile?.onboarding_completed ? '/dashboard' : '/onboarding')
      }
    } else {
      router.push('/dashboard')
    }
    router.refresh()
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setMessage(null)

    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setIsLoading(false)
      return
    }

    // If redirecting to pricing, show helpful message
    if (redirectUrl) {
      setMessage(`Account created! Check your email to confirm, then you'll be redirected to complete your ${selectedPlan || ''} subscription.`)
    } else {
      setMessage('Check your email to confirm your account!')
    }
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 p-4">
      {/* Logo */}
      <Link href="/" className="mb-8 transition-transform hover:scale-105">
        <Logo size="lg" showText={true} />
      </Link>

      <div className="w-full max-w-md p-8 space-y-6 bg-white/95 backdrop-blur rounded-3xl shadow-2xl">
        {/* Show upgrade notice if coming from pricing */}
        {redirectUrl && selectedPlan && (
          <div className="p-3 bg-purple-50 border-2 border-purple-200 rounded-xl mb-4">
            <p className="text-sm text-purple-700 font-medium text-center">
              🎉 Create an account to get your <span className="font-bold capitalize">{selectedPlan}</span> Pro subscription
            </p>
          </div>
        )}

        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            {mode === 'signup' ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="mt-2 text-gray-600">
            {mode === 'signup' 
              ? (redirectUrl ? 'Sign up to continue with your subscription' : 'Start getting perfect replies today')
              : 'Sign in to continue'}
          </p>
        </div>

        <form className="space-y-4" onSubmit={mode === 'signup' ? handleSignUp : handleSignIn}>
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="mt-1 w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border-2 border-red-200 rounded-xl">
              <p className="text-sm text-red-600 font-medium">{error}</p>
            </div>
          )}

          {message && (
            <div className="p-3 bg-green-50 border-2 border-green-200 rounded-xl">
              <p className="text-sm text-green-600 font-medium">{message}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 px-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 text-white font-bold text-lg rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {isLoading ? (
              'Loading...'
            ) : mode === 'signup' ? (
              <>
                <Sparkles className="h-5 w-5" />
                Create Free Account
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="text-center">
          {mode === 'signup' ? (
            <p className="text-gray-600">
              Already have an account?{' '}
              <button
                onClick={() => setMode('signin')}
                className="text-purple-600 font-semibold hover:text-purple-700 transition-colors"
              >
                Sign In
              </button>
            </p>
          ) : (
            <p className="text-gray-600">
              Don&apos;t have an account?{' '}
              <button
                onClick={() => setMode('signup')}
                className="text-purple-600 font-semibold hover:text-purple-700 transition-colors"
              >
                Sign Up Free
              </button>
            </p>
          )}
        </div>

        {mode === 'signup' && (
          <p className="text-center text-xs text-gray-400">
            3 free replies per day • No credit card required
          </p>
        )}
      </div>

      <p className="mt-6 text-purple-200 text-sm">
        <Link href="/" className="hover:text-white transition-colors">
          ← Back to home
        </Link>
      </p>
    </div>
  )
}
