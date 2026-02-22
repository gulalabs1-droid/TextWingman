'use client';

import { useState, useEffect } from 'react';
import { BookmarkCheck, Camera, X, ArrowRight, Sparkles } from 'lucide-react';

const TOUR_STEPS = [
  {
    id: 'coach',
    emoji: '✨',
    iconBg: 'from-violet-500 to-fuchsia-500',
    title: 'Just talk to Coach',
    description: 'Type anything, paste a message, or tap a chip. Coach handles replies, decodes, openers, and revives — all in one conversation. No tabs, no modes.',
    tip: 'Try: "Help me reply to this" or "Am I being played?"',
  },
  {
    id: 'screenshot',
    emoji: '📸',
    iconBg: 'from-blue-500 to-cyan-500',
    title: 'Drop a screenshot',
    description: 'Hit the camera button and upload from iMessage, Tinder, WhatsApp, IG — anywhere. Coach reads the full convo and tells you exactly what to say.',
    tip: 'Works with multiple screenshots at once.',
  },
  {
    id: 'memory',
    emoji: '🧠',
    iconBg: 'from-emerald-500 to-teal-500',
    title: 'It remembers everything',
    description: 'Every session auto-saves. Next time you open Coach, Smart Preview shows your last convo at the top — tap once to pick up right where you left off.',
    tip: 'Your full history lives in the History tab.',
  },
];

const STORAGE_KEY = 'tw_feature_tour_v4.2';

export default function FeatureTour() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) {
      const timer = setTimeout(() => setVisible(true), 900);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(STORAGE_KEY, 'true');
  };

  const next = () => {
    if (step < TOUR_STEPS.length - 1) {
      setStep(step + 1);
    } else {
      dismiss();
    }
  };

  if (!visible) return null;

  const current = TOUR_STEPS[step];
  const isLast = step === TOUR_STEPS.length - 1;
  const progress = ((step + 1) / TOUR_STEPS.length) * 100;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] animate-in fade-in duration-300"
        onClick={dismiss}
      />

      {/* Tour Card — dark glass, bottom-anchored */}
      <div className="fixed bottom-0 left-0 right-0 z-[101] flex justify-center px-4 pb-[max(1.5rem,env(safe-area-inset-bottom,1.5rem))]">
        <div className="w-full max-w-lg animate-in fade-in slide-in-from-bottom-6 duration-400">
          {/* Card */}
          <div className="bg-[#0d0d14] border border-white/[0.10] rounded-3xl overflow-hidden shadow-2xl shadow-black/60">
            {/* Progress bar */}
            <div className="h-[2px] bg-white/[0.06]">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="p-5">
              {/* Top row */}
              <div className="flex items-center justify-between mb-4">
                {/* Step dots */}
                <div className="flex items-center gap-1.5">
                  {TOUR_STEPS.map((_, i) => (
                    <div
                      key={i}
                      className={`rounded-full transition-all duration-300 ${
                        i === step
                          ? 'w-4 h-1.5 bg-violet-400'
                          : i < step
                          ? 'w-1.5 h-1.5 bg-white/30'
                          : 'w-1.5 h-1.5 bg-white/10'
                      }`}
                    />
                  ))}
                </div>
                <button
                  onClick={dismiss}
                  className="w-7 h-7 rounded-full bg-white/[0.07] flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/[0.12] transition-all active:scale-90"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Icon + Title */}
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${current.iconBg} flex items-center justify-center text-xl shadow-lg shrink-0`}>
                  {current.emoji}
                </div>
                <h2 className="text-[17px] font-bold text-white leading-tight">{current.title}</h2>
              </div>

              {/* Description */}
              <p className="text-[13px] text-white/55 leading-relaxed mb-3">{current.description}</p>

              {/* Tip pill */}
              <div className="bg-white/[0.04] border border-white/[0.07] rounded-xl px-3 py-2 mb-4">
                <p className="text-[11px] text-violet-300/70 font-medium">{current.tip}</p>
              </div>

              {/* CTA */}
              <button
                onClick={next}
                className="w-full h-11 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-[14px] font-bold flex items-center justify-center gap-2 shadow-md shadow-violet-500/20 active:scale-[0.98] transition-all"
              >
                {isLast ? (
                  <>Let&apos;s go <Sparkles className="h-3.5 w-3.5" /></>
                ) : (
                  <>Got it <ArrowRight className="h-3.5 w-3.5" /></>
                )}
              </button>

              {/* Skip */}
              {!isLast && (
                <button
                  onClick={dismiss}
                  className="w-full text-center text-[11px] text-white/20 hover:text-white/40 font-medium transition-colors mt-3"
                >
                  Skip
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
