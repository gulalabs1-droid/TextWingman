'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Mic, Square } from 'lucide-react';
import { track } from '@/lib/analytics';

// The browser's own speech-to-text (Safari, Chrome, Edge). Nothing is recorded
// or uploaded by Text Wingman; the words land in the message box to review.
type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  start: () => void;
  stop: () => void;
};
type RecognitionConstructor = new () => Recognition;

function recognitionConstructor(): RecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

const noSubscription = () => () => {};

/**
 * Hold-free dictation: tap to talk, tap again (or pause) to stop. Renders
 * nothing where the browser has no speech recognition.
 */
export function VoiceInputButton({ onText, disabled = false, hideWhenIdle = false, className = '' }: {
  /** Receives the full dictated text for this session as it is recognized. */
  onText: (text: string) => void;
  disabled?: boolean;
  /** Hide while not dictating (e.g. once the box has text), but never mid-dictation. */
  hideWhenIdle?: boolean;
  className?: string;
}) {
  const supported = useSyncExternalStore(noSubscription, () => Boolean(recognitionConstructor()), () => false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<Recognition | null>(null);

  useEffect(() => () => recognitionRef.current?.stop(), []);

  if (!supported || (hideWhenIdle && !listening)) return null;

  const toggle = () => {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const Ctor = recognitionConstructor();
    if (!Ctor) return;
    const recognition = new Ctor();
    recognition.lang = navigator.language || 'en-US';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      let text = '';
      for (let i = 0; i < event.results.length; i += 1) text += event.results[i][0].transcript;
      onText(text.trim());
    };
    recognition.onend = () => { setListening(false); recognitionRef.current = null; };
    recognition.onerror = (event) => {
      setListening(false);
      recognitionRef.current = null;
      track('voice_input_failed', { reason: event.error });
    };
    recognitionRef.current = recognition;
    try {
      recognition.start();
      setListening(true);
      track('voice_input_started');
    } catch {
      setListening(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={disabled}
      aria-label={listening ? 'Stop dictation' : 'Dictate a message'}
      aria-pressed={listening}
      className={`flex items-center justify-center rounded-xl transition-all active:scale-90 disabled:opacity-30 shrink-0 ${
        listening ? 'bg-red-500 text-white shadow-md shadow-red-500/30' : 'bg-white/[0.05] border border-white/[0.10] text-sage hover:text-cream'
      } ${className}`}
    >
      {listening ? <Square className="h-3.5 w-3.5 fill-current" /> : <Mic className="h-4 w-4" />}
    </button>
  );
}
