'use client';

import { useState, useEffect } from 'react';
import { Camera, X } from 'lucide-react';

const STORAGE_KEY = 'tw_hint_screenshot_v2';

type ContextualHintsProps = {
  hasMessage: boolean;
  hasReplies: boolean;
  appMode: string;
  onAction?: (hintId: string) => void;
};

export default function ContextualHints({ appMode, onAction }: ContextualHintsProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (appMode !== 'coach') return;
    if (localStorage.getItem(STORAGE_KEY)) return;
    const timer = setTimeout(() => setVisible(true), 6000);
    return () => clearTimeout(timer);
  }, [appMode]);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(STORAGE_KEY, 'true');
  };

  if (!visible) return null;

  return (
    <div className="mb-3 animate-in fade-in slide-in-from-top-2 duration-400">
      <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
          <Camera className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-semibold text-white/75">Skip the copy-paste</p>
          <p className="text-[11px] text-white/35 mt-0.5">Upload a screenshot — Coach reads the whole thread automatically.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => { onAction?.('screenshot'); dismiss(); }}
            className="text-[11px] font-bold text-blue-400 hover:text-blue-300 transition-colors"
          >
            Try it
          </button>
          <button onClick={dismiss} className="text-white/20 hover:text-white/50 transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
