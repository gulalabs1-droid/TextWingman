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
