import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/onboarding'

  // Handle PKCE flow (code exchange)
  if (code) {
    const supabase = await createClient()
    const { error, data } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.user) {
      // Check if user has completed onboarding
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', data.user.id)
        .single()

      const redirectTo = profile?.onboarding_completed ? '/dashboard' : '/onboarding'
      return NextResponse.redirect(new URL(redirectTo, request.url))
    }
  }

  // Handle token_hash flow (legacy)
  if (token_hash && type) {
    const supabase = await createClient()

    const { error, data } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })
    
    if (!error && data.user) {
      // Check if user has completed onboarding
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', data.user.id)
        .single()

      // Redirect to onboarding if not completed, otherwise dashboard
      const redirectTo = profile?.onboarding_completed ? '/dashboard' : '/onboarding'
      return NextResponse.redirect(new URL(redirectTo, request.url))
    }
  }

  // Redirect to error page if verification fails
  return NextResponse.redirect(new URL('/login?error=verification_failed', request.url))
}
