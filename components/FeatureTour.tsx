'use client';

import { useState, useEffect } from 'react';
import { Brain, Send, BookmarkCheck, Camera, MessageCircle, RefreshCw, X, ArrowRight, Sparkles, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const TOUR_STEPS = [
  {
    id: 'welcome',
    icon: Sparkles,
    iconBg: 'bg-gradient-to-br from-purple-500 to-indigo-600',
    title: 'Welcome to Text Wingman v3.3',
    description: 'New: Edit + Polish any reply, Regenerate for fresh options, and smarter AI that actually reads the conversation. Here\'s what\'s new — takes 30 seconds.',
    highlight: null,
  },
  {
    id: 'reply-mode',
    icon: MessageCircle,
    iconBg: 'bg-gradient-to-br from-purple-500 to-indigo-600',
    title: 'Reply Mode',
    description: 'Paste any text you received, pick the context (crush, friend, work), and hit Generate to get 3 reply options — Shorter, Spicier, and Softer.',
    highlight: 'reply-mode',
  },
  {
    id: 'decoder',
    icon: Brain,
    iconBg: 'bg-gradient-to-br from-amber-500 to-orange-600',
    title: '🧠 Message Decoder',
    description: 'Not sure what they mean? Hit the Decode button and our AI analyzes the subtext, intent, energy, and red/green flags — plus gives you a tactical Coach Tip on how to respond.',
    highlight: 'decode-btn',
  },
  {
    id: 'opener',
    icon: Send,
    iconBg: 'bg-gradient-to-br from-pink-500 to-rose-600',
    title: '💬 Opening Line Generator',
    description: 'Switch to Opener Mode at the top to generate first messages — for dating apps, Instagram DMs, cold texts, and more. Get 3 openers: Bold, Witty, and Warm.',
    highlight: 'opener-mode',
  },
  {
    id: 'saved-threads',
    icon: BookmarkCheck,
    iconBg: 'bg-gradient-to-br from-blue-500 to-cyan-600',
    title: '📑 Saved Threads',
    description: 'Save conversations by name (like "Sarah 🔥") and come back later for context-aware replies. The AI remembers the whole thread.',
    highlight: 'save-btn',
  },
  {
    id: 'screenshot',
    icon: Camera,
    iconBg: 'bg-gradient-to-br from-green-500 to-emerald-600',
    title: '📸 Screenshot Briefing',
    description: 'Screenshot any conversation (iMessage, WhatsApp, Tinder, etc.) and upload it. Our AI reads every message, analyzes the dynamic, and generates strategy + replies instantly.',
    highlight: 'screenshot-btn',
  },
  {
    id: 'revive',
    icon: RefreshCw,
    iconBg: 'bg-gradient-to-br from-cyan-500 to-blue-600',
    title: '🔄 Revive Mode',
    description: 'Got a dead conversation? Switch to Revive Mode, paste the thread, and get 3 re-engagement messages — Smooth, Bold, and Warm. No more "hey stranger" energy.',
    highlight: 'revive-mode',
  },
  {
    id: 'edit-polish',
    icon: Pencil,
    iconBg: 'bg-gradient-to-br from-violet-500 to-purple-600',
    title: '✏️ Edit + Polish',
    description: 'Like a reply but want to add your own twist? Tap Edit, type your ideas — like "let\'s grab food later" — then hit Polish. AI smooths it out while keeping your additions under 18 words.',
    highlight: null,
  },
  {
    id: 'regenerate',
    icon: RefreshCw,
    iconBg: 'bg-gradient-to-br from-gray-500 to-zinc-600',
    title: '🔁 Regenerate Replies',
    description: 'Not feeling the replies? Tap "Generate different replies" for a fresh set — same conversation, completely new options. No need to re-enter anything.',
    highlight: null,
  },
];

const STORAGE_KEY = 'tw_feature_tour_v3.3';

export default function FeatureTour() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) {
      // Small delay so the page renders first
      const timer = setTimeout(() => setVisible(true), 1200);
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

  const prev = () => {
    if (step > 0) setStep(step - 1);
  };

  if (!visible) return null;

  const current = TOUR_STEPS[step];
  const isLast = step === TOUR_STEPS.length - 1;
  const isFirst = step === 0;
  const Icon = current.icon;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] animate-in fade-in duration-300" onClick={dismiss} />
      
      {/* Tour Card */}
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-500">
          {/* Progress Bar */}
          <div className="h-1 bg-gray-100">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
              style={{ width: `${((step + 1) / TOUR_STEPS.length) * 100}%` }}
            />
          </div>

          <div className="p-6 space-y-5">
            {/* Close button */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 font-medium">{step + 1} of {TOUR_STEPS.length}</span>
              <button onClick={dismiss} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Icon + Title */}
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl ${current.iconBg} flex items-center justify-center shadow-xl shrink-0`}>
                <Icon className="h-7 w-7 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">{current.title}</h2>
            </div>

            {/* Description */}
            <p className="text-gray-600 leading-relaxed">{current.description}</p>

            {/* Navigation */}
            <div className="flex items-center gap-3 pt-2">
              {!isFirst && (
                <Button onClick={prev} variant="outline" className="rounded-xl border-gray-300 text-gray-600 font-bold">
                  Back
                </Button>
              )}
              <Button onClick={next} className="flex-1 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold h-12">
                {isLast ? (
                  <>Let&apos;s go! <Sparkles className="h-4 w-4 ml-2" /></>
                ) : (
                  <>Next <ArrowRight className="h-4 w-4 ml-2" /></>
                )}
              </Button>
            </div>

            {/* Skip link */}
            {!isLast && (
              <button onClick={dismiss} className="w-full text-center text-xs text-gray-400 hover:text-gray-600 font-medium transition-colors">
                Skip tour
              </button>
            )}

            {/* Features page link on last step */}
            {isLast && (
              <div className="text-center">
                <Link href="/features" onClick={dismiss} className="text-xs text-purple-500 hover:text-purple-700 font-medium transition-colors">
                  View all features in detail →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
