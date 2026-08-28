import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, getAdminSupabase } from '@/lib/admin';
import { isPageViewAction, isProductAction, isProductSuccessAction, normalizeEventName } from '@/lib/analytics-events';
import { isInternalTraffic, personKey, sourceOf, type FunnelUsageRow } from '@/lib/admin-funnel';
import { isAdminEmail } from '@/lib/isAdmin';

export const dynamic = 'force-dynamic';

type ProfileRow = { id: string; email: string | null; created_at: string };
type Metadata = {
  page?: string;
  referrer?: string;
  visitor_id?: string;
  device?: string;
  os?: string;
  browser?: string;
  country?: string;
  city?: string;
  region?: string;
  user_agent?: string;
  utm?: Record<string, unknown>;
};
type PersonRow = {
  person_key: string;
  is_registered: boolean;
  user_id: string | null;
  email: string | null;
  channel: string;
  activated: boolean;
  first_seen: string;
  last_seen: string;
  events: number;
  page_views: number;
  product_actions: number;
  replies: number;
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
  total_replies: number;
  total_page_views: number;
};

const RANGE_DAYS: Record<string, number | null> = { '7': 7, '30': 30, '90': 90, all: null };

function metadataOf(log: FunnelUsageRow): Metadata {
  return log.metadata && typeof log.metadata === 'object' ? log.metadata as Metadata : {};
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function utmValue(log: FunnelUsageRow, key: string): string | null {
  const utm = metadataOf(log).utm || {};
  return stringValue(utm[key]);
}

function emptyPerson(log: FunnelUsageRow, profile?: ProfileRow): PersonRow {
  const metadata = metadataOf(log);
  const page = stringValue(metadata.page);
  const source = sourceOf(log);
  return {
    person_key: profile ? `user:${profile.id}` : personKey(log),
    is_registered: Boolean(profile?.id || log.user_id),
    user_id: profile?.id || log.user_id || null,
    email: profile?.email || null,
    channel: source,
    activated: false,
    first_seen: profile?.created_at || log.created_at,
    last_seen: log.created_at || profile?.created_at || new Date().toISOString(),
    events: 0,
    page_views: 0,
    product_actions: 0,
    replies: 0,
    landing_page: page,
    first_referrer: stringValue(metadata.referrer),
    utm_source: utmValue(log, 'utm_source') || utmValue(log, 'src'),
    utm_medium: utmValue(log, 'utm_medium'),
    utm_campaign: utmValue(log, 'utm_campaign'),
    utm_platform: utmValue(log, 'platform'),
    video_id: utmValue(log, 'video_id'),
    device: stringValue(metadata.device),
    os: stringValue(metadata.os),
    browser: stringValue(metadata.browser),
    country: stringValue(metadata.country),
    city: stringValue(metadata.city),
    region: stringValue(metadata.region),
    last_ip: log.ip_address || null,
    user_agent: log.user_agent || null,
  };
}

function addLog(person: PersonRow, log: FunnelUsageRow) {
  const metadata = metadataOf(log);
  const event = normalizeEventName(log.action);
  person.first_seen = log.created_at < person.first_seen ? log.created_at : person.first_seen;
  person.last_seen = log.created_at > person.last_seen ? log.created_at : person.last_seen;
  person.events += 1;
  if (isPageViewAction(event)) person.page_views += 1;
  if (isProductAction(event)) person.product_actions += 1;
  if (isProductSuccessAction(event)) {
    person.replies += 1;
    person.activated = true;
  }
  if (!person.landing_page && stringValue(metadata.page)) person.landing_page = stringValue(metadata.page);
  if (!person.first_referrer && stringValue(metadata.referrer)) person.first_referrer = stringValue(metadata.referrer);
  person.utm_source ||= utmValue(log, 'utm_source') || utmValue(log, 'src');
  person.utm_medium ||= utmValue(log, 'utm_medium');
  person.utm_campaign ||= utmValue(log, 'utm_campaign');
  person.video_id ||= utmValue(log, 'video_id');
  person.device ||= stringValue(metadata.device);
  person.os ||= stringValue(metadata.os);
  person.browser ||= stringValue(metadata.browser);
  person.country ||= stringValue(metadata.country);
  person.city ||= stringValue(metadata.city);
  person.region ||= stringValue(metadata.region);
  person.last_ip = log.ip_address || person.last_ip;
  person.user_agent ||= log.user_agent || null;
  const incomingSource = sourceOf(log);
  if (person.channel === 'direct' && incomingSource !== 'direct') person.channel = incomingSource;
}

function weekStart(iso: string): string {
  const date = new Date(iso);
  date.setUTCHours(0, 0, 0, 0);
  const mondayOffset = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - mondayOffset);
  return date.toISOString().slice(0, 10);
}

function buildWeeks(people: PersonRow[]): WeekRow[] {
  const map = new Map<string, WeekRow>();
  for (const person of people) {
    const key = weekStart(person.first_seen);
    const row = map.get(key) || { week_start: key, new_people: 0, new_anonymous: 0, new_registered: 0, activated: 0, took_action: 0, total_replies: 0, total_page_views: 0 };
    row.new_people += 1;
    if (person.is_registered) row.new_registered += 1;
    else row.new_anonymous += 1;
    if (person.activated) row.activated += 1;
    if (person.product_actions > 0) row.took_action += 1;
    row.total_replies += person.replies;
    row.total_page_views += person.page_views;
    map.set(key, row);
  }
  return [...map.values()].sort((a, b) => b.week_start.localeCompare(a.week_start)).slice(0, 12);
}

