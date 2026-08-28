import { isAdminEmail } from '@/lib/isAdmin';
import {
  isComposerAction,
  isLandingAction,
  isPageViewAction,
  isProductRequestAction,
  isProductSuccessAction,
  normalizeEventName,
} from '@/lib/analytics-events';

export type FunnelUsageRow = {
  id?: string | null;
  user_id?: string | null;
  ip_address?: string | null;
  fingerprint?: string | null;
  user_agent?: string | null;
  action?: string | null;
  created_at: string;
  metadata?: Record<string, unknown> | null;
};

type ProfileRow = { id: string; email?: string | null; created_at: string };
type SubscriptionRow = { user_id: string | null; status?: string | null };
type Metadata = {
  page?: string;
  referrer?: string;
  visitor_id?: string;
  session_id?: string;
  event?: string;
  internal?: boolean;
  utm?: Record<string, unknown>;
  props?: Record<string, unknown>;
};

const SUCCESS_ACTIONS = ['reply_success', 'reply_generated', 'decode', 'generate_opener', 'generate_revive', 'strategy_chat'];

function metadataOf(log: FunnelUsageRow): Metadata {
  return log.metadata && typeof log.metadata === 'object' ? (log.metadata as Metadata) : {};
}

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function pageOf(log: FunnelUsageRow): string {
  return text(metadataOf(log).page) || '/';
}

function sessionKey(log: FunnelUsageRow): string {
  const metadata = metadataOf(log);
  return text(metadata.session_id) || personKey(log);
}

/** Exclude owner/admin inspection, admin routes, and automated crawlers. */
export function isInternalTraffic(log: FunnelUsageRow, adminUserIds: Set<string>): boolean {
  if (log.user_id && adminUserIds.has(log.user_id)) return true;
  const metadata = metadataOf(log);
  if (metadata.internal === true) return true;
  const utm = metadata.utm || {};
  const props = metadata.props || {};
  const campaign = text(utm.utm_campaign) || text(utm.campaign) || text(props.utm_campaign);
  const videoId = text(utm.video_id) || text(props.video_id);
  // Keep verification probes out of customer and creative-performance reporting.
  if (campaign === 'next_move_test' || videoId?.startsWith('probe-')) return true;
  const page = pageOf(log);
  const referrer = text(metadata.referrer) || '';
  if (page.startsWith('/admin') || /\/admin(?:\/|$)/i.test(referrer)) return true;
  const agent = (log.user_agent || '').toLowerCase();
  return /bot|crawler|spider|headless|lighthouse|pagespeed|facebookexternalhit|slurp/i.test(agent);
}

/** Prefer registered IDs, then the durable first-party visitor ID. */
export function personKey(log: FunnelUsageRow): string {
  if (log.user_id) return `user:${log.user_id}`;
  const visitorId = text(metadataOf(log).visitor_id);
  if (visitorId) return `visitor:${visitorId}`;
  if (log.fingerprint) return `fingerprint:${log.fingerprint}`;
  if (log.ip_address) return `ip:${log.ip_address}`;
  return `event:${log.id || log.created_at}`;
}

export function sourceOf(log: FunnelUsageRow): string {
  const metadata = metadataOf(log);
  const utm = metadata.utm || {};
  const props = metadata.props || {};
  const explicit = text(utm.utm_source) || text(utm.src) || text(props.source) || text(props.platform);
  if (explicit) return explicit.toLowerCase().replace(/\s+/g, '_');

  const referrer = text(metadata.referrer);
  if (referrer) {
    try {
      const host = new URL(referrer).hostname.replace(/^www\./, '').toLowerCase();
      if (host.includes('tiktok')) return 'tiktok';
      if (host.includes('youtube') || host.includes('youtu.be')) return 'youtube';
      if (host.includes('instagram')) return 'instagram';
      if (host.includes('facebook')) return 'facebook';
      if (host.includes('google')) return 'google';
      if (host.includes('reddit')) return 'reddit';
      if (host) return host;
    } catch {
      // Keep the fallback below for malformed referrers.
    }
  }

  if (pageOf(log) === '/tiktok') return 'tiktok';
  return 'direct';
}

function eventOf(log: FunnelUsageRow): string {
  return normalizeEventName(log.action || metadataOf(log).event);
}

function isLandingLog(log: FunnelUsageRow): boolean {
  const event = eventOf(log);
  return isLandingAction(event) || (isPageViewAction(event) && ['/', '/tiktok'].includes(pageOf(log)));
}

