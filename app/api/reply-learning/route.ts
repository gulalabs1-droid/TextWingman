import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { buildRequestAnalytics } from '@/lib/analytics-server';

export const dynamic = 'force-dynamic';

const EVENTS = new Set([
  'generated',
  'selected',
  'copied',
  'edited',
  'sent_confirmed',
  'outcome_reported',
  'style_signal_recorded',
]);

const OUTCOMES = new Set(['got_reply', 'no_reply', 'not_reported']);

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function cleanString(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

function cleanSignals(value: unknown): Record<string, number | boolean> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const allowed = new Set([
    'word_count',
    'question_count',
    'exclamation_count',
    'emoji_count',
    'lowercase_ratio',
    'has_apostrophe',
    'line_count',
  ]);
  const result: Record<string, number | boolean> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (!allowed.has(key)) continue;
    if (typeof raw === 'number' && Number.isFinite(raw)) result[key] = Math.max(0, Math.min(raw, 128));
    else if (typeof raw === 'boolean') result[key] = raw;
  }
  return result;
}

function cleanProps(value: unknown): Record<string, string | number | boolean | null> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const result: Record<string, string | number | boolean | null> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>).slice(0, 20)) {
    const safeKey = key.toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 48);
    if (!safeKey) continue;
    if (typeof raw === 'string') result[safeKey] = raw.slice(0, 128);
    else if (typeof raw === 'number' && Number.isFinite(raw)) result[safeKey] = raw;
    else if (typeof raw === 'boolean' || raw === null) result[safeKey] = raw;
  }
  return result;
}

function isMissingRelation(error: { code?: string; message?: string } | null | undefined) {
  return Boolean(error && (error.code === '42P01' || /relation .* does not exist|schema cache/i.test(error.message || '')));
}

export async function POST(request: NextRequest) {
  try {
    const input = await request.json().catch(() => null) as Record<string, unknown> | null;
    if (!input) return NextResponse.json({ ok: false }, { status: 400 });

    const event = cleanString(input.event, 32);
    const generationId = cleanString(input.generationId, 128);
    const replyId = cleanString(input.replyId, 128) || generationId;
    const tone = cleanString(input.tone, 32);
    const context = cleanString(input.context, 64);
    const outcome = cleanString(input.outcome, 32);

    if (!event || !EVENTS.has(event) || !generationId || !replyId) {
      return NextResponse.json({ ok: false, error: 'Invalid reply learning event' }, { status: 400 });
    }
    if (outcome && !OUTCOMES.has(outcome)) {
      return NextResponse.json({ ok: false, error: 'Invalid outcome' }, { status: 400 });
    }

    const requestAnalytics = buildRequestAnalytics(request, input.analytics, event, {
      generation_id: generationId,
      reply_id: replyId,
      tone: tone || null,
      context: context || null,
      outcome: outcome || null,
    });
    const serverSupabase = await createServerClient();
    const { data: { user } } = await serverSupabase.auth.getUser();
    const db = getSupabaseAdmin();
    if (!db) return NextResponse.json({ ok: false, stored: false }, { status: 200 });

    const styleSignals = cleanSignals(input.styleSignals);
    const metadata = {
      ...requestAnalytics.metadata,
      props: {
        ...(requestAnalytics.metadata.props || {}),
        ...cleanProps(input.props),
      },
    };

    const { error } = await db.from('reply_outcomes').insert({
      user_id: user?.id || null,
      visitor_id: requestAnalytics.metadata.visitor_id || null,
      session_id: requestAnalytics.metadata.session_id || null,
      generation_id: generationId,
      reply_id: replyId,
      event_type: event,
      tone: tone || null,
      context: context || null,
      outcome: outcome || null,
      style_signals: styleSignals,
      metadata,
    });

    if (error && isMissingRelation(error)) {
      // Keep the event observable before the additive migration is applied.
      await db.from('usage_logs').insert({
        user_id: user?.id || null,
        ip_address: requestAnalytics.identity.ip,
        user_agent: requestAnalytics.identity.userAgent,
        fingerprint: requestAnalytics.identity.fingerprint,
        action: `reply_${event}`,
        metadata,
      });
    } else if (error) {
      console.error('Reply learning insert error:', error.message);
    }

    return NextResponse.json({ ok: !error || isMissingRelation(error), stored: !error });
  } catch (error) {
    console.error('Reply learning error:', error);
    return NextResponse.json({ ok: false, stored: false }, { status: 200 });
  }
}
