'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Crown, Loader2, X } from 'lucide-react';
import { track } from '@/lib/analytics';
import { formatTimeUntil } from '@/lib/usage-limits';
import { ANNUAL_MONTHLY_EQUIVALENT_DISPLAY, ANNUAL_SAVINGS_PERCENT, PLAN_PRICES } from '@/lib/pricing';

export type UpgradePlan = 'annual' | 'monthly';
export type UpgradeTrigger = 'free_limit' | 'deep_analysis';

const BENEFITS = [
  'Unlimited Coach replies, any time',
  'Deep Analysis: 6 options scored, best one picked',
  'Replies that learn how you text',
];

/**
 * The upgrade prompt, as a sheet over Coach rather than a page that replaces
 * it: the person keeps their conversation and their unsent message in view,
 * which is the moment they most want the answer.
 */
export function UpgradeSheet({ open, trigger = 'free_limit', initialPlan = 'annual', usageLimit, nextFreeAt, signedIn, onCheckout, onClose }: {
  open: boolean;
  /** Preselected plan, e.g. the one they chose before signing up. */
  initialPlan?: UpgradePlan;
  trigger?: UpgradeTrigger;
  usageLimit: number;
  nextFreeAt: string | null;
  signedIn: boolean;
  onCheckout: (plan: UpgradePlan) => Promise<void> | void;
  onClose: () => void;
}) {
  const [plan, setPlan] = useState<UpgradePlan>('annual');
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const primaryRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    setPlan(initialPlan);
    track('paywall_viewed', { trigger, signed_in: signedIn, has_reset_time: Boolean(nextFreeAt) });
    const previousFocus = document.activeElement as HTMLElement | null;
    primaryRef.current?.focus();
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') dismiss('escape'); };
    window.addEventListener('keydown', onKey);
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.clearInterval(timer);
      previousFocus?.focus?.();
    };
    // Re-run only when the sheet opens; tracking a view per open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open || typeof document === 'undefined') return null;

  function dismiss(how: 'button' | 'backdrop' | 'escape') {
    track('paywall_dismissed', { trigger, how });
    onClose();
  }

  const wait = formatTimeUntil(nextFreeAt, now);
  const headline = trigger === 'deep_analysis' ? 'Deep Analysis is a Pro feature' : `You've used your ${usageLimit} free replies`;
  const subline = trigger === 'deep_analysis'
    ? 'Coach writes 6 options, scores each one and picks the reply most likely to land.'
    : 'Your message is saved. Go Pro and Coach answers it right now.';

  const choose = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await onCheckout(plan);
    } finally {
      setBusy(false);
    }
  };

  const tile = (value: UpgradePlan, title: string, price: string, detail: string, badge?: string) => {
    const selected = plan === value;
    return (
      <button
        type="button"
        role="radio"
        aria-checked={selected}
        onClick={() => setPlan(value)}
        className={`relative flex-1 rounded-2xl border p-3.5 text-left transition-colors ${selected ? 'border-brand bg-brand/10' : 'border-line bg-white/[0.03] hover:bg-white/[0.06]'}`}
      >
        {badge && <span className="absolute -top-2.5 left-3 rounded-full bg-brand px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-brand-ink">{badge}</span>}
        <span className="flex items-center justify-between gap-2">
          <span className="text-sm font-bold text-cream">{title}</span>
          <span className={`flex h-4 w-4 items-center justify-center rounded-full border ${selected ? 'border-brand bg-brand' : 'border-line'}`}>
            {selected && <Check className="h-3 w-3 text-brand-ink" strokeWidth={3} />}
          </span>
        </span>
        <span className="mt-1 block text-lg font-black text-cream">{price}</span>
        <span className="block text-[11px] font-semibold text-sage">{detail}</span>
      </button>
    );
  };

  return createPortal(
    <div className="fixed inset-0 z-[150] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-labelledby="upgrade-title">
      <button type="button" aria-label="Close" onClick={() => dismiss('backdrop')} className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200" />
      <div className="relative w-full max-w-md rounded-t-3xl border border-line bg-panel px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 shadow-2xl shadow-black/60 animate-in slide-in-from-bottom-8 duration-300 sm:rounded-3xl sm:pb-6">
        <button type="button" onClick={() => dismiss('button')} aria-label="Not now" className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full text-sage hover:bg-white/5 hover:text-cream">
          <X className="h-5 w-5" />
        </button>

        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand">
          <Crown className="h-5 w-5 text-brand-ink" />
        </div>
        <h2 id="upgrade-title" className="mt-3 pr-10 text-xl font-black leading-tight text-cream">{headline}</h2>
        <p className="mt-1 text-sm text-sage">{subline}</p>

        <ul className="mt-4 space-y-2">
          {BENEFITS.map(benefit => (
            <li key={benefit} className="flex items-start gap-2 text-sm text-cream/90">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" /> {benefit}
            </li>
          ))}
        </ul>

        <div className="mt-5 flex gap-2.5" role="radiogroup" aria-label="Choose a plan">
          {tile('annual', 'Annual', `${ANNUAL_MONTHLY_EQUIVALENT_DISPLAY}/mo`, `${PLAN_PRICES.annual.displayAmount} billed yearly`, `Save ${ANNUAL_SAVINGS_PERCENT}%`)}
          {tile('monthly', 'Monthly', `${PLAN_PRICES.monthly.displayAmount}/mo`, 'Billed monthly')}
        </div>

        <button
          ref={primaryRef}
          type="button"
          onClick={choose}
          disabled={busy}
          className="mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-brand text-base font-black text-brand-ink transition-colors hover:bg-brand-soft disabled:opacity-70"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {signedIn ? `Continue with ${plan === 'annual' ? 'Annual' : 'Monthly'}` : 'Create account and continue'}
        </button>
        <p className="mt-2 text-center text-[11px] text-sage/80">Cancel anytime · Secure checkout with Stripe</p>

        {trigger === 'free_limit' && (
          <p className="mt-3 border-t border-line pt-3 text-center text-xs text-sage">
            {wait ? <>Not ready? Your next free reply is back in <strong className="text-cream">{wait}</strong>.</> : 'Not ready? Free replies come back 24 hours after each use.'}
          </p>
        )}
      </div>
    </div>,
    document.body,
  );
}
