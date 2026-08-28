import {
  isPageViewAction,
  isProductSuccessAction,
  normalizeEventName,
} from '@/lib/analytics-events';
import {
  getCanonicalFunnel,
  isInternalTraffic,
  personKey,
  sourceOf,
  type FunnelUsageRow,
} from '@/lib/admin-funnel';
import { isAdminEmail } from '@/lib/isAdmin';

const DAY = 86_400_000;
const SUCCESS_EVENTS = new Set([
  'reply_success',
  'decode',
  'generate_opener',
  'generate_revive',
  'strategy_chat',
]);
const TRACKING_ERROR_EVENTS = new Set([
  'reply_error',
  'screenshot_error',
  'checkout_error',
]);
const PLATFORM_NAMES = new Set(['tiktok', 'youtube', 'instagram', 'facebook', 'reddit', 'x', 'snapchat']);

export const LEAD_STATUSES = ['new', 'replied', 'clicked', 'tried', 'signed_up', 'paid', 'closed'] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export type GrowthMetricRow = {
  id: string;
  video_id: string;
  platform: string;
  metric_date: string;
  views: number;
  profile_visits: number;
  bio_clicks: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  notes: string | null;
};

export type GrowthCreativeRow = {
  videoId: string;
  platform: string;
  title: string | null;
  hook: string | null;
  avatar: string | null;
  cta: string | null;
  status: string;
  views: number | null;
  profileVisits: number | null;
  bioClicks: number | null;
  siteVisits: number;
  replies: number;
  signups: number;
  paidConversions: number;
  paidPerThousandViews: number | null;
  metricsImported: boolean;
  lastMetricDate: string | null;
  notes: string | null;
};

export type GrowthLeadRow = {
  id: string;
  person_key: string | null;
  platform: string;
  handle: string | null;
  source_video_id: string | null;
  status: LeadStatus;
  comment_text: string | null;
  notes: string | null;
  last_contacted_at: string | null;
  created_at: string;
  updated_at: string;
};

type Metadata = {
  page?: string;
  referrer?: string;
  visitor_id?: string;
  session_id?: string;
  event?: string;
  internal?: boolean;
  utm?: Record<string, unknown>;
  props?: Record<string, unknown>;
  [key: string]: unknown;
};

type ProfileRow = { id: string; email?: string | null; created_at: string };
type SubscriptionRow = {
  user_id: string | null;
  plan_type?: string | null;
  status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  canceled_at?: string | null;
};
type CreativeRegistryRow = {
  video_id: string;
  title?: string | null;
  hook?: string | null;
  avatar?: string | null;
  cta?: string | null;
  format?: string | null;
  status?: string | null;
  notes?: string | null;
};

function metadataOf(log: FunnelUsageRow): Metadata {
  return log.metadata && typeof log.metadata === 'object' ? (log.metadata as Metadata) : {};
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function numberValue(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, Math.round(value));
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) {
    return Math.max(0, Math.round(Number(value)));
  }
  return 0;
}

function eventOf(log: FunnelUsageRow): string {
  return normalizeEventName(log.action || metadataOf(log).event);
}

function sessionKey(log: FunnelUsageRow): string {
  return stringValue(metadataOf(log).session_id) || personKey(log);
}

function videoIdOf(log: FunnelUsageRow): string | null {
  const metadata = metadataOf(log);
  const utm = metadata.utm || {};
  const props = metadata.props || {};
  return (
    stringValue(utm.video_id) ||
    stringValue(props.video_id) ||
    stringValue(metadata.video_id) ||
    stringValue(metadata.creative_id)
  );
}

function platformOf(log: FunnelUsageRow): string {
  const metadata = metadataOf(log);
  const props = metadata.props || {};
  const explicit = stringValue(props.platform) || stringValue(props.channel);
  if (explicit) return explicit.toLowerCase().replace(/\s+/g, '_');
  const source = sourceOf(log);
  return PLATFORM_NAMES.has(source) ? source : 'unknown';
}

function keyFor(videoId: string, platform: string): string {
  return `${videoId}::${platform}`;
}

function isInternalCreative(videoId: string, notes?: string | null): boolean {
  return videoId.trim().toLowerCase().startsWith('probe-') || Boolean(notes?.includes('next_move_test'));
}

