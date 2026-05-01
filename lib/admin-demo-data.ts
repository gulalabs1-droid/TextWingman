// ── Demo data for Admin Dashboard presentation mode ──────────────────────────
// Activated when NEXT_PUBLIC_ADMIN_DEMO_MODE=true
// NEVER writes to Supabase — pure client-side mock.

type ActivityItem = { action: string; user_id: string | null; email: string | null; created_at: string };

type OverviewData = {
  totalUsers: number;
  signups: { h24: number; d7: number; d30: number };
  generations: { total: number; h24: number; d7: number; d30: number };
  activatedUsers: number;
  paidUsers: number;
  freeUsers: number;
  mrr: number;
  arr: number;
  projectedMrr: number;
  conversionRate: number;
  activationRate: number;
  planBreakdown: Record<string, number>;
  churn: { d7: number; d30: number };
  cancelingCount: number;
  genByDay: Record<string, number>;
  signupsByDay: Record<string, number>;
  signupGrowthPct: number;
  genGrowthPct: number;
  recentActivity: ActivityItem[];
};

// ── Revenue by day (Mon $920 → Sun $980, total $8,500) ──────────────────────
function revenueByDayMap(): Record<string, number> {
  const amounts = [920, 1050, 1180, 1260, 1490, 1620, 980]; // Mon-Sun
  const map: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    map[d.toISOString().split('T')[0]] = amounts[6 - i];
  }
  return map;
}

// ── Generations by day (realistic daily spread summing to ~18,750 / 7d) ──────
function genByDayMap(): Record<string, number> {
  const daily = [2410, 2580, 2720, 2810, 2950, 3120, 2160]; // Mon-Sun
  const map: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    map[d.toISOString().split('T')[0]] = daily[6 - i];
  }
  return map;
}

// ── Signups by day (realistic daily spread summing to ~1,284 / 7d) ──────────
function signupsByDayMap(): Record<string, number> {
  const daily = [162, 174, 186, 192, 210, 225, 135]; // Mon-Sun
  const map: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    map[d.toISOString().split('T')[0]] = daily[6 - i];
  }
  return map;
}

// ── Demo activity feed (20 events, timestamps spread across last 24h) ────────
function demoActivity(): ActivityItem[] {
  const events: { action: string; email: string }[] = [
    { action: 'signup', email: 'tyler.m@gmail.com' },
    { action: 'generate', email: 'jessica.w@icloud.com' },
    { action: 'screenshot_upload', email: 'marcus.j@yahoo.com' },
    { action: 'decode', email: 'aaliyah.k@gmail.com' },
    { action: 'generate', email: 'brandon.c@outlook.com' },
    { action: 'copy_reply', email: 'samantha.r@gmail.com' },
    { action: 'upgrade_monthly', email: 'david.l@gmail.com' },
    { action: 'generate', email: 'emily.n@icloud.com' },
    { action: 'signup', email: 'jason.p@gmail.com' },
    { action: 'screenshot_upload', email: 'olivia.h@yahoo.com' },
    { action: 'upgrade_annual', email: 'michael.b@gmail.com' },
    { action: 'generate', email: 'ashley.d@outlook.com' },
    { action: 'copy_reply', email: 'chris.f@gmail.com' },
    { action: 'redeem_invite', email: 'natalie.g@icloud.com' },
    { action: 'generate', email: 'jordan.s@gmail.com' },
    { action: 'billing_portal', email: 'kayla.t@gmail.com' },
    { action: 'signup', email: 'anthony.v@yahoo.com' },
    { action: 'decode', email: 'brittany.w@outlook.com' },
    { action: 'generate', email: 'derek.z@gmail.com' },
    { action: 'upgrade_monthly', email: 'megan.a@icloud.com' },
  ];

  const now = Date.now();
  return events.map((ev, i) => ({
    action: ev.action,
    user_id: `demo-${i}`,
    email: ev.email,
    created_at: new Date(now - (i * 72 + Math.floor(Math.random() * 30)) * 60 * 1000).toISOString(),
  }));
}

// ── Exported mock data ───────────────────────────────────────────────────────