function isSignupLog(log: FunnelUsageRow): boolean {
  return eventOf(log) === 'signup_complete';
}

function percent(numerator: number, denominator: number): number | null {
  if (!denominator) return null;
  return Math.round((numerator / denominator) * 1000) / 10;
}

function dateIsWithin(value: string, since: string, until?: string): boolean {
  return value >= since && (!until || value < until);
}

function countByDay(rows: FunnelUsageRow[] | ProfileRow[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const row of rows) {
    const day = row.created_at.slice(0, 10);
    result[day] = (result[day] || 0) + 1;
  }
  return result;
}

function cohortIds(
  profiles: ProfileRow[],
  successLogs: FunnelUsageRow[],
  since: string,
  until?: string,
): Set<string> {
  const result = new Set<string>();
  for (const profile of profiles) {
    if (!dateIsWithin(profile.created_at, since, until)) continue;
    const activated = successLogs.some(log =>
      log.user_id === profile.id && log.created_at >= profile.created_at && isProductSuccessAction(eventOf(log)),
    );
    if (activated) result.add(profile.id);
  }
  return result;
}

function windowSummary(
  profiles: ProfileRow[],
  logs: FunnelUsageRow[],
  successLogs: FunnelUsageRow[],
  paidIds: Set<string>,
  since: string,
  until?: string,
) {
  const windowLogs = logs.filter(log => dateIsWithin(log.created_at, since, until));
  const windowSuccesses = successLogs.filter(log => dateIsWithin(log.created_at, since, until));
  const profileRows = profiles.filter(profile => dateIsWithin(profile.created_at, since, until));
  const pageViews = windowLogs.filter(log => isPageViewAction(eventOf(log)));
  const landingLogs = windowLogs.filter(isLandingLog);
  const composerLogs = windowLogs.filter(log => isComposerAction(eventOf(log)));
  const anonymousLogs = windowLogs.filter(log => !log.user_id);
  const activatedPeople = new Set(windowSuccesses.map(personKey));
  const activatedSignups = cohortIds(profiles, successLogs, since, until);
  const signupIds = new Set(profileRows.map(profile => profile.id));
  const paidSignups = [...signupIds].filter(id => paidIds.has(id)).length;

  return {
    visitors: new Set(pageViews.map(personKey)).size,
    landingSessions: new Set(landingLogs.map(sessionKey)).size,
    composerStarts: new Set(composerLogs.map(sessionKey)).size,
    replyRequests: windowLogs.filter(log => isProductRequestAction(eventOf(log))).length,
    replySuccesses: windowSuccesses.length,
    uniqueReplyPeople: activatedPeople.size,
    copies: windowLogs.filter(log => eventOf(log) === 'reply_copy').length,
    replySends: windowLogs.filter(log => eventOf(log) === 'reply_sent').length,
    signups: profileRows.length,
    activatedSignups: activatedSignups.size,
    paidSignups,
    anonymousVisitors: new Set(pageViews.filter(log => !log.user_id).map(personKey)).size,
    anonymousActivated: new Set(windowSuccesses.filter(log => !log.user_id).map(personKey)).size,
    anonymousEvents: anonymousLogs.length,
  };
}

type SourceBucket = {
  source: string;
  visitors: Set<string>;
  landingSessions: Set<string>;
  composerStarts: Set<string>;
  replySuccesses: number;
  signups: Set<string>;
  paid: Set<string>;
};