function inWindow(value: string | null | undefined, since: string, until?: string): boolean {
  return Boolean(value && value >= since && (!until || value < until));
}

function percent(numerator: number, denominator: number): number | null {
  if (!denominator) return null;
  return Math.round((numerator / denominator) * 1000) / 10;
}

function isMissingRelation(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  return error.code === '42P01' || /relation .* does not exist|schema cache/i.test(error.message || '');
}

function priceToMrr(planType: string | null | undefined): number {
  if (planType === 'weekly') return 9.99 * 52 / 12;
  if (planType === 'annual') return 99.99 / 12;
  return 29.99;
}

function weekStart(iso: string): string {
  const date = new Date(iso);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
  return date.toISOString().slice(0, 10);
}

function stageAction(stage: string): string {
  const actions: Record<string, string> = {
    profile_visits: 'Make the first frame a recognizable text problem and refresh the profile promise.',
    bio_clicks: 'Put one benefit-led CTA in the bio and pin a “how it works” post.',
    landing_sessions: 'Use one canonical tracked URL and make it the first profile link.',
    composer_starts: 'Move the paste box and primary action above the fold; remove competing choices.',
    reply_successes: 'Check event errors and shorten the path from paste to the first useful reply.',
    signups: 'Let the visitor see the useful reply before asking for an account.',
    paid_users: 'Clarify the paid upgrade moment after the first successful result.',
  };
  return actions[stage] || 'Collect one clean measurement window before changing the funnel.';
}

function buildBottleneckStages(
  socialTotals: { views: number | null; profileVisits: number | null; bioClicks: number | null },
  funnel: any,
) {
  return [
    { key: 'views', label: 'Platform views', count: socialTotals.views, source: 'imported platform metrics' },
    { key: 'profile_visits', label: 'Profile visits', count: socialTotals.profileVisits, source: 'imported platform metrics' },
    { key: 'bio_clicks', label: 'Bio/link clicks', count: socialTotals.bioClicks, source: 'imported platform metrics' },
    { key: 'landing_sessions', label: 'Landing sessions', count: funnel.period.landingSessions, source: 'first-party site events' },
    { key: 'composer_starts', label: 'Composer starts', count: funnel.period.composerStarts, source: 'first-party site events' },
    { key: 'reply_successes', label: 'Reply successes', count: funnel.period.replySuccesses, source: 'first-party site events' },
    { key: 'signups', label: 'Signups', count: funnel.period.signups, source: 'first-party account data' },
    { key: 'paid_users', label: 'New paid users', count: funnel.period.paidSignups, source: 'first-party billing data' },
  ];
}

function detectBottleneck(stages: Array<{ key: string; label: string; count: number | null; source: string }>) {
  let largest: { from: typeof stages[number]; to: typeof stages[number]; conversion: number; drop: number } | null = null;
  let firstMissing: typeof stages[number] | null = null;

  for (let index = 1; index < stages.length; index += 1) {
    const from = stages[index - 1];
    const to = stages[index];
    if (from.count == null || to.count == null) {
      if (!firstMissing) firstMissing = from.count == null ? from : to;
      continue;
    }
    if (from.count <= 0) continue;
    const conversion = Math.round((to.count / from.count) * 1000) / 10;
    const drop = Math.round((100 - conversion) * 10) / 10;
    if (!largest || drop > largest.drop) largest = { from, to, conversion, drop };
  }

  if (largest) {
    return {
      type: 'observed_drop',
      severity: largest.drop >= 80 ? 'critical' : largest.drop >= 50 ? 'high' : 'watch',
      title: `${largest.from.label} → ${largest.to.label} is the largest observed drop`,
      detail: `${largest.conversion}% continued (${largest.drop}% drop).`,
      nextAction: stageAction(largest.to.key),
      from: largest.from.key,
      to: largest.to.key,
      conversion: largest.conversion,
      drop: largest.drop,
    };
  }

  if (firstMissing) {
    return {
      type: 'measurement_gap',
      severity: 'watch',
      title: `Import ${firstMissing.label.toLowerCase()} before scaling`,
      detail: `The next drop cannot be ranked because ${firstMissing.source} is missing.`,
      nextAction: firstMissing.key === 'views' || firstMissing.key === 'profile_visits' || firstMissing.key === 'bio_clicks'
        ? 'Add a dated platform metric snapshot for each post in the Creative panel.'
        : stageAction(firstMissing.key),
      from: null,
      to: firstMissing.key,
      conversion: null,
      drop: null,
    };
  }

  return {
    type: 'no_denominator',
    severity: 'watch',
    title: 'Keep collecting a clean measurement window',
    detail: 'There is not enough traffic in this range to name a conversion bottleneck.',
    nextAction: 'Use one tracked video cohort across platforms and review it at 24h and 72h.',
    from: null,
    to: null,
    conversion: null,
    drop: null,
  };
}