export const mockRevenueByDay = revenueByDayMap();

export const mockFunnel = [
  { label: 'Signed Up', count: 8420 },
  { label: 'Generated 1+', count: 4980 },
  { label: 'Used 3+ times', count: 2140 },
  { label: 'Hit Paywall', count: 1025 },
  { label: 'Paid', count: 642 },
];

export const mockPlanBreakdown: Record<string, number> = {
  weekly: 210,
  monthly: 312,
  annual: 120,
};

export const mockLatestActivity: ActivityItem[] = demoActivity();

// ── Daily breakdown table (revenue + signups + gens per day, visible) ────────
export function mockDailyBreakdown(): { date: string; day: string; revenue: number; signups: number; generations: number }[] {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const rev = [920, 1050, 1180, 1260, 1490, 1620, 980];
  const sig = [162, 174, 186, 192, 210, 225, 135];
  const gen = [2410, 2580, 2720, 2810, 2950, 3120, 2160];
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000);
    return {
      date: d.toISOString().split('T')[0],
      day: days[i],
      revenue: rev[i],
      signups: sig[i],
      generations: gen[i],
    };
  });
}

// ── Mock billing data for /admin/billing ─────────────────────────────────────
type BillingData = {
  totalSubs: number;
  activeSubs: number;
  canceledSubs: number;
  orphaned: { user_id: string; status: string; stripe_subscription_id: string | null; stripe_customer_id: string | null }[];
  cancelingSubs: { user_id: string; plan_type: string; current_period_end: string; profiles: { email: string } }[];
  upcomingRenewals: { user_id: string; plan_type: string; current_period_end: string; profiles: { email: string } }[];
  mismatches: { id: string; email: string; plan: string }[];
  recentEvents: { id: string; event_type: string; created_at: string; payload: Record<string, unknown> }[];
};

function futureDateStr(daysOut: number): string {
  return new Date(Date.now() + daysOut * 86400000).toISOString();
}

function pastDateStr(daysAgo: number): string {
  return new Date(Date.now() - daysAgo * 86400000).toISOString();
}

