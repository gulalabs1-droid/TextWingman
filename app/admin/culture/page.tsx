import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAdminSupabase, requireAdmin } from '@/lib/admin';
import { getStripeBillingSnapshot } from '@/lib/billing-health';
import { cultureReportStart, publishedCourtCases } from '@/lib/culture-content';
import { readCourtResults } from '@/lib/court-server';

export const dynamic = 'force-dynamic';

function cultureOrigin(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== 'object') return null;
  const item = metadata as { utm?: Record<string, unknown>; props?: Record<string, unknown> };
  const value = item.utm?.culture_origin ?? item.props?.culture_origin;
  return typeof value === 'string' && /^(court(?:_case-\d{2})?|dont_send_[a-z0-9-]+|after_dark_[a-z0-9-]+)$/.test(value) ? value : null;
}

export default async function CultureAdminPage() {
  const { isAdmin } = await requireAdmin();
  if (!isAdmin) redirect('/dashboard');
  const db = getAdminSupabase();
  const cases = publishedCourtCases();
  const since = cultureReportStart();
  const [newBallots, starts, billing, results] = await Promise.all([
    db.from('wingman_court_votes').select('poll_id', { count: 'exact', head: true }).in('poll_id', cases.map(item => item.id)).gte('created_at', since),
    db.from('usage_logs').select('metadata', { count: 'exact' }).eq('action', 'composer_start').gte('created_at', since).order('created_at', { ascending: false }).limit(1000),
    getStripeBillingSnapshot(),
    Promise.all(cases.map(async item => {
      try { return { item, results: await readCourtResults(db, null, item.id) }; }
      catch { return { item, results: null }; }
    })),
  ]);
  const attributedStarts = starts.error ? null : (starts.data ?? []).filter(row => cultureOrigin(row.metadata)).length;
  const startsByCase = new Map<string, number>();
  for (const row of starts.data ?? []) {
    const origin = cultureOrigin(row.metadata);
    if (origin?.startsWith('court_case-')) startsByCase.set(origin, (startsByCase.get(origin) ?? 0) + 1);
  }
  const sampled = !starts.error && (starts.count ?? 0) > (starts.data?.length ?? 0);
  const paid = billing.connected ? billing.paidSubscriptions.filter(item => item.firstPaidAt && item.firstPaidAt >= since && item.cultureOrigin && /^(court|dont_send_|after_dark_)/.test(item.cultureOrigin)).length : null;
  const ranked = results.filter(row => row.results && row.results.total > 0).sort((a, b) => {
    const ar = a.results!; const br = b.results!;
    return Math.abs(ar.counts.A / ar.total - .5) - Math.abs(br.counts.A / br.total - .5) || br.total - ar.total;
  });
  const card = 'rounded-2xl border border-white/10 bg-white/[0.04] p-5';
  return <div className="space-y-6 text-white"><header><p className="text-xs font-bold uppercase tracking-widest text-lime-300">Culture / Last 7 days</p><h1 className="mt-2 text-3xl font-black">What is moving?</h1><p className="mt-2 text-sm text-white/50">Real activity only. This is a rolling seven-day view, not a claim about future performance.</p></header>
    <div className="grid gap-3 md:grid-cols-3"><section className={card}><p className="text-xs text-white/50">New case ballots</p><p className="mt-2 text-3xl font-black">{newBallots.error || newBallots.count === null ? 'Unavailable' : newBallots.count}</p><p className="mt-2 text-xs text-white/40">New browser ballots on the case docket, excluding the original home poll. Changing a vote does not count again.</p></section><section className={card}><p className="text-xs text-white/50">Attributed composer starts</p><p className="mt-2 text-3xl font-black">{attributedStarts === null ? 'Unavailable' : `${attributedStarts}${sampled ? '+' : ''}`}</p><p className="mt-2 text-xs text-white/40">Typing or pasting after a Culture link. Event counts, not unique people; may include tests.{sampled && ' Latest 1,000 events only.'}</p></section><section className={card}><p className="text-xs text-white/50">Attributed first paid subscriptions</p><p className="mt-2 text-3xl font-black">{paid === null ? 'Unverified' : paid}</p><p className="mt-2 text-xs text-white/40">Positive Stripe payment and Culture attribution; trials and untracked conversions are excluded.</p></section></div>
    <section className={card}><h2 className="text-xl font-bold">Court splits</h2><p className="mt-1 text-sm text-white/45">Closest to 50/50 first, based on all-time saved ballots. Starts are attributed events in the last seven days; small samples are not proof of a winning video.</p>{results.some(row => !row.results) && <p className="mt-2 text-sm text-amber-300">Some case totals could not be loaded.</p>}{ranked.length ? <div className="mt-4 space-y-3">{ranked.map(({ item, results: value }) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3 text-sm"><div><p className="font-semibold">{item.setup} {item.message}</p><p className="text-xs text-white/40">{item.id} · {value!.total} {value!.total === 1 ? 'ballot' : 'ballots'} · {starts.error ? 'starts unavailable' : `${startsByCase.get(`court_${item.id}`) ?? 0}${sampled ? '+' : ''} starts`}</p></div><span className="font-mono text-lime-300">A {value!.counts.A} / B {value!.counts.B}</span></div>)}</div> : <p className="mt-4 text-sm text-white/40">No ballots on the new cases yet.</p>}</section>
    <p className="text-sm text-white/45">After Dark submissions and update requests are sent to your business email and handled manually. <Link className="text-lime-300 underline" href="/court">Open the Court</Link></p>
  </div>;
}