function buildCohorts(
  profiles: ProfileRow[],
  logs: FunnelUsageRow[],
  subscriptions: SubscriptionRow[],
  since: string,
  until: string,
) {
  const cohorts = new Map<string, {
    cohort: string;
    size: number;
    activated24h: number;
    secondSession7d: number;
    upgraded14d: number;
    churnedAfterPayment: number;
  }>();

  for (const profile of profiles.filter(row => inWindow(row.created_at, since, until))) {
    const cohort = weekStart(profile.created_at);
    const row = cohorts.get(cohort) || {
      cohort,
      size: 0,
      activated24h: 0,
      secondSession7d: 0,
      upgraded14d: 0,
      churnedAfterPayment: 0,
    };
    row.size += 1;

    const profileLogs = logs.filter(log => log.user_id === profile.id);
    const createdMs = new Date(profile.created_at).getTime();
    const activated = profileLogs.some(log => {
      const age = new Date(log.created_at).getTime() - createdMs;
      return age >= 0 && age <= DAY && SUCCESS_EVENTS.has(eventOf(log));
    });
    if (activated) row.activated24h += 1;

    const sessions = new Set(
      profileLogs
        .filter(log => {
          const age = new Date(log.created_at).getTime() - createdMs;
          return age >= 0 && age <= 7 * DAY;
        })
        .map(sessionKey),
    );
    if (sessions.size >= 2) row.secondSession7d += 1;

    const userSubscriptions = subscriptions.filter(sub => sub.user_id === profile.id);
    const upgraded = userSubscriptions.some(sub => {
      const createdAt = sub.created_at || sub.updated_at;
      const age = createdAt ? new Date(createdAt).getTime() - createdMs : -1;
      return age >= 0 && age <= 14 * DAY && ['active', 'trialing', 'canceled', 'past_due'].includes(sub.status || '');
    });
    if (upgraded) row.upgraded14d += 1;

    const churned = userSubscriptions.some(sub =>
      sub.status === 'canceled' && Boolean(sub.canceled_at || sub.updated_at),
    );
    if (churned) row.churnedAfterPayment += 1;
    cohorts.set(cohort, row);
  }

  return [...cohorts.values()]
    .sort((a, b) => b.cohort.localeCompare(a.cohort))
    .map(row => ({
      ...row,
      activationRate: percent(row.activated24h, row.size),
      secondSessionRate: percent(row.secondSession7d, row.size),
      upgradeRate: percent(row.upgraded14d, row.size),
      churnRate: percent(row.churnedAfterPayment, row.size),
    }));
}

function buildMeasurementHealth(logs: FunnelUsageRow[], since: string, until: string) {
  const rows = logs.filter(log => inWindow(log.created_at, since, until));
  const anonymous = rows.filter(log => !log.user_id);
  const withVisitorId = anonymous.filter(log => Boolean(stringValue(metadataOf(log).visitor_id))).length;
  const pageViews = rows.filter(log => isPageViewAction(eventOf(log)));
  const missingUtm = pageViews.filter(log => {
    const utm = metadataOf(log).utm || {};
    return !stringValue(utm.utm_source) && !stringValue(utm.src);
  }).length;
  const unknownSource = pageViews.filter(log => sourceOf(log) === 'direct').length;
  const missingSession = rows.filter(log => !stringValue(metadataOf(log).session_id)).length;
  const errors = rows.filter(log => TRACKING_ERROR_EVENTS.has(eventOf(log))).length;
  const lastEvent = rows.reduce<string | null>((latest, log) => !latest || log.created_at > latest ? log.created_at : latest, null);

  return {
    visitorIdCoverage: percent(withVisitorId, anonymous.length),
    visitorIdEvents: withVisitorId,
    anonymousEvents: anonymous.length,
    missingUtmPageViews: missingUtm,
    pageViews: pageViews.length,
    unknownSourcePageViews: unknownSource,
    missingSessionEvents: missingSession,
    trackingErrors: errors,
    lastEventReceived: lastEvent,
    queryTruncated: rows.length >= 100000,
  };
}