export const mockBillingData: BillingData = {
  totalSubs: 642,
  activeSubs: 613,
  canceledSubs: 29,
  orphaned: [],
  cancelingSubs: [
    { user_id: 'demo-c1', plan_type: 'monthly', current_period_end: futureDateStr(4), profiles: { email: 'sarah.k@gmail.com' } },
    { user_id: 'demo-c2', plan_type: 'weekly', current_period_end: futureDateStr(2), profiles: { email: 'james.r@icloud.com' } },
    { user_id: 'demo-c3', plan_type: 'monthly', current_period_end: futureDateStr(8), profiles: { email: 'priya.d@outlook.com' } },
    { user_id: 'demo-c4', plan_type: 'annual', current_period_end: futureDateStr(22), profiles: { email: 'marcus.w@yahoo.com' } },
    { user_id: 'demo-c5', plan_type: 'weekly', current_period_end: futureDateStr(1), profiles: { email: 'tina.c@gmail.com' } },
    { user_id: 'demo-c6', plan_type: 'monthly', current_period_end: futureDateStr(12), profiles: { email: 'alex.m@gmail.com' } },
    { user_id: 'demo-c7', plan_type: 'weekly', current_period_end: futureDateStr(3), profiles: { email: 'devon.j@outlook.com' } },
    { user_id: 'demo-c8', plan_type: 'monthly', current_period_end: futureDateStr(6), profiles: { email: 'layla.h@icloud.com' } },
    { user_id: 'demo-c9', plan_type: 'weekly', current_period_end: futureDateStr(1), profiles: { email: 'kevin.b@gmail.com' } },
    { user_id: 'demo-c10', plan_type: 'annual', current_period_end: futureDateStr(45), profiles: { email: 'nina.s@yahoo.com' } },
    { user_id: 'demo-c11', plan_type: 'monthly', current_period_end: futureDateStr(9), profiles: { email: 'omar.f@gmail.com' } },
  ],
  upcomingRenewals: [
    { user_id: 'demo-r1', plan_type: 'weekly', current_period_end: futureDateStr(1), profiles: { email: 'emma.l@gmail.com' } },
    { user_id: 'demo-r2', plan_type: 'weekly', current_period_end: futureDateStr(1), profiles: { email: 'ryan.t@icloud.com' } },
    { user_id: 'demo-r3', plan_type: 'monthly', current_period_end: futureDateStr(2), profiles: { email: 'chloe.p@outlook.com' } },
    { user_id: 'demo-r4', plan_type: 'weekly', current_period_end: futureDateStr(2), profiles: { email: 'daniel.v@gmail.com' } },
    { user_id: 'demo-r5', plan_type: 'weekly', current_period_end: futureDateStr(3), profiles: { email: 'grace.n@yahoo.com' } },
    { user_id: 'demo-r6', plan_type: 'annual', current_period_end: futureDateStr(5), profiles: { email: 'ethan.w@gmail.com' } },
    { user_id: 'demo-r7', plan_type: 'monthly', current_period_end: futureDateStr(5), profiles: { email: 'mia.z@icloud.com' } },
    { user_id: 'demo-r8', plan_type: 'weekly', current_period_end: futureDateStr(6), profiles: { email: 'noah.g@outlook.com' } },
  ],
  mismatches: [],
  recentEvents: [
    { id: 'evt-1', event_type: 'subscription_created', created_at: pastDateStr(0), payload: { plan: 'monthly', email: 'david.l@gmail.com' } },
    { id: 'evt-2', event_type: 'payment_succeeded', created_at: pastDateStr(0), payload: { amount: 29.99, email: 'david.l@gmail.com' } },
    { id: 'evt-3', event_type: 'subscription_created', created_at: pastDateStr(0), payload: { plan: 'annual', email: 'michael.b@gmail.com' } },
    { id: 'evt-4', event_type: 'payment_succeeded', created_at: pastDateStr(0), payload: { amount: 99.99, email: 'michael.b@gmail.com' } },
    { id: 'evt-5', event_type: 'subscription_canceled', created_at: pastDateStr(1), payload: { plan: 'weekly', email: 'sarah.k@gmail.com' } },
    { id: 'evt-6', event_type: 'payment_succeeded', created_at: pastDateStr(1), payload: { amount: 9.99, email: 'emma.l@gmail.com' } },
    { id: 'evt-7', event_type: 'subscription_created', created_at: pastDateStr(1), payload: { plan: 'weekly', email: 'megan.a@icloud.com' } },
    { id: 'evt-8', event_type: 'payment_failed', created_at: pastDateStr(2), payload: { amount: 29.99, email: 'james.r@icloud.com' } },
    { id: 'evt-9', event_type: 'subscription_updated', created_at: pastDateStr(2), payload: { from: 'weekly', to: 'monthly', email: 'chloe.p@outlook.com' } },
    { id: 'evt-10', event_type: 'payment_succeeded', created_at: pastDateStr(3), payload: { amount: 9.99, email: 'grace.n@yahoo.com' } },
    { id: 'evt-11', event_type: 'grant_entitlement', created_at: pastDateStr(4), payload: { tier: 'pro', email: 'natalie.g@icloud.com' } },
    { id: 'evt-12', event_type: 'subscription_created', created_at: pastDateStr(5), payload: { plan: 'monthly', email: 'jordan.s@gmail.com' } },
  ],
};

export const mockAdminOverview: OverviewData = {
  totalUsers: 8420,
  signups: { h24: 192, d7: 1284, d30: 4620 },
  generations: { total: 142800, h24: 2810, d7: 18750, d30: 68400 },
  activatedUsers: 4980,
  paidUsers: 642,
  freeUsers: 7778,
  mrr: 36420,
  arr: 437040,
  projectedMrr: 39200,
  conversionRate: 7.6,
  activationRate: 59.1,
  planBreakdown: mockPlanBreakdown,
  churn: { d7: 18, d30: 52 },
  cancelingCount: 11,
  genByDay: genByDayMap(),
  signupsByDay: signupsByDayMap(),
  signupGrowthPct: 14,
  genGrowthPct: 22,
  recentActivity: mockLatestActivity,
};
