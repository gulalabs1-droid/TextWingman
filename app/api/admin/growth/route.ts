import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase, logAdminEvent, requireAdmin } from '@/lib/admin';
import {
  getGrowthCommandCenter,
  sanitizeCreativePayload,
  sanitizeLeadPayload,
  sanitizeMetricPayload,
} from '@/lib/growth';

export const dynamic = 'force-dynamic';

function missingMigration(message: string) {
  return /relation .* does not exist|schema cache/i.test(message);
}

async function upsertCreative(db: ReturnType<typeof getAdminSupabase>, creative: ReturnType<typeof sanitizeCreativePayload>) {
  // Metric imports often omit creative metadata; preserve the last known labels.
  const { data: existing, error: readError } = await db
    .from('marketing_creatives')
    .select('video_id, title, hook, avatar, cta, format, status, notes')
    .eq('video_id', creative.video_id)
    .maybeSingle();
  if (readError && !missingMigration(readError.message)) throw readError;
  return db
    .from('marketing_creatives')
    .upsert({
      ...creative,
      title: creative.title || existing?.title || null,
      hook: creative.hook || existing?.hook || null,
      avatar: creative.avatar || existing?.avatar || null,
      cta: creative.cta || existing?.cta || null,
      format: creative.format || existing?.format || null,
      status: creative.status || existing?.status || 'active',
      notes: creative.notes || existing?.notes || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'video_id' });
}

export async function GET(request: NextRequest) {
  const { user, isAdmin } = await requireAdmin();
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const requestedDays = Number(new URL(request.url).searchParams.get('days') || 30);
  const days = Number.isFinite(requestedDays) ? Math.min(Math.max(Math.round(requestedDays), 1), 90) : 30;

  try {
    const data = await getGrowthCommandCenter(getAdminSupabase(), {
      rangeDays: days,
      currentAdminId: user?.id,
    });
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load growth data';
    console.error('Admin growth error:', message);
    return NextResponse.json(
      { error: missingMigration(message) ? 'Run the Growth Command Center migration first.' : 'Unable to load growth data' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const { user, isAdmin } = await requireAdmin();
  if (!isAdmin || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });

  const action = typeof body.action === 'string' ? body.action : '';
  const db = getAdminSupabase();

  try {
    if (action === 'save_creative') {
      const creative = sanitizeCreativePayload(body);
      const result = await upsertCreative(db, creative);
      if (result.error) throw result.error;
      await logAdminEvent(user.id, 'marketing_creative_saved', undefined, { video_id: creative.video_id });
      return NextResponse.json({ ok: true, creative: result.data });
    }

    if (action === 'save_metric') {
      const metric = sanitizeMetricPayload(body);
      const creative = sanitizeCreativePayload({ ...body, video_id: metric.video_id });
      const creativeResult = await upsertCreative(db, creative);
      if (creativeResult.error) throw creativeResult.error;
      const { data, error } = await db
        .from('social_creative_metrics')
        .upsert({ ...metric, updated_at: new Date().toISOString() }, { onConflict: 'video_id,platform,metric_date' })
        .select()
        .single();
      if (error) throw error;
      await logAdminEvent(user.id, 'social_creative_metric_saved', undefined, {
        video_id: metric.video_id,
        platform: metric.platform,
        metric_date: metric.metric_date,
      });
      return NextResponse.json({ ok: true, metric: data });
    }

    if (action === 'add_lead') {
      const lead = sanitizeLeadPayload(body);
      const { data, error } = await db
        .from('marketing_leads')
        .insert(lead)
        .select()
        .single();
      if (error) throw error;
      await logAdminEvent(user.id, 'marketing_lead_added', undefined, {
        platform: lead.platform,
        source_video_id: lead.source_video_id,
      });
      return NextResponse.json({ ok: true, lead: data });
    }

    if (action === 'update_lead') {
      const id = typeof body.id === 'string' ? body.id : '';
      const rawStatus = typeof body.status === 'string' ? body.status : '';
      if (!id || !rawStatus) return NextResponse.json({ error: 'id and status are required' }, { status: 400 });
      const lead = sanitizeLeadPayload({ ...body, platform: body.platform || 'unknown', status: rawStatus });
      const update = {
        status: lead.status,
        notes: lead.notes,
        updated_at: new Date().toISOString(),
        ...(lead.status === 'replied' ? { last_contacted_at: new Date().toISOString() } : {}),
      };
      const { data, error } = await db.from('marketing_leads').update(update).eq('id', id).select().single();
      if (error) throw error;
      await logAdminEvent(user.id, 'marketing_lead_status_updated', undefined, { lead_id: id, status: lead.status });
      return NextResponse.json({ ok: true, lead: data });
    }

    if (action === 'delete_lead') {
      const id = typeof body.id === 'string' ? body.id : '';
      if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
      const { error } = await db.from('marketing_leads').delete().eq('id', id);
      if (error) throw error;
      await logAdminEvent(user.id, 'marketing_lead_deleted', undefined, { lead_id: id });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Unknown growth action' }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Growth action failed';
    console.error('Admin growth mutation error:', message);
    return NextResponse.json(
      { error: missingMigration(message) ? 'Run the Growth Command Center migration first.' : message },
      { status: missingMigration(message) ? 503 : 400 },
    );
  }
}
