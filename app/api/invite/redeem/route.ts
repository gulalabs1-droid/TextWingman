import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// Valid invite codes and their config
const INVITE_CODES: Record<string, { days: number; tier: string; maxUses: number }> = {
  'FAMILYV2': { days: 7, tier: 'pro', maxUses: 50 },
  'FRIENDSV2': { days: 7, tier: 'pro', maxUses: 50 },
  'BETAV2': { days: 14, tier: 'pro', maxUses: 100 },
};

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Invite code is required' }, { status: 400 });
    }

    const upperCode = code.toUpperCase().trim();
    const config = INVITE_CODES[upperCode];

    if (!config) {
      return NextResponse.json({ error: 'Invalid invite code' }, { status: 400 });
    }

    // Must be logged in
    const serverSupabase = await createServerClient();
    const { data: { user } } = await serverSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Please sign up or log in first' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
    }

    // Check if user already has an active entitlement or subscription
    const { data: existing } = await supabase
      .from('entitlements')
      .select('tier, source, expires_at')
      .eq('user_id', user.id)
      .single();

    if (existing && existing.tier !== 'free') {
      // Check if it's expired
      if (!existing.expires_at || new Date(existing.expires_at) > new Date()) {
        return NextResponse.json({ 
          error: 'You already have Pro access!',
          alreadyPro: true,
        }, { status: 409 });
      }
    }

    // Check active Stripe subscription
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('status')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .single();

    if (sub) {
      return NextResponse.json({ 
        error: 'You already have an active subscription!',
        alreadyPro: true,
      }, { status: 409 });
    }

    // Check how many times this code has been used
    const { count } = await supabase
      .from('entitlements')
      .select('*', { count: 'exact', head: true })
      .eq('source', 'beta')
      .like('metadata->>invite_code', upperCode);

    if (count !== null && count >= config.maxUses) {
      return NextResponse.json({ error: 'This invite code has reached its limit' }, { status: 410 });
    }

    // Grant time-limited pro entitlement
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + config.days);

    const { error } = await supabase
      .from('entitlements')
      .upsert({
        user_id: user.id,
        tier: config.tier,
        source: 'beta',
        expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (error) {
      console.error('Error granting invite entitlement:', error);
      return NextResponse.json({ error: 'Failed to activate invite' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      tier: config.tier,
      days: config.days,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error('Invite redeem error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