function tally(rows: PersonRow[], key: (person: PersonRow) => string | null) {
  const map = new Map<string, { label: string; count: number; activated: number }>();
  for (const person of rows) {
    const label = key(person) || 'unknown';
    const current = map.get(label) || { label, count: 0, activated: 0 };
    current.count += 1;
    if (person.activated) current.activated += 1;
    map.set(label, current);
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}

export async function GET(request: NextRequest) {
  const { user, isAdmin } = await requireAdmin();
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getAdminSupabase();
  const url = new URL(request.url);
  const range = url.searchParams.get('range') || '30';
  const type = url.searchParams.get('type') || 'all';
  const search = (url.searchParams.get('search') || '').trim().toLowerCase();
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const limit = 100;
  const days = RANGE_DAYS[range] ?? null;
  const selectedSince = days ? new Date(Date.now() - days * 86400_000).toISOString() : null;
  const querySince = new Date(Date.now() - 90 * 86400_000).toISOString();

  const [{ data: profileRows, error: profileError }, { data: rawLogs, error: logError }] = await Promise.all([
    db.from('profiles').select('id, email, created_at').limit(50000),
    db.from('usage_logs')
      .select('id, user_id, ip_address, fingerprint, user_agent, action, created_at, metadata')
      .gte('created_at', querySince)
      .order('created_at', { ascending: false })
      .limit(50000),
  ]);
  if (profileError || logError) return NextResponse.json({ error: profileError?.message || logError?.message || 'Failed to load people' }, { status: 500 });

  const profiles = (profileRows || []) as ProfileRow[];
  const adminIds = new Set<string>(user?.id ? [user.id] : []);
  for (const profile of profiles) if (isAdminEmail(profile.email)) adminIds.add(profile.id);
  const logs = ((rawLogs || []) as FunnelUsageRow[]).filter(log => !isInternalTraffic(log, adminIds));
  const profileMap = new Map(profiles.filter(profile => !adminIds.has(profile.id)).map(profile => [profile.id, profile]));
  const peopleMap = new Map<string, PersonRow>();

  for (const log of logs) {
    const key = personKey(log);
    const profile = log.user_id ? profileMap.get(log.user_id) : undefined;
    const person = peopleMap.get(key) || emptyPerson(log, profile);
    if (profile) {
      person.user_id = profile.id;
      person.email = profile.email;
      person.is_registered = true;
    }
    addLog(person, log);
    peopleMap.set(key, person);
  }
  for (const profile of profileMap.values()) {
    if (selectedSince && profile.created_at < selectedSince) continue;
    const key = `user:${profile.id}`;
    if (!peopleMap.has(key)) peopleMap.set(key, emptyPerson({ user_id: profile.id, created_at: profile.created_at }, profile));
  }

  let people = [...peopleMap.values()].filter(person => !selectedSince || person.last_seen >= selectedSince);
  if (type === 'anon') people = people.filter(person => !person.is_registered);
  if (type === 'registered') people = people.filter(person => person.is_registered);
  if (search) {
    people = people.filter(person => [
      person.email, person.channel, person.country, person.city, person.device, person.os, person.browser,
      person.last_ip, person.landing_page, person.utm_campaign, person.video_id, person.person_key,
    ].filter(Boolean).join(' ').toLowerCase().includes(search));
  }
  people.sort((a, b) => b.last_seen.localeCompare(a.last_seen));

  const weeklyPeople = [...peopleMap.values()];
  const weeks = buildWeeks(weeklyPeople);
  const thisWeek = weeks[0] || null;
  const lastWeek = weeks[1] || null;
  const wowPct = lastWeek && lastWeek.new_people > 0 && thisWeek
    ? Math.round(((thisWeek.new_people - lastWeek.new_people) / lastWeek.new_people) * 100)
    : thisWeek && thisWeek.new_people > 0 ? 100 : 0;

  const totalPeople = people.length;
  const totalAnon = people.filter(person => !person.is_registered).length;
  const totalActivated = people.filter(person => person.activated).length;

  return NextResponse.json({
    kpis: {
      totalPeople,
      totalAnon,
      totalRegistered: totalPeople - totalAnon,
      totalActivated,
      activationRate: totalPeople ? Math.round((totalActivated / totalPeople) * 1000) / 10 : 0,
      newThisWeek: thisWeek?.new_people || 0,
      newLastWeek: lastWeek?.new_people || 0,
      wowPct,
      activatedThisWeek: thisWeek?.activated || 0,
    },
    weeks,
    sources: tally(people, person => person.channel),
    devices: tally(people, person => person.device),
    countries: tally(people, person => person.country),
    landingPages: tally(people, person => person.landing_page),
    people: people.slice((page - 1) * limit, page * limit),
    total: totalPeople,
    page,
    limit,
    range,
    type,
    dataQuality: {
      queriedEvents: rawLogs?.length || 0,
      externalEvents: logs.length,
      internalExcluded: Math.max((rawLogs?.length || 0) - logs.length, 0),
    },
  });
}
