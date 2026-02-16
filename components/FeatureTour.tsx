'use client';

import { useState, useEffect } from 'react';
import { Brain, BookmarkCheck, Camera, MessageCircle, X, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const TOUR_STEPS = [
  {
    id: 'welcome',
    icon: Sparkles,
    iconBg: 'bg-gradient-to-br from-purple-500 to-indigo-600',
    title: 'Welcome to Text Wingman',
    description: 'Your AI texting copilot. Paste a message, upload a screenshot, or start fresh — we handle the rest.',
    highlight: null,
  },
  {
    id: 'core',
    icon: MessageCircle,
    iconBg: 'bg-gradient-to-br from-purple-500 to-indigo-600',
    title: 'Paste, Generate, Send',
    description: 'Paste what they sent, pick the vibe (crush, work, friend), and get 3 reply options. Edit any reply and hit Polish to make it yours.',
    highlight: 'reply-mode',
  },
  {
    id: 'screenshot',
    icon: Camera,
    iconBg: 'bg-gradient-to-br from-green-500 to-emerald-600',
    title: 'Screenshot It',
    description: 'Upload a screenshot from any app — iMessage, WhatsApp, Tinder, etc. We read the whole convo and generate replies instantly.',
    highlight: 'screenshot-btn',
  },
  {
    id: 'tools',
    icon: Brain,
    iconBg: 'bg-gradient-to-br from-amber-500 to-orange-600',
    title: 'Decode, Open & Revive',
    description: 'Decode what they really mean. Generate opening lines for new convos. Revive dead threads. Switch modes at the top.',
    highlight: 'decode-btn',
  },
  {
    id: 'threads',
    icon: BookmarkCheck,
    iconBg: 'bg-gradient-to-br from-blue-500 to-cyan-600',
    title: 'Threads Keep Context',
    description: 'Build a back-and-forth thread and every reply gets smarter. Save threads by name to pick up later.',
    highlight: 'save-btn',
  },
];

const STORAGE_KEY = 'tw_feature_tour_v3.3.2';

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