function windowRevenue(
  logs: FunnelUsageRow[],
  profiles: ProfileRow[],
  subscriptions: SubscriptionRow[],
  since: string,
  until?: string,
) {
  const windowLogs = logs.filter(log => inWindow(log.created_at, since, until));
  const windowProfiles = profiles.filter(profile => inWindow(profile.created_at, since, until));
  const windowSubs = subscriptions.filter(sub => inWindow(sub.created_at, since, until));
  const visitors = new Set(windowLogs.filter(log => isPageViewAction(eventOf(log))).map(personKey)).size;
  const replies = windowLogs.filter(log => isProductSuccessAction(eventOf(log))).length;
  const paid = windowSubs.filter(sub => ['active', 'trialing', 'canceled', 'past_due', 'unpaid'].includes(sub.status || '')).length;
  return { visitors, replies, signups: windowProfiles.length, paidUsers: paid };
}

export async function getGrowthCommandCenter(
  db: any,
  options: { rangeDays?: number; currentAdminId?: string | null } = {},
) {
  const days = Math.max(1, Math.min(Math.round(options.rangeDays || 30), 90));
  const now = Date.now();
  const since = new Date(now - days * DAY).toISOString();
  const querySince = new Date(now - Math.max(days + 14, 90) * DAY).toISOString();
  const until = new Date(now + 1_000).toISOString();
  const d7 = new Date(now - 7 * DAY).toISOString();
  const d14 = new Date(now - 14 * DAY).toISOString();
  const h24 = new Date(now - DAY).toISOString();

  const [funnel, profilesResult, logsResult, subscriptionsResult, creativesResult, metricsResult, leadsResult] = await Promise.all([
    getCanonicalFunnel(db, {
      rangeDays: days,
      currentAdminId: options.currentAdminId,
    }),
    db.from('profiles').select('id, email, created_at').limit(50000),
    db.from('usage_logs')
      .select('id, user_id, ip_address, fingerprint, user_agent, action, created_at, metadata')
      .gte('created_at', querySince)
      .order('created_at', { ascending: false })
      .limit(100000),
    db.from('subscriptions')
      .select('user_id, plan_type, status, created_at, updated_at, canceled_at')
      .limit(50000),
    db.from('marketing_creatives')
      .select('video_id, title, hook, avatar, cta, format, status, notes')
      .limit(50000),
    db.from('social_creative_metrics')
      .select('id, video_id, platform, metric_date, views, profile_visits, bio_clicks, likes, comments, shares, saves, notes')
      .gte('metric_date', since.slice(0, 10))
      .lte('metric_date', until.slice(0, 10))
      .order('metric_date', { ascending: false })
      .limit(100000),
    db.from('marketing_leads')
      .select('id, person_key, platform, handle, source_video_id, status, comment_text, notes, last_contacted_at, created_at, updated_at')
      .order('updated_at', { ascending: false })
      .limit(200),
  ]);

  if (profilesResult.error) throw new Error(`profiles: ${profilesResult.error.message}`);
  if (logsResult.error) throw new Error(`usage_logs: ${logsResult.error.message}`);
  if (subscriptionsResult.error) throw new Error(`subscriptions: ${subscriptionsResult.error.message}`);
  for (const [name, result] of [['marketing_creatives', creativesResult], ['social_creative_metrics', metricsResult], ['marketing_leads', leadsResult]] as const) {
    if (result.error && !isMissingRelation(result.error)) throw new Error(`${name}: ${result.error.message}`);
  }

  const profiles = (profilesResult.data || []) as ProfileRow[];
  const adminIds = new Set<string>(options.currentAdminId ? [options.currentAdminId] : []);
  for (const profile of profiles) if (isAdminEmail(profile.email)) adminIds.add(profile.id);
  const rawLogs = (logsResult.data || []) as FunnelUsageRow[];
  const logs = rawLogs.filter(log => !isInternalTraffic(log, adminIds));
  const externalProfiles = profiles.filter(profile => !adminIds.has(profile.id));
  const externalProfileIds = new Set(externalProfiles.map(profile => profile.id));
  const subscriptions = (subscriptionsResult.data || []) as SubscriptionRow[];
  const externalSubscriptions = subscriptions.filter(sub => Boolean(sub.user_id && externalProfileIds.has(sub.user_id)));
  const activeSubscriptions = externalSubscriptions.filter(sub => ['active', 'trialing'].includes(sub.status || ''));
  const convertedSubscriptions = externalSubscriptions.filter(sub => ['active', 'trialing', 'canceled', 'past_due', 'unpaid'].includes(sub.status || ''));
  const activePaidIds = new Set(activeSubscriptions.map(sub => sub.user_id).filter((id): id is string => Boolean(id)));
  const convertedPaidIds = new Set(convertedSubscriptions.map(sub => sub.user_id).filter((id): id is string => Boolean(id)));
  const currentMrr = activeSubscriptions.reduce((total, subscription) => total + priceToMrr(subscription.plan_type), 0);

  const externalPeriodLogs = logs.filter(log => inWindow(log.created_at, since, until));
  const socialMetricRows = (metricsResult.data || []) as GrowthMetricRow[];
  const importedMetrics = socialMetricRows.filter(row =>
    row.metric_date >= since.slice(0, 10) && !isInternalCreative(row.video_id, row.notes),
  );
  // Native platform exports are normally cumulative snapshots. Use the newest
  // snapshot per post/platform so a 24h + 72h import is never double-counted.
  const latestMetricByKey = new Map<string, GrowthMetricRow>();
  for (const row of importedMetrics) {
    const key = keyFor(row.video_id, row.platform);
    const current = latestMetricByKey.get(key);
    if (!current || row.metric_date > current.metric_date) latestMetricByKey.set(key, row);
  }
  const latestMetrics = [...latestMetricByKey.values()];
  const socialTotals = latestMetrics.reduce((total, row) => ({
    views: (total.views || 0) + numberValue(row.views),
    profileVisits: (total.profileVisits || 0) + numberValue(row.profile_visits),
    bioClicks: (total.bioClicks || 0) + numberValue(row.bio_clicks),
  }), { views: 0, profileVisits: 0, bioClicks: 0 });
  const socialTotalsWithAvailability = {
    views: importedMetrics.length ? socialTotals.views : null,
    profileVisits: importedMetrics.length ? socialTotals.profileVisits : null,
    bioClicks: importedMetrics.length ? socialTotals.bioClicks : null,
  };

  const registry = new Map<string, CreativeRegistryRow>();
  for (const row of ((creativesResult.data || []) as CreativeRegistryRow[])) {
    if (isInternalCreative(row.video_id, row.notes)) continue;
    registry.set(row.video_id, row);
  }
  const creativeMap = new Map<string, {
    videoId: string;
    platform: string;
    title: string | null;
    hook: string | null;
    avatar: string | null;
    cta: string | null;
    status: string;
    views: number;
    profileVisits: number;
    bioClicks: number;
    metricRows: number;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    lastMetricDate: string | null;
    siteVisitors: Set<string>;
    replies: number;
    attributedUsers: Set<string>;
    notes: string | null;
  }>();
  const getCreative = (videoId: string, platform: string) => {
    const key = keyFor(videoId, platform);
    const existing = creativeMap.get(key);
    if (existing) return existing;
    const meta = registry.get(videoId);
    const created = {
      videoId,
      platform,
      title: meta?.title || null,
      hook: meta?.hook || null,
      avatar: meta?.avatar || null,
      cta: meta?.cta || null,
      status: meta?.status || 'unclassified',
      views: 0,
      profileVisits: 0,
      bioClicks: 0,
      metricRows: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      saves: 0,
      lastMetricDate: null,
      siteVisitors: new Set<string>(),
      replies: 0,
      attributedUsers: new Set<string>(),
      notes: meta?.notes || null,
    };
    creativeMap.set(key, created);
    return created;
  };

  for (const row of latestMetrics) {
    const creative = getCreative(row.video_id, row.platform);
    creative.metricRows += 1;
    creative.views += numberValue(row.views);
    creative.profileVisits += numberValue(row.profile_visits);
    creative.bioClicks += numberValue(row.bio_clicks);
    creative.likes += numberValue(row.likes);
    creative.comments += numberValue(row.comments);
    creative.shares += numberValue(row.shares);
    creative.saves += numberValue(row.saves);
    if (!creative.lastMetricDate || row.metric_date > creative.lastMetricDate) creative.lastMetricDate = row.metric_date;
    if (row.notes && !creative.notes) creative.notes = row.notes;
  }

  for (const log of externalPeriodLogs) {
    const videoId = videoIdOf(log);
    if (!videoId) continue;
    const creative = getCreative(videoId, platformOf(log));
    const event = eventOf(log);
    if (isPageViewAction(event)) creative.siteVisitors.add(personKey(log));
    if (isProductSuccessAction(event)) creative.replies += 1;
    if (log.user_id) creative.attributedUsers.add(log.user_id);
  }

  const periodProfiles = externalProfiles.filter(profile => inWindow(profile.created_at, since, until));
  const periodProfileIds = new Set(periodProfiles.map(profile => profile.id));
  const creativeRows: GrowthCreativeRow[] = [...creativeMap.values()]
    .map(creative => {
      const signups = [...creative.attributedUsers].filter(id => periodProfileIds.has(id)).length;
      const paidConversions = [...creative.attributedUsers].filter(id => convertedPaidIds.has(id)).length;
      return {
        videoId: creative.videoId,
        platform: creative.platform,
        title: creative.title,
        hook: creative.hook,
        avatar: creative.avatar,
        cta: creative.cta,
        status: creative.status,
        views: creative.metricRows ? creative.views : null,
        profileVisits: creative.metricRows ? creative.profileVisits : null,
        bioClicks: creative.metricRows ? creative.bioClicks : null,
        siteVisits: creative.siteVisitors.size,
        replies: creative.replies,
        signups,
        paidConversions,
        paidPerThousandViews: creative.views > 0 ? Math.round((paidConversions / creative.views) * 1000 * 100) / 100 : null,
        metricsImported: creative.metricRows > 0,
        lastMetricDate: creative.lastMetricDate,
        notes: creative.notes,
      };
    })
    .sort((a, b) => {
      if (a.paidPerThousandViews != null || b.paidPerThousandViews != null) {
        return (b.paidPerThousandViews ?? -1) - (a.paidPerThousandViews ?? -1);
      }
      return (b.siteVisits + b.replies) - (a.siteVisits + a.replies);
    });

  const revenue = {
    current: {
      externalVisitors: funnel.period.visitors,
      replySuccesses: funnel.period.replySuccesses,
      signups: funnel.period.signups,
      paidUsers: activePaidIds.size,
      mrr: Math.round(currentMrr * 100) / 100,
    },
    windows: {
      h24: windowRevenue(logs, externalProfiles, externalSubscriptions, h24, until),
      d7: windowRevenue(logs, externalProfiles, externalSubscriptions, d7, until),
      previous7: windowRevenue(logs, externalProfiles, externalSubscriptions, d14, d7),
      d30: windowRevenue(logs, externalProfiles, externalSubscriptions, new Date(now - 30 * DAY).toISOString(), until),
    },
    rates: {
      visitorToReply: percent(funnel.period.replySuccesses, funnel.period.visitors),
      visitorToSignup: percent(funnel.period.signups, funnel.period.visitors),
      signupToPaid: percent(funnel.period.paidSignups, funnel.period.signups),
    },
  };

  const stages = buildBottleneckStages(socialTotalsWithAvailability, funnel);
  const bottleneck = detectBottleneck(stages);
  const measurement = buildMeasurementHealth(logs, since, until);
  const missingTables = [creativesResult, metricsResult, leadsResult]
    .filter(result => result.error && isMissingRelation(result.error)).length;

  return {
    setupRequired: missingTables > 0,
    setupMessage: missingTables > 0 ? 'Run supabase/migrations/005_growth_command_center.sql to enable creative snapshots and lead tracking.' : null,
    range: { days, since, generatedAt: new Date().toISOString() },
    revenue,
    funnel: {
      stages,
      bottleneck,
      bySource: funnel.bySource,
    },
    creatives: creativeRows,
    leads: ((leadsResult.data || []) as GrowthLeadRow[]).map(lead => ({
      ...lead,
      status: LEAD_STATUSES.includes(lead.status) ? lead.status : 'new',
    })),
    cohorts: buildCohorts(externalProfiles, logs, externalSubscriptions, since, until),
    measurement: {
      ...measurement,
      importedMetricRows: importedMetrics.length,
      importedMetricDays: new Set(importedMetrics.map(row => row.metric_date)).size,
      unknownCreativeRows: creativeRows.filter(row => row.status === 'unclassified').length,
      sourceCoverage: externalPeriodLogs.length ? percent(externalPeriodLogs.filter(log => sourceOf(log) !== 'direct').length, externalPeriodLogs.length) : null,
    },
    definitions: {
      paidPerThousandViews: 'Active or trialing users attributed to a video_id divided by imported platform views, multiplied by 1,000.',
      siteVisits: 'Unique first-party visitors with a page event carrying the video_id.',
      attribution: 'A user is attributed when a first-party event carries the video_id before signup; platform identity is not inferred.',
      cohort: 'Signup cohorts grouped by UTC week; activation is a successful product output within 24 hours.',
      leadQueue: 'Manual social comment/DM workflow. Platform DMs are not automatically imported by this app.',
    },
    dataQuality: {
      rawEvents: rawLogs.length,
      externalEvents: logs.length,
      internalExcluded: rawLogs.length - logs.length,
      currentMrr: Math.round(currentMrr * 100) / 100,
      activePaidUsers: activePaidIds.size,
      convertedPaidUsers: convertedPaidIds.size,
      querySince,
    },
  };
}

