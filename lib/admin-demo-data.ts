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

// ── Detailed daily P&L breakdown ─────────────────────────────────────────────
export type DailyRow = {
  date: string;
  day: string;
  revenue: number;
  weeklyRev: number;
  monthlyRev: number;
  annualRev: number;
  apiCost: number;
  infraCost: number;
  totalCost: number;
  netProfit: number;
  margin: number;
  signups: number;
  generations: number;
  activations: number;
  newPaid: number;
  churned: number;
  activePaid: number;
};

export function mockDailyBreakdown(): DailyRow[] {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  // Revenue split by plan (weekly ~45%, monthly ~38%, annual ~17%)
  const weeklyRev  = [414, 473, 531, 567, 671, 729, 441];
  const monthlyRev = [350, 399, 448, 479, 566, 616, 372];
  const annualRev  = [156, 178, 201, 214, 253, 275, 167];
  const sig = [162, 174, 186, 192, 210, 225, 135];
  const gen = [2410, 2580, 2720, 2810, 2950, 3120, 2160];
  const act = [96, 103, 111, 115, 126, 135, 81];     // ~59% of signups
  const newP = [14, 16, 18, 19, 22, 24, 15];          // new paid conversions
  const churn = [2, 3, 2, 4, 3, 2, 2];                // daily churn
  // Costs: API ~$0.012/gen, infra flat ~$42/day
  const infraPerDay = 42;

  let runningPaid = 613; // starting active paid count

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000);
    const rev = weeklyRev[i] + monthlyRev[i] + annualRev[i];
    const apiCost = Math.round(gen[i] * 0.012 * 100) / 100;
    const totalCost = Math.round((apiCost + infraPerDay) * 100) / 100;
    const netProfit = Math.round((rev - totalCost) * 100) / 100;
    const margin = Math.round((netProfit / rev) * 1000) / 10;
    runningPaid = runningPaid + newP[i] - churn[i];
    return {
      date: d.toISOString().split('T')[0],
      day: days[i],
      revenue: rev,
      weeklyRev: weeklyRev[i],
      monthlyRev: monthlyRev[i],
      annualRev: annualRev[i],
      apiCost,
      infraCost: infraPerDay,
      totalCost,
      netProfit,
      margin,
      signups: sig[i],
      generations: gen[i],
      activations: act[i],
      newPaid: newP[i],
      churned: churn[i],
      activePaid: runningPaid,
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

// ── Mock users for /admin/users ──────────────────────────────────────────────
type UserRow = {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  plan: string;
  plan_source: string;
  replies_7d: number;
  replies_30d: number;
  replies_lifetime: number;
  last_reply_at: string | null;
  subscription_status: string | null;
  beta_group: string | null;
};

function genUsers(): UserRow[] {
  const names: { first: string; last: string; email: string; plan: string; source: string; status: string | null }[] = [
    { first: 'Tyler', last: 'Mitchell', email: 'tyler.m@gmail.com', plan: 'pro', source: 'stripe', status: 'active' },
    { first: 'Jessica', last: 'Wong', email: 'jessica.w@icloud.com', plan: 'pro', source: 'stripe', status: 'active' },
    { first: 'Marcus', last: 'Johnson', email: 'marcus.j@yahoo.com', plan: 'elite', source: 'stripe', status: 'active' },
    { first: 'Aaliyah', last: 'Khan', email: 'aaliyah.k@gmail.com', plan: 'pro', source: 'stripe', status: 'active' },
    { first: 'Brandon', last: 'Chen', email: 'brandon.c@outlook.com', plan: 'free', source: 'none', status: null },
    { first: 'Samantha', last: 'Rivera', email: 'samantha.r@gmail.com', plan: 'pro', source: 'stripe', status: 'active' },
    { first: 'David', last: 'Lopez', email: 'david.l@gmail.com', plan: 'pro', source: 'stripe', status: 'active' },
    { first: 'Emily', last: 'Nguyen', email: 'emily.n@icloud.com', plan: 'free', source: 'none', status: null },
    { first: 'Jason', last: 'Park', email: 'jason.p@gmail.com', plan: 'free', source: 'none', status: null },
    { first: 'Olivia', last: 'Harris', email: 'olivia.h@yahoo.com', plan: 'pro', source: 'stripe', status: 'active' },
    { first: 'Michael', last: 'Brown', email: 'michael.b@gmail.com', plan: 'elite', source: 'stripe', status: 'active' },
    { first: 'Ashley', last: 'Davis', email: 'ashley.d@outlook.com', plan: 'free', source: 'none', status: null },
    { first: 'Chris', last: 'Foster', email: 'chris.f@gmail.com', plan: 'pro', source: 'stripe', status: 'active' },
    { first: 'Natalie', last: 'Garcia', email: 'natalie.g@icloud.com', plan: 'pro', source: 'invite', status: 'active' },
    { first: 'Jordan', last: 'Smith', email: 'jordan.s@gmail.com', plan: 'pro', source: 'stripe', status: 'active' },
    { first: 'Kayla', last: 'Taylor', email: 'kayla.t@gmail.com', plan: 'pro', source: 'stripe', status: 'active' },
    { first: 'Anthony', last: 'Vargas', email: 'anthony.v@yahoo.com', plan: 'free', source: 'none', status: null },
    { first: 'Brittany', last: 'Williams', email: 'brittany.w@outlook.com', plan: 'free', source: 'none', status: null },
    { first: 'Derek', last: 'Zhang', email: 'derek.z@gmail.com', plan: 'pro', source: 'stripe', status: 'active' },
    { first: 'Megan', last: 'Anderson', email: 'megan.a@icloud.com', plan: 'pro', source: 'stripe', status: 'active' },
    { first: 'Sarah', last: 'Kim', email: 'sarah.k@gmail.com', plan: 'pro', source: 'stripe', status: 'canceling' },
    { first: 'James', last: 'Robinson', email: 'james.r@icloud.com', plan: 'pro', source: 'stripe', status: 'canceling' },
    { first: 'Priya', last: 'Desai', email: 'priya.d@outlook.com', plan: 'pro', source: 'stripe', status: 'active' },
    { first: 'Emma', last: 'Lee', email: 'emma.l@gmail.com', plan: 'pro', source: 'stripe', status: 'active' },
    { first: 'Ryan', last: 'Thomas', email: 'ryan.t@icloud.com', plan: 'pro', source: 'stripe', status: 'active' },
    { first: 'Chloe', last: 'Patel', email: 'chloe.p@outlook.com', plan: 'pro', source: 'stripe', status: 'active' },
    { first: 'Daniel', last: 'Vega', email: 'daniel.v@gmail.com', plan: 'pro', source: 'stripe', status: 'active' },
    { first: 'Grace', last: 'Nelson', email: 'grace.n@yahoo.com', plan: 'pro', source: 'stripe', status: 'active' },
    { first: 'Ethan', last: 'White', email: 'ethan.w@gmail.com', plan: 'elite', source: 'stripe', status: 'active' },
    { first: 'Mia', last: 'Zhou', email: 'mia.z@icloud.com', plan: 'pro', source: 'stripe', status: 'active' },
    { first: 'Noah', last: 'Gutierrez', email: 'noah.g@outlook.com', plan: 'free', source: 'none', status: null },
    { first: 'Sophia', last: 'Martinez', email: 'sophia.m@gmail.com', plan: 'free', source: 'none', status: null },
    { first: 'Liam', last: 'Clark', email: 'liam.c@icloud.com', plan: 'pro', source: 'stripe', status: 'active' },
    { first: 'Ava', last: 'Ramirez', email: 'ava.r@gmail.com', plan: 'free', source: 'none', status: null },
    { first: 'Logan', last: 'Scott', email: 'logan.s@yahoo.com', plan: 'free', source: 'none', status: null },
    { first: 'Isabella', last: 'Flores', email: 'isabella.f@outlook.com', plan: 'pro', source: 'stripe', status: 'active' },
    { first: 'Mason', last: 'Adams', email: 'mason.a@gmail.com', plan: 'free', source: 'none', status: null },
    { first: 'Harper', last: 'Morales', email: 'harper.m@icloud.com', plan: 'pro', source: 'stripe', status: 'active' },
    { first: 'Lucas', last: 'Rivera', email: 'lucas.r@gmail.com', plan: 'free', source: 'none', status: null },
    { first: 'Ella', last: 'Hall', email: 'ella.h@yahoo.com', plan: 'free', source: 'none', status: null },
    { first: 'Alexander', last: 'Young', email: 'alex.y@gmail.com', plan: 'pro', source: 'stripe', status: 'active' },
    { first: 'Aria', last: 'King', email: 'aria.k@outlook.com', plan: 'free', source: 'none', status: null },
    { first: 'Benjamin', last: 'Wright', email: 'ben.w@gmail.com', plan: 'pro', source: 'stripe', status: 'active' },
    { first: 'Luna', last: 'Torres', email: 'luna.t@icloud.com', plan: 'free', source: 'none', status: null },
    { first: 'Jack', last: 'Hill', email: 'jack.h@gmail.com', plan: 'pro', source: 'stripe', status: 'active' },
    { first: 'Zoe', last: 'Green', email: 'zoe.g@yahoo.com', plan: 'free', source: 'none', status: null },
    { first: 'Owen', last: 'Baker', email: 'owen.b@outlook.com', plan: 'free', source: 'none', status: null },
    { first: 'Riley', last: 'Perez', email: 'riley.p@gmail.com', plan: 'pro', source: 'stripe', status: 'active' },
    { first: 'Henry', last: 'Murphy', email: 'henry.m@icloud.com', plan: 'free', source: 'none', status: null },
    { first: 'Lily', last: 'Cooper', email: 'lily.c@gmail.com', plan: 'pro', source: 'stripe', status: 'active' },
  ];

  return names.map((n, i) => {
    const daysAgo = Math.floor(Math.random() * 120) + 1;
    const isPaid = n.plan !== 'free';
    const r7 = isPaid ? Math.floor(Math.random() * 35) + 5 : Math.floor(Math.random() * 8);
    const r30 = r7 + Math.floor(Math.random() * 60) + (isPaid ? 15 : 0);
    const rLife = r30 + Math.floor(Math.random() * 200) + (isPaid ? 40 : 0);
    const lastReplyHoursAgo = isPaid ? Math.floor(Math.random() * 48) + 1 : (Math.random() > 0.3 ? Math.floor(Math.random() * 168) + 24 : null);
    return {
      id: `demo-user-${String(i).padStart(3, '0')}`,
      email: n.email,
      full_name: `${n.first} ${n.last}`,
      created_at: new Date(Date.now() - daysAgo * 86400000).toISOString(),
      plan: n.plan,
      plan_source: n.source,
      replies_7d: r7,
      replies_30d: r30,
      replies_lifetime: rLife,
      last_reply_at: lastReplyHoursAgo ? new Date(Date.now() - lastReplyHoursAgo * 3600000).toISOString() : null,
      subscription_status: n.status,
      beta_group: i < 5 ? 'beta-v2' : null,
    };
  });
}

export const mockUsers = genUsers();

// ── Mock funnel data for /admin/funnel ───────────────────────────────────────
export const mockFunnelData = {
  totalUsers: 8420,
  signups: { d30: 4620 },
  activatedUsers: 4980,
  generations: { d30: 68400 },
  paidUsers: 642,
  freeUsers: 7778,
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
