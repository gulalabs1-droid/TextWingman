import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { getUserTier, ensureAdminAccess, hasPro } from '@/lib/entitlements';
import { analyzeStrategy } from '@/lib/strategy';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function POST(req: Request) {
  try {
    const { threadText, context } = await req.json();

    if (!threadText || typeof threadText !== 'string') {
      return NextResponse.json({ error: 'threadText is required' }, { status: 400 });
    }

    // Auth check
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Pro check
    await ensureAdminAccess(user.id, user.email || '');
    const entitlement = await getUserTier(user.id, user.email || '');

    if (!hasPro(entitlement.tier)) {
      return NextResponse.json({ error: 'Strategy Mode requires Pro access' }, { status: 403 });
    }

    // Run analysis
    const { strategy, metrics, latencyMs } = await analyzeStrategy(threadText, context);

    // Log to Supabase (async, don't block response)
    const admin = getSupabaseAdmin();
    if (admin) {
      admin.from('strategy_logs').insert({
        user_id: user.id,
        thread_preview: threadText.substring(0, 200),
        momentum: strategy.momentum,
        balance: strategy.balance,
        energy: strategy.move.energy,
        one_liner: strategy.move.one_liner,
        risk: strategy.move.risk,
        constraints: strategy.move.constraints,
        latency_ms: latencyMs,
      }).then(({ error }) => {
        if (error) console.error('Strategy log error:', error.message);
      });
    }

    return NextResponse.json({ strategy, metrics, latencyMs });
  } catch (error) {
    console.error('Strategy route error:', error);
    return NextResponse.json({ error: 'Strategy analysis failed' }, { status: 500 });
  }
}
