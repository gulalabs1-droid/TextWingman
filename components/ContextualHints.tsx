'use client';

import { useState, useEffect } from 'react';
import { Brain, Send, BookmarkCheck, Camera, X } from 'lucide-react';

type HintId = 'decode' | 'opener' | 'save' | 'screenshot';

type HintConfig = {
  id: HintId;
  storageKey: string;
  icon: typeof Brain;
  iconBg: string;
  title: string;
  description: string;
  cta: string;
};

const HINTS: HintConfig[] = [
  {
    id: 'decode',
    storageKey: 'tw_hint_decode_v1',
    icon: Brain,
    iconBg: 'bg-gradient-to-br from-amber-500 to-orange-500',
    title: 'Not sure what they mean?',
    description: 'Hit the 🧠 Decode button to analyze the subtext, intent, and hidden meaning behind their message.',
    cta: 'Try Decode',
  },
  {
    id: 'opener',
    storageKey: 'tw_hint_opener_v1',
    icon: Send,
    iconBg: 'bg-gradient-to-br from-pink-500 to-rose-500',
    title: 'Need to text first?',
    description: 'Switch to Opener Mode at the top to generate the perfect opening line for any situation.',
    cta: 'Try Opener Mode',
  },
  {
    id: 'save',
    storageKey: 'tw_hint_save_v1',
    icon: BookmarkCheck,
    iconBg: 'bg-gradient-to-br from-blue-500 to-cyan-500',
    title: 'Talking to someone special?',
    description: 'Save this convo as a thread so the AI remembers the full context next time.',
    cta: 'Save Thread',
  },
  {
    id: 'screenshot',
    storageKey: 'tw_hint_screenshot_v1',
    icon: Camera,
    iconBg: 'bg-gradient-to-br from-green-500 to-emerald-500',
    title: 'Too lazy to copy-paste?',
    description: 'Just screenshot the conversation and upload it — we\'ll read every message automatically.',
    cta: 'Upload Screenshot',
  },
];

type ContextualHintsProps = {
  hasMessage: boolean;
  hasReplies: boolean;
  appMode: string;
  onAction?: (hintId: HintId) => void;
};

export default function ContextualHints({ hasMessage, hasReplies, appMode, onAction }: ContextualHintsProps) {
  const [dismissedHints, setDismissedHints] = useState<Set<string>>(new Set());
  const [activeHint, setActiveHint] = useState<HintConfig | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load dismissed hints from localStorage
    const dismissed = new Set<string>();
    HINTS.forEach(h => {
      if (localStorage.getItem(h.storageKey)) dismissed.add(h.id);
    });
    setDismissedHints(dismissed);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Determine which hint to show based on context
    let hint: HintConfig | null = null;

    if (hasMessage && !hasReplies && appMode === 'reply' && !dismissedHints.has('decode')) {
      // User has a message but hasn't generated replies yet — suggest decode
      hint = HINTS.find(h => h.id === 'decode') || null;
    } else if (!hasMessage && appMode === 'reply' && !dismissedHints.has('screenshot')) {
      // Empty state — suggest screenshot
      hint = HINTS.find(h => h.id === 'screenshot') || null;
    } else if (!hasMessage && appMode === 'reply' && !dismissedHints.has('opener')) {
      // Empty state, already dismissed screenshot — suggest opener mode
      hint = HINTS.find(h => h.id === 'opener') || null;
    } else if (hasReplies && appMode === 'reply' && !dismissedHints.has('save')) {
      // User has generated replies — suggest saving
      hint = HINTS.find(h => h.id === 'save') || null;
    }

    setActiveHint(hint);
  }, [hasMessage, hasReplies, appMode, dismissedHints, mounted]);

  const dismissHint = (hint: HintConfig) => {
    localStorage.setItem(hint.storageKey, 'true');
    setDismissedHints(prev => new Set([...prev, hint.id]));
    setActiveHint(null);
  };

  if (!activeHint || !mounted) return null;

  const Icon = activeHint.icon;

  return (
    <div className="mb-4 animate-in fade-in slide-in-from-top-3 duration-500">
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl ${activeHint.iconBg} flex items-center justify-center shrink-0 shadow-lg`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm">{activeHint.title}</p>
          <p className="text-white/60 text-xs mt-0.5 leading-relaxed">{activeHint.description}</p>
          <button 
            onClick={() => { onAction?.(activeHint.id as HintId); dismissHint(activeHint); }}
            className="mt-2 text-xs font-bold text-purple-300 hover:text-purple-200 transition-colors"
          >
            {activeHint.cta} →
          </button>
        </div>
        <button onClick={() => dismissHint(activeHint)} className="text-white/30 hover:text-white/60 transition-colors shrink-0">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
