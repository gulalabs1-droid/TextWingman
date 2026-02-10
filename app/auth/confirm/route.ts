import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { redeemInviteCode, INVITE_CODES } from '@/lib/invite'

/**
 * After email confirmation, check if the user signed up with a pending invite code
 * in their metadata. If so, auto-redeem it server-side so they land on the dashboard
 * already activated — no extra clicks needed.
 */
async function handlePostConfirmation(user: { id: string; user_metadata?: Record<string, any> }, next: string, supabase: any): Promise<string> {
  const pendingCode = user.user_metadata?.pending_invite_code;

  if (pendingCode && INVITE_CODES[pendingCode.toUpperCase()]) {
    const result = await redeemInviteCode(user.id, pendingCode);
    if (result.success) {
      console.log(`Auto-redeemed invite code ${pendingCode} for user ${user.id}`);
      // Redirect to invite page to show success
      return `/invite/${pendingCode.toUpperCase()}`;
    }
    // If already pro or failed, just continue to normal redirect
    console.log(`Auto-redeem skipped for ${pendingCode}: ${result.error}`);
  }

  // If next is an invite or specific redirect, go there directly
  if (next.startsWith('/invite/') || next.startsWith('/pricing')) {
    return next;
  }

  // Otherwise check onboarding status
  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed')
    .eq('id', user.id)
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
      const redirect = await handlePostConfirmation(data.user, next, supabase)
      return NextResponse.redirect(new URL(redirect, request.url))
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
      const redirect = await handlePostConfirmation(data.user, next, supabase)
      return NextResponse.redirect(new URL(redirect, request.url))
    }
  }

  // Redirect to error page if verification fails
  return NextResponse.redirect(new URL('/login?error=verification_failed', request.url))
}