function sourceBreakdown(
  profiles: ProfileRow[],
  logs: FunnelUsageRow[],
  successLogs: FunnelUsageRow[],
  paidIds: Set<string>,
  since: string,
  until?: string,
) {
  const buckets = new Map<string, SourceBucket>();
  const getBucket = (source: string) => {
    const existing = buckets.get(source);
    if (existing) return existing;
    const created: SourceBucket = {
      source,
      visitors: new Set(),
      landingSessions: new Set(),
      composerStarts: new Set(),
      replySuccesses: 0,
      signups: new Set(),
      paid: new Set(),
    };
    buckets.set(source, created);
    return created;
  };

  const windowLogs = logs.filter(log => dateIsWithin(log.created_at, since, until));
  const sourceByUser = new Map<string, string>();
  for (const log of windowLogs) {
    const source = sourceOf(log);
    const bucket = getBucket(source);
    const event = eventOf(log);
    if (isPageViewAction(event)) bucket.visitors.add(personKey(log));
    if (isLandingLog(log)) bucket.landingSessions.add(sessionKey(log));
    if (isComposerAction(event)) bucket.composerStarts.add(sessionKey(log));
    if (isProductSuccessAction(event)) bucket.replySuccesses += 1;
    if (log.user_id && !sourceByUser.has(log.user_id)) sourceByUser.set(log.user_id, source);
  }
  for (const log of successLogs.filter(item => dateIsWithin(item.created_at, since, until))) {
    if (log.user_id && !sourceByUser.has(log.user_id)) sourceByUser.set(log.user_id, sourceOf(log));
  }
  for (const profile of profiles.filter(item => dateIsWithin(item.created_at, since, until))) {
    const bucket = getBucket(sourceByUser.get(profile.id) || 'unknown');
    bucket.signups.add(profile.id);
    if (paidIds.has(profile.id)) bucket.paid.add(profile.id);
  }

  return [...buckets.values()]
    .map(bucket => ({
      source: bucket.source,
      visitors: bucket.visitors.size,
      landingSessions: bucket.landingSessions.size,
      composerStarts: bucket.composerStarts.size,
      replySuccesses: bucket.replySuccesses,
      signups: bucket.signups.size,
      paid: bucket.paid.size,
    }))
    .sort((a, b) => (b.visitors + b.signups) - (a.visitors + a.signups));
}

