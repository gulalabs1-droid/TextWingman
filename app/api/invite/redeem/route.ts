import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { redeemInviteCode } from '@/lib/invite';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Invite code is required' }, { status: 400 });
    }

    // Must be logged in
    const serverSupabase = await createServerClient();
    const { data: { user } } = await serverSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Please sign up or log in first' }, { status: 401 });
    }

    const result = await redeemInviteCode(user.id, code);

    if (!result.success) {
      const status = result.alreadyPro ? 409 : 400;
      return NextResponse.json({ error: result.error, alreadyPro: result.alreadyPro }, { status });
    }

    return NextResponse.json({
      success: true,
      tier: result.tier,
      days: result.days,
      expiresAt: result.expiresAt,
    });
  } catch (error) {
    console.error('Invite redeem error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
