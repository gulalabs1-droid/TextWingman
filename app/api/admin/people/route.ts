import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, getAdminSupabase } from '@/lib/admin';

export const dynamic = 'force-dynamic';

// Unified "people" feed: anonymous visitors AND registered users.
// Backed by the public.admin_people / public.admin_people_weekly SQL views so
// the heavy grouping happens in Postgres, not here.

type PersonRow = {
  person_key: string;
  is_registered: boolean;
  user_id: string | null;
  first_seen: string;
  last_seen: string;
  events: number;
  page_views: number;
  product_actions: number;
  replies: number;
  ips: number;
  landing_page: string | null;
  first_referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_platform: string | null;
  video_id: string | null;
  device: string | null;
  os: string | null;
  browser: string | null;
  country: string | null;
  city: string | null;
  region: string | null;
  last_ip: string | null;
  user_agent: string | null;
};

type WeekRow = {
  week_start: string;
  new_people: number;
  new_anonymous: number;
  new_registered: number;
  activated: number;
  took_action: number;
  total_replies: number | string | null;
  total_page_views: number | string | null;
};

const RANGE_DAYS: Record<string, number | null> = {
  '7': 7,
  '30': 30,
  '90': 90,
  all: null,
};

// Derive a human acquisition channel. Falls back to referrer host, then landing
// page, so social traffic without UTMs still gets attributed instead of
// silently collapsing into "unknown".
function channelOf(p: PersonRow): string {
  const explicit = p.utm_source || p.utm_platform;
  if (explicit) return explicit.toLowerCase();

  const ref = p.first_referrer;
  if (ref) {
    try {
      const host = new URL(ref).hostname.replace(/^www\./, '');
      if (host.includes('tiktok')) return 'tiktok';
      if (host.includes('youtube') || host.includes('youtu.be')) return 'youtube';
      if (host.includes('instagram')) return 'instagram';
      if (host.includes('google')) return 'google';
      if (host.includes('reddit')) return 'reddit';
      if (host) return host;
    } catch {
      // not a parseable URL — ignore
    }
  }

  if (p.landing_page === '/tiktok') return 'tiktok (landing)';
  return 'direct';
}

function tally(rows: PersonRow[], key: (p: PersonRow) => string | null) {
  const map = new Map<string, { label: string; count: number; activated: number }>();
  for (const p of rows) {
    const label = key(p) || 'unknown';
    const cur = map.get(label) || { label, count: 0, activated: 0 };
    cur.count += 1;
    if (p.replies > 0) cur.activated += 1;
    map.set(label, cur);
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}

export async function GET(request: NextRequest) {
  const { isAdmin } = await requireAdmin();
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getAdminSupabase();
  const url = new URL(request.url);
  const range = url.searchParams.get('range') || '30';
  const type = url.searchParams.get('type') || 'all';
  const search = (url.searchParams.get('search') || '').trim();
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
  const limit = 100;

  const days = RANGE_DAYS[range] ?? null;
  const since = days ? new Date(Date.now() - days * 86400_000).toISOString() : null;

  // ── People in range (bounded projection, aggregated below) ──
  let q = db.from('admin_people').select('*').order('first_seen', { ascending: false }).limit(5000);
  if (since) q = q.gte('first_seen', since);
  if (type === 'anon') q = q.eq('is_registered', false);
  if (type === 'registered') q = q.eq('is_registered', true);

  const [{ data: peopleRaw, error: peopleErr }, { data: weeksRaw }] = await Promise.all([
    q,
    db.from('admin_people_weekly').select('*').order('week_start', { ascending: false }).limit(12),
  ]);

  if (peopleErr) {
    return NextResponse.json({ error: peopleErr.message }, { status: 500 });
  }

  let people = (peopleRaw || []) as PersonRow[];

  // Attach emails for registered people
  const userIds = people.map(p => p.user_id).filter((v): v is string => Boolean(v));
  const emailMap = new Map<string, string>();
  if (userIds.length > 0) {
    const { data: profiles } = await db.from('profiles').select('id, email').in('id', userIds);
    (profiles || []).forEach((pr: { id: string; email: string | null }) => {
      if (pr.email) emailMap.set(pr.id, pr.email);
    });
  }

  const enriched = people.map(p => ({
    ...p,
    email: p.user_id ? emailMap.get(p.user_id) || null : null,
    channel: channelOf(p),
    activated: p.replies > 0,
  }));

  // Free-text search across the useful identifying fields
  const filtered = search
    ? enriched.filter(p => {
        const hay = [
          p.email, p.channel, p.country, p.city, p.device, p.os, p.browser,
          p.last_ip, p.landing_page, p.utm_campaign, p.video_id, p.person_key,
        ].filter(Boolean).join(' ').toLowerCase();
        return hay.includes(search.toLowerCase());
      })
    : enriched;

  // ── Breakdowns (computed over the whole filtered range, not just this page) ──
  const sources = tally(filtered, channelOf);
  const devices = tally(filtered, p => p.device);
  const countries = tally(filtered, p => p.country);
  const landingPages = tally(filtered, p => p.landing_page);

  // ── Week-over-week KPIs ──
  const weeks = (weeksRaw || []).map((w: WeekRow) => ({
    week_start: w.week_start,
    new_people: Number(w.new_people) || 0,
    new_anonymous: Number(w.new_anonymous) || 0,
    new_registered: Number(w.new_registered) || 0,
    activated: Number(w.activated) || 0,
    took_action: Number(w.took_action) || 0,
    total_replies: Number(w.total_replies) || 0,
    total_page_views: Number(w.total_page_views) || 0,
  }));

  const thisWeek = weeks[0] || null;
  const lastWeek = weeks[1] || null;
  const wowPct = lastWeek && lastWeek.new_people > 0 && thisWeek
    ? Math.round(((thisWeek.new_people - lastWeek.new_people) / lastWeek.new_people) * 100)
    : thisWeek && thisWeek.new_people > 0 ? 100 : 0;

  const totalPeople = filtered.length;
  const totalAnon = filtered.filter(p => !p.is_registered).length;
  const totalActivated = filtered.filter(p => p.activated).length;

  const paged = filtered.slice((page - 1) * limit, page * limit);

  return NextResponse.json({
    kpis: {
      totalPeople,
      totalAnon,
      totalRegistered: totalPeople - totalAnon,
      totalActivated,
      activationRate: totalPeople > 0 ? Math.round((totalActivated / totalPeople) * 1000) / 10 : 0,
      newThisWeek: thisWeek?.new_people || 0,
      newLastWeek: lastWeek?.new_people || 0,
      wowPct,
      activatedThisWeek: thisWeek?.activated || 0,
    },
    weeks,
    sources,
    devices,
    countries,
    landingPages,
    people: paged,
    total: totalPeople,
    page,
    limit,
    range,
    type,
  });
}