export async function getCanonicalFunnel(
  db: any,
  options: { rangeDays?: number; currentAdminId?: string | null } = {},
) {
  const days = Math.max(1, Math.min(Math.round(options.rangeDays || 30), 90));
  const now = Date.now();
  const rangeSince = new Date(now - days * 86400_000).toISOString();
  const queryDays = Math.max(days, 30);
  const querySince = new Date(now - queryDays * 86400_000).toISOString();
  const h24 = new Date(now - 86400_000).toISOString();
  const d7 = new Date(now - 7 * 86400_000).toISOString();
  const d14 = new Date(now - 14 * 86400_000).toISOString();
  const d30 = new Date(now - 30 * 86400_000).toISOString();

  const [profilesResult, periodLogsResult, successLogsResult, subscriptionsResult] = await Promise.all([
    db.from('profiles').select('id, email, created_at').limit(50000),
    db.from('usage_logs')
      .select('id, user_id, ip_address, fingerprint, user_agent, action, created_at, metadata')
      .gte('created_at', querySince)
      .order('created_at', { ascending: false })
      .limit(50000),
    db.from('usage_logs')
      .select('id, user_id, ip_address, fingerprint, user_agent, action, created_at, metadata')
      .in('action', SUCCESS_ACTIONS)
      .order('created_at', { ascending: false })
      .limit(50000),
    db.from('subscriptions').select('user_id, status').in('status', ['active', 'trialing']).limit(50000),
  ]);

  if (profilesResult.error) throw new Error(`profiles: ${profilesResult.error.message}`);
  if (periodLogsResult.error) throw new Error(`usage_logs: ${periodLogsResult.error.message}`);
  if (successLogsResult.error) throw new Error(`success_logs: ${successLogsResult.error.message}`);

  const profiles = (profilesResult.data || []) as ProfileRow[];
  const adminIds = new Set<string>();
  if (options.currentAdminId) adminIds.add(options.currentAdminId);
  for (const profile of profiles) if (isAdminEmail(profile.email)) adminIds.add(profile.id);

  const rawLogs = (periodLogsResult.data || []) as FunnelUsageRow[];
  const rawSuccessLogs = (successLogsResult.data || []) as FunnelUsageRow[];
  const logs = rawLogs.filter(log => !isInternalTraffic(log, adminIds));
  const successLogs = rawSuccessLogs.filter(log => !isInternalTraffic(log, adminIds));
  const externalProfiles = profiles.filter(profile => !adminIds.has(profile.id));
  const externalProfileIds = new Set(externalProfiles.map(profile => profile.id));
  const paidIds = new Set(
    ((subscriptionsResult.data || []) as SubscriptionRow[])
      .map(subscription => subscription.user_id)
      .filter((id): id is string => typeof id === 'string' && !adminIds.has(id) && externalProfileIds.has(id)),
  );

  const period = windowSummary(externalProfiles, logs, successLogs, paidIds, rangeSince);
  const accountActivatedIds = new Set(
    successLogs
      .map(log => log.user_id)
      .filter((id): id is string => Boolean(id) && externalProfiles.some(profile => profile.id === id)),
  );
  for (const id of paidIds) accountActivatedIds.add(id);

  const account = {
    registered: externalProfiles.length,
    activated: accountActivatedIds.size,
    paid: paidIds.size,
    free: Math.max(externalProfiles.length - paidIds.size, 0),
    activationRate: percent(accountActivatedIds.size, externalProfiles.length),
    paidRate: percent(paidIds.size, externalProfiles.length),
    freeToPaidRate: percent(paidIds.size, Math.max(externalProfiles.length - paidIds.size, 0)),
  };

  const windows = {
    h24: windowSummary(externalProfiles, logs, successLogs, paidIds, h24),
    d7: windowSummary(externalProfiles, logs, successLogs, paidIds, d7),
    d30: windowSummary(externalProfiles, logs, successLogs, paidIds, d30),
    previous7: windowSummary(externalProfiles, logs, successLogs, paidIds, d14, d7),
  };

  const externalPeriodLogs = logs.filter(log => log.created_at >= rangeSince);
  const periodSuccessLogs = successLogs.filter(log => log.created_at >= rangeSince);
  const periodProfiles = externalProfiles.filter(profile => profile.created_at >= rangeSince);
  const periodActivatedIds = cohortIds(externalProfiles, successLogs, rangeSince);
  const periodPaidIds = new Set(periodProfiles.map(profile => profile.id).filter(id => paidIds.has(id)));
  const visitorLogs = externalPeriodLogs.filter(log => isPageViewAction(eventOf(log)));
  const landingLogs = externalPeriodLogs.filter(isLandingLog);
  const composerLogs = externalPeriodLogs.filter(log => isComposerAction(eventOf(log)));

  const dataQuality = {
    queriedEvents: rawLogs.length,
    externalEvents: logs.length,
    internalExcluded: rawLogs.length - logs.length,
    queriedSuccessEvents: rawSuccessLogs.length,
    anonymousEventsWithVisitorId: logs.filter(log => !log.user_id && Boolean(metadataOf(log).visitor_id)).length,
    anonymousEventsWithoutVisitorId: logs.filter(log => !log.user_id && !metadataOf(log).visitor_id).length,
    legacyEvents: logs.filter(log => !metadataOf(log).event).length,
    queryTruncated: rawLogs.length >= 50000 || rawSuccessLogs.length >= 50000,
  };

  const recentActivity = externalPeriodLogs
    .filter(log => isProductRequestAction(eventOf(log)) || isProductSuccessAction(eventOf(log)))
    .slice(0, 50)
    .map(log => ({
      action: eventOf(log),
      user_id: log.user_id || null,
      email: log.user_id ? externalProfiles.find(profile => profile.id === log.user_id)?.email || null : null,
      created_at: log.created_at,
    }));

  return {
    range: { days, since: rangeSince, generatedAt: new Date().toISOString() },
    period: {
      ...period,
      uniqueReplyPeople: new Set(periodSuccessLogs.map(personKey)).size,
      visitors: new Set(visitorLogs.map(personKey)).size,
      landingSessions: new Set(landingLogs.map(sessionKey)).size,
      composerStarts: new Set(composerLogs.map(sessionKey)).size,
      activatedSignups: periodActivatedIds.size,
      paidSignups: periodPaidIds.size,
    },
    account,
    windows,
    outputs: {
      allTime: successLogs.length,
      period: periodSuccessLogs.length,
      byDay: countByDay(periodSuccessLogs),
    },
    signupsByDay: countByDay(periodProfiles),
    bySource: sourceBreakdown(externalProfiles, externalPeriodLogs, periodSuccessLogs, paidIds, rangeSince),
    recentActivity,
    dataQuality,
    definitions: {
      visitor: 'Unique first-party visitor ID, then fingerprint/IP fallback',
      landing: 'Unique session that viewed / or /tiktok, or emitted landing_view',
      composer: 'Unique session that started the composer, selected an example, or began screenshot input',
      replyRequest: 'generate_reply or reply_request event',
      replySuccess: 'reply_success, decode, generate_opener, generate_revive, or strategy_chat event',
      signup: 'Non-admin profile created in the selected period',
      paid: 'Non-admin active or trialing subscription',
    },
  };
}
