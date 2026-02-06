import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function POST(request: NextRequest) {
  try {
    const { suggestion } = await request.json();

    if (!suggestion || typeof suggestion !== 'string' || suggestion.trim().length === 0) {
      return NextResponse.json({ error: 'Suggestion is required' }, { status: 400 });
    }

    const serverSupabase = await createServerClient();
    const { data: { user } } = await serverSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
    }

    // Get user's subscription for context
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan_type, status')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .single();

    const { error } = await supabase
      .from('suggestions')
      .insert({
        user_id: user.id,
        suggestion: suggestion.trim(),
        user_email: user.email,
        plan_type: subscription?.plan_type || 'free',
      });

    if (error) {
      console.error('Failed to save suggestion:', error);
      return NextResponse.json({ error: 'Failed to save suggestion' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Suggestion API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