export function sanitizeMetricPayload(input: Record<string, unknown>) {
  const videoId = stringValue(input.video_id);
  const platform = stringValue(input.platform)?.toLowerCase().replace(/\s+/g, '_');
  const metricDate = stringValue(input.metric_date);
  if (!videoId || !platform || !metricDate || !/^\d{4}-\d{2}-\d{2}$/.test(metricDate)) {
    throw new Error('video_id, platform, and metric_date are required');
  }
  return {
    video_id: videoId.slice(0, 128),
    platform: platform.slice(0, 32),
    metric_date: metricDate,
    views: numberValue(input.views),
    profile_visits: numberValue(input.profile_visits),
    bio_clicks: numberValue(input.bio_clicks),
    likes: numberValue(input.likes),
    comments: numberValue(input.comments),
    shares: numberValue(input.shares),
    saves: numberValue(input.saves),
    notes: stringValue(input.notes)?.slice(0, 1000) || null,
  };
}

export function sanitizeCreativePayload(input: Record<string, unknown>) {
  const videoId = stringValue(input.video_id);
  if (!videoId) throw new Error('video_id is required');
  const clean = (value: unknown, max = 256) => stringValue(value)?.slice(0, max) || null;
  return {
    video_id: videoId.slice(0, 128),
    title: clean(input.title),
    hook: clean(input.hook),
    avatar: clean(input.avatar),
    cta: clean(input.cta),
    format: clean(input.format, 64),
    status: clean(input.status, 32) || 'active',
    notes: clean(input.notes, 1000),
  };
}

export function sanitizeLeadPayload(input: Record<string, unknown>) {
  const platform = stringValue(input.platform)?.toLowerCase().slice(0, 32);
  if (!platform) throw new Error('platform is required');
  const rawStatus = stringValue(input.status) || 'new';
  if (!LEAD_STATUSES.includes(rawStatus as LeadStatus)) throw new Error('invalid lead status');
  const clean = (value: unknown, max = 1000) => stringValue(value)?.slice(0, max) || null;
  return {
    person_key: clean(input.person_key, 256),
    platform,
    handle: clean(input.handle, 128),
    source_video_id: clean(input.source_video_id, 128),
    status: rawStatus as LeadStatus,
    comment_text: clean(input.comment_text, 2000),
    notes: clean(input.notes, 1000),
  };
}
