import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Determine where to redirect after email confirmation
async function getRedirect(next: string, userId: string, supabase: any, request: NextRequest): Promise<string> {
  // If next is an invite or specific redirect, go there directly
  if (next.startsWith('/invite/') || next.startsWith('/pricing')) {
    return next;
  }
  // Otherwise check onboarding status
  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed')
    .eq('id', userId)
    .single();
  return profile?.onboarding_completed ? '/dashboard' : '/onboarding';
}

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
      return NextResponse.redirect(new URL(await getRedirect(next, data.user.id, supabase, request), request.url))
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
      return NextResponse.redirect(new URL(await getRedirect(next, data.user.id, supabase, request), request.url))
    }
  }

  // Redirect to error page if verification fails
  return NextResponse.redirect(new URL('/login?error=verification_failed', request.url))
}
