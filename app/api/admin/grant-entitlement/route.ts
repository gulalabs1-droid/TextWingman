import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isAdminEmail, validateAdminSecret } from '@/lib/isAdmin';
import { grantEntitlement, revokeEntitlement, Tier, Source } from '@/lib/entitlements';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Validate admin secret from header
    const adminSecret = request.headers.get('x-admin-secret');
    if (!validateAdminSecret(adminSecret)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { email, tier, action = 'grant' } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Look up user by email
    const { data: users, error: userError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', email)
      .single();

    if (userError || !users) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = users.id;

    if (action === 'revoke') {
      const result = await revokeEntitlement(userId);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }
      return NextResponse.json({ 
        success: true, 
        message: `Revoked entitlement for ${email}` 
      });
    }

    // Grant entitlement
    if (!tier || !['free', 'pro', 'elite'].includes(tier)) {
      return NextResponse.json({ error: 'Valid tier required (free, pro, elite)' }, { status: 400 });
    }

    const source: Source = 'admin';
    const result = await grantEntitlement(userId, tier as Tier, source);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Granted ${tier} access to ${email}`,
      data: { userId, email, tier, source }
    });

  } catch (error) {
    console.error('Grant entitlement error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Validate admin secret
    const adminSecret = request.headers.get('x-admin-secret');
    if (!validateAdminSecret(adminSecret)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // List all entitlements
    const { data: entitlements, error } = await supabase
      .from('entitlements')
      .select(`
        id,
        user_id,
        tier,
        source,
        created_at,
        updated_at,
        profiles!inner(email)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ entitlements });

  } catch (error) {
    console.error('List entitlements error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
