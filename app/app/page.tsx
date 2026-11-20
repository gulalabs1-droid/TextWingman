'use client';

import { useState, useEffect, useRef, createContext, useContext } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Copy, Sparkles, Loader2, MessageCircle, Crown, Shield, Check, Camera, X, Trash2, Send, ChevronUp, ChevronDown, Plus, Clock, TrendingUp, TrendingDown, Minus, RefreshCw, Trophy, User, Maximize2, Share2 } from 'lucide-react';
import { Logo } from '@/components/Logo';
import ContextualHints from '@/components/ContextualHints';
import AppNav from '@/components/AppNav';
import { ARRIVAL_STORAGE_KEY, arrivalGreeting, parseArrival, parseStartIntent } from '@/lib/first-run';
import { getContextCategory, DRAFT_LABELS } from '@/lib/context-category';
import { compressImage } from '@/lib/compress-image';
import { coachSessionFromPending, receivedMessagePrompt, restoreCoachSession, serializeCoachMessage } from '@/lib/coach-session';
import { resumePath, savePendingCoach, takePendingCoach, type UpgradePlanChoice } from '@/lib/pending-coach';
import { ScreenshotViewer } from '@/components/ScreenshotViewer';
import { UpgradeSheet } from '@/components/UpgradeSheet';
import { VoiceInputButton } from '@/components/VoiceInputButton';
import { captureAttribution, getAnalyticsContext, track } from '@/lib/analytics';
import { PLAN_PRICES } from '@/lib/pricing';
import { FREE_REPLY_LIMIT } from '@/lib/usage-limits';
import {
  clearPendingOutcome,
  coachProfileInput,
  createReplyGenerationId,
  deriveStyleSignals,
  isOutcomeDue,
  readPendingOutcome,
  recordLocalStyleSignal,
  replyIdFor,
  savePendingOutcome,
  sendReplyLearningEvent,
  type ReplyOutcome,
} from '@/lib/reply-learning';
import { readCoachStream, type CoachDraft } from '@/lib/coach-stream';






type SavedThread = {
  id: string;
  name: string;
  context: string | null;
  platform: string | null;
  type: 'thread' | 'coach';
  messages?: any[];
  created_at?: string;
  updated_at: string;
  message_count: number;
  last_message: any;
};


type StrategyData = {
  momentum: string;
  balance: string;
  move: {
    energy: string;
    one_liner: string;
    constraints: {
      no_questions: boolean;
      keep_short: boolean;
      add_tease: boolean;
      push_meetup: boolean;
    };
    risk: string;
  };
  latencyMs: number;
} | null;

type CandidateScores = {
  neediness_risk: number;
  clarity: number;
  forward_motion: number;
  tone_match: number;
  one_breath: boolean;
};

type Candidate = {
  text: string;
  style: string;
  word_count: number;
  scores: CandidateScores;
  notes: string;
};

type OrchestrateResult = {
  mode: 'orchestrate';
  winner: Candidate | null;
  backup: Candidate | null;
  winner_id: number;
  backup_id: number;
  winner_reason: string;
  candidates: Candidate[];
  context_extraction: {
    her_tone: string;
    topic: string;
    open_questions: string[];
    must_acknowledge: string[];
    goal_detected: string;
  };
  strategy: {
    momentum: string;
    balance: string;
    energy_level?: string;
    sarcasm_detected?: boolean;
    is_kidding?: boolean;
    risk_flags?: string[];
    move: {
      energy: string;
      one_liner: string;
      constraints: Record<string, boolean>;
      risk: string;
    };
  };
  latency: {
    total: number;
    strategy: number;
    generation: number;
    critic: number;
  };
};

const STYLE_CONFIG: Record<string, { label: string; color: string }> = {
  hood_charisma: { label: 'Hood Charisma', color: 'text-amber-400 bg-amber-500/15' },
  clean_direct: { label: 'Clean Direct', color: 'text-blue-400 bg-blue-500/15' },
  playful_tease: { label: 'Playful Tease', color: 'text-pink-400 bg-pink-500/15' },
  bold_closer: { label: 'Bold Closer', color: 'text-orange-400 bg-orange-500/15' },
  warm_genuine: { label: 'Warm Genuine', color: 'text-emerald-400 bg-emerald-500/15' },
  chill_unbothered: { label: 'Chill', color: 'text-cyan-400 bg-cyan-500/15' },
};

type StrategyChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  draft?: { shorter?: string; spicier?: string; softer?: string } | null;
  orchestration?: OrchestrateResult | null;
  images?: string[];
  generationId?: string;
  // The conversation read from this message's screenshot(s), so a saved chat keeps it.
  threadText?: string;
};

/** Restores a saved chat, replacing everything from the chat that was open before. */
function loadCoachSession(type: string, saved: unknown) {
  const restored = restoreCoachSession<OrchestrateResult>(type, saved);
  const read = restored.read;
  const strategy = read?.move
    ? { momentum: read.momentum, balance: read.balance, move: read.move, latencyMs: 0 } as StrategyData
    : null;
  return { history: restored.history as StrategyChatMessage[], threadText: restored.threadText, strategy };
}

type CoachOutcomePrompt = {
  generationId: string;
  replyId: string;
  tone: string;
  context: string | null;
  asked: 'after_copy' | 'return_visit';
  preview?: string;
};



type ContextType = 'crush' | 'friend' | 'colleague' | 'family' | 'ex' | 'new_match' | null;

const PENDING_THREAD_STORAGE_KEY = 'tw_pending_thread';
const PENDING_THREAD_MAX_AGE_MS = 24 * 60 * 60 * 1000;


const CONTEXT_OPTIONS = [
  { value: 'crush', label: 'Crush', description: 'Someone you\'re into' },
  { value: 'friend', label: 'Friend', description: 'Close friend' },
  { value: 'colleague', label: 'Work', description: 'Professional' },
  { value: 'family', label: 'Family', description: 'Family member' },
  { value: 'ex', label: 'Ex', description: 'Complicated' },
  { value: 'new_match', label: 'New Match', description: 'First messages' },
] as const;
const CULTURE_REWRITE_PROMPT = 'Help me rewrite my draft: ';


type CoachCopyLearn = { msg: StrategyChatMessage; index: number; slot: string; tone: string };
type CoachCopyFn = (text: string, id: string, learn?: CoachCopyLearn) => void;

function CoachScoreBar({ label, value, inverted = false }: { label: string; value: number; inverted?: boolean }) {
  const displayValue = inverted ? 100 - value : value;
  const color =
    displayValue >= 80 ? 'bg-emerald-500' : displayValue >= 60 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-sage/70 w-20 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${displayValue}%` }} />
      </div>
      <span className="text-xs text-sage w-8 text-right">{value}</span>
    </div>
  );
}

const READ_TONES = {
  good: { dot: 'bg-emerald-400', text: 'text-emerald-300' },
  caution: { dot: 'bg-amber-400', text: 'text-amber-300' },
  risk: { dot: 'bg-red-400', text: 'text-red-300' },
  neutral: { dot: 'bg-white/25', text: 'text-cream' },
} as const;

/** Desktop side panel: Coach's latest read of the conversation, in full. */
function CoachReadPanel({ strategy }: { strategy: StrategyData }) {
  if (!strategy) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center">
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.05]">
          <TrendingUp className="h-5 w-5 text-sage/70" />
        </div>
        <p className="text-sm font-bold text-cream">No read yet</p>
        <p className="mt-1.5 max-w-[15rem] text-xs leading-relaxed text-sage">
          Share a conversation and Coach shows who is leading, where it is heading, and the move to make next.
        </p>
      </div>
    );
  }
  const { momentum, balance, move } = strategy;
  const signals: { label: string; value: string; tone: keyof typeof READ_TONES }[] = [
    { label: 'Momentum', value: momentum, tone: momentum === 'Rising' ? 'good' : momentum === 'Declining' || momentum === 'Stalling' ? 'risk' : 'caution' },
    { label: 'Balance', value: balance, tone: balance === 'Balanced' || balance === 'You lead' ? 'good' : balance === 'They lead' ? 'caution' : 'neutral' },
    { label: 'Energy', value: move.energy.replace('_', ' '), tone: move.energy === 'escalate' ? 'good' : move.energy === 'pull_back' ? 'risk' : move.energy === 'match' ? 'caution' : 'neutral' },
    { label: 'Risk', value: move.risk || 'low', tone: move.risk === 'high' ? 'risk' : move.risk === 'medium' ? 'caution' : 'good' },
  ];
  const guardrails = [
    move.constraints?.keep_short && 'Keep it short',
    move.constraints?.no_questions && 'No questions',
    move.constraints?.add_tease && 'Add a tease',
    move.constraints?.push_meetup && 'Push the meetup',
  ].filter((item): item is string => Boolean(item));
  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {move.one_liner && (
        <div className="rounded-2xl border border-brand/25 bg-brand/10 p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-brand">Your move</p>
          <p className="mt-1.5 text-sm font-semibold leading-relaxed text-cream">{move.one_liner}</p>
        </div>
      )}
      <dl className="divide-y divide-white/[0.06] rounded-2xl border border-white/[0.08] bg-white/[0.03]">
        {signals.map(signal => (
          <div key={signal.label} className="flex items-center justify-between gap-3 px-4 py-3">
            <dt className="text-xs text-sage">{signal.label}</dt>
            <dd className={`flex items-center gap-2 text-xs font-bold capitalize ${READ_TONES[signal.tone].text}`}>
              <span className={`h-2 w-2 rounded-full ${READ_TONES[signal.tone].dot}`} />
              {signal.value}
            </dd>
          </div>
        ))}
      </dl>
      {guardrails.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-sage">For this reply</p>
          <div className="flex flex-wrap gap-1.5">
            {guardrails.map(item => (
              <span key={item} className="rounded-full border border-white/[0.10] bg-white/[0.05] px-2.5 py-1 text-xs font-semibold text-cream">{item}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * One reply the person can send. On phones the cards sit in a swipeable row
 * (see ReplyOptionRail) and the whole-width Copy button is the main action.
 */
// Lets any reply card offer Share without threading a handler through every result component.
const ShareReplyContext = createContext<((text: string, tone: string) => void) | null>(null);

function ReplyOptionCard({ label, text, note, copied, onCopy, onCoach, shareTone, featured = false, solo = false }: {
  label: React.ReactNode;
  text: string;
  note?: string | null;
  copied: boolean;
  onCopy: () => void;
  onCoach?: () => void;
  /** Style name for the share card; the Share button shows when set. */
  shareTone?: string;
  featured?: boolean;
  solo?: boolean;
}) {
  const share = useContext(ShareReplyContext);
  return (
    <div className={`flex shrink-0 snap-center flex-col rounded-2xl border p-4 sm:w-full ${solo ? 'w-full' : 'w-[86%]'} ${
      featured ? 'border-brand/30 bg-brand/[0.07]' : 'border-white/[0.10] bg-white/[0.05]'
    }`}>
      <div className="mb-2 flex min-h-5 items-center gap-2 text-xs font-bold uppercase tracking-wider text-sage">{label}</div>
      <p className="flex-1 select-text whitespace-pre-wrap text-[15px] leading-relaxed text-cream">{text}</p>
      {note && <p className="mt-2 text-xs leading-relaxed text-sage">{note}</p>}
      <div className="mt-3 flex items-stretch gap-2">
        <button
          onClick={onCopy}
          className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all active:scale-[0.98] ${
            copied
              ? 'border border-emerald-400/30 bg-emerald-500/15 text-emerald-300'
              : featured
                ? 'bg-brand text-brand-ink hover:bg-brand-soft'
                : 'border border-white/[0.14] bg-white/[0.07] text-cream hover:bg-white/[0.12]'
          }`}
        >
          {copied ? <><Check className="h-4 w-4" /> Copied</> : <><Copy className="h-4 w-4" /> Copy</>}
        </button>
        {onCoach && (
          <button onClick={onCoach} className="flex min-h-11 items-center rounded-xl border border-white/[0.10] px-3 text-xs font-semibold text-sage transition-colors hover:border-brand/30 hover:text-brand active:scale-[0.98]">
            Coach this
          </button>
        )}
        {share && shareTone && (
          <button onClick={() => share(text, shareTone)} aria-label="Share this reply" title="Share this reply" className="flex min-h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/[0.10] text-sage transition-colors hover:border-brand/30 hover:text-brand active:scale-[0.98]">
            <Share2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

/** Swipeable on phones (next card peeks in), stacked from the sm breakpoint up. */
function ReplyOptionRail({ count, children }: { count: number; children: React.ReactNode }) {
  return (
    <>
      <div className="-mx-4 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-4 scrollbar-hide sm:mx-0 sm:flex-col sm:overflow-visible sm:px-0">
        {children}
      </div>
      {count > 1 && <p className="px-1 text-xs text-sage/70 sm:hidden">Swipe to compare all {count}</p>}
    </>
  );
}

function ConversationList({ threads, userId, isThreadActive, onLoad, onDelete }: {
  threads: SavedThread[];
  userId: string | null;
  isThreadActive: (id: string) => boolean;
  onLoad: (t: SavedThread) => void;
  onDelete: (id: string) => void;
}) {
  return (

    threads.length === 0 ? (
      <div className="text-center py-10 px-3">
        <div className="w-10 h-10 mx-auto rounded-2xl bg-white/[0.05] flex items-center justify-center mb-3">
          <MessageCircle className="h-5 w-5 text-sage/70" />
        </div>
        <p className="text-sage text-xs leading-relaxed">{userId ? 'Your conversations save here automatically' : 'Create a free account to save your conversations'}</p>
      </div>
    ) : (
      <div className="space-y-1">
        {[...threads]
          .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
          .map(t => {
            const active = isThreadActive(t.id);
            return (
              <div
                key={t.id}
                onClick={() => onLoad(t)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onLoad(t); } }}
                className={`group w-full flex items-center gap-2.5 p-2.5 rounded-2xl transition-all cursor-pointer active:scale-[0.98] ${
                  active
                    ? 'bg-brand/15 border border-brand/20'
                    : 'border border-transparent hover:bg-white/[0.05] hover:border-white/[0.06]'
                }`}
              >
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${active ? 'bg-brand/20' : 'bg-white/[0.05]'}`}>
                  <Sparkles className={`h-3 w-3 ${active ? 'text-brand' : 'text-sage'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-cream text-[13px] font-semibold truncate">{t.name}</p>
                  <p className="text-sage text-xs mt-0.5">{t.message_count} msgs · {new Date(t.updated_at).toLocaleDateString()}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(t.id); }}
                  className="opacity-50 hover:opacity-100 focus-visible:opacity-100 p-2 rounded-lg hover:bg-red-500/20 transition-all shrink-0"
                  aria-label="Delete conversation"
                >
                  <Trash2 className="h-3 w-3 text-red-400" />
                </button>
              </div>
            );
          })}
      </div>
    )
  );
}


function CoachEntryCards({ threads, onUpload, onPaste, onLoadThread, highlightUpload = false }: {
  threads: SavedThread[];
  highlightUpload?: boolean;
  onUpload: () => void;
  onPaste: () => void;
  onLoadThread: (t: SavedThread) => void;
}) {
  const recentThread = threads.length > 0
    ? [...threads].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0]
    : null;
  return (

                              <div className="mb-4 animate-in fade-in duration-500">
                  <p className="text-xs text-sage/70 font-bold uppercase tracking-wider mb-2 px-1">Start with</p>
                  <div className={`grid gap-2 ${recentThread ? 'grid-cols-3' : 'grid-cols-2'}`}>
                    <button
                      onClick={() => onUpload()}
                      className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl border transition-all active:scale-95 text-center ${
                        highlightUpload
                          ? 'bg-brand/[0.16] border-brand/60 shadow-lg shadow-brand/20 ring-2 ring-brand/30 motion-safe:animate-pulse'
                          : 'bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.08] hover:border-brand/20'
                      }`}
                    >
                      <Camera className="h-5 w-5 text-brand" aria-hidden />
                      <span className={`text-xs font-semibold ${highlightUpload ? 'text-cream' : 'text-sage'}`}>Screenshot</span>
                      <span className={`text-xs ${highlightUpload ? 'text-brand-soft' : 'text-sage'}`}>{highlightUpload ? 'Tap to upload yours' : 'Upload a convo'}</span>
                    </button>
                    <button
                      onClick={() => { onPaste() }}
                      className="flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:border-brand/20 transition-all active:scale-95 text-center"
                    >
                      <MessageCircle className="h-5 w-5 text-brand" aria-hidden />
                      <span className="text-xs font-semibold text-sage">Paste message</span>
                      <span className="text-xs text-sage">Get a reply</span>
                    </button>
                    {recentThread && (
                      <button
                        onClick={() => onLoadThread(recentThread)}
                        className="flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl bg-brand/[0.07] border border-brand/15 hover:bg-brand/[0.12] hover:border-brand/25 transition-all active:scale-95 text-center"
                      >
                        <Clock className="h-5 w-5 text-brand" aria-hidden />
                        <span className="text-xs font-semibold text-brand/70 truncate w-full">{recentThread.name?.split(' ').slice(0, 2).join(' ') || 'Last convo'}</span>
                        <span className="text-xs text-sage">Pick up here</span>
                      </button>
                    )}
                  </div>
                  <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-sage/70">
                    <Shield className="h-3 w-3" aria-hidden /> Screenshots are read, never stored.
                  </p>
                </div>
  );
}

function CoachOrchestrationResult({
  orch, msg, index, copiedId, expanded, onToggleExpand, onCopy,
  onQuickCopyDone, theyRepliedOpen, theyRepliedInput, onTheyRepliedInput,
  onTheyRepliedSubmit, onTheyRepliedClose,
}: {
  orch: OrchestrateResult;
  msg: StrategyChatMessage;
  index: number;
  copiedId: string | null;
  expanded: boolean;
  onToggleExpand: () => void;
  onCopy: CoachCopyFn;
  onQuickCopyDone: () => void;
  theyRepliedOpen: boolean;
  theyRepliedInput: string;
  onTheyRepliedInput: (v: string) => void;
  onTheyRepliedSubmit: (text: string) => void;
  onTheyRepliedClose: () => void;
}) {
  return (

                                                  <div className="w-full space-y-2">
                            {/* Strategy pills */}
                            <div className="flex flex-wrap gap-1.5 px-1">
                              <span className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                                orch.strategy.momentum === 'Rising' ? 'bg-emerald-500/15 text-emerald-400' :
                                orch.strategy.momentum === 'Declining' || orch.strategy.momentum === 'Stalling' ? 'bg-red-500/15 text-red-400' :
                                'bg-white/[0.08] text-sage'
                              }`}>
                                {orch.strategy.momentum === 'Rising' ? <TrendingUp className="h-2.5 w-2.5" /> : orch.strategy.momentum === 'Declining' || orch.strategy.momentum === 'Stalling' ? <TrendingDown className="h-2.5 w-2.5" /> : <Minus className="h-2.5 w-2.5" />}
                                {orch.strategy.momentum}
                              </span>
                              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white/[0.08] text-sage">{orch.strategy.balance}</span>
                              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                                orch.strategy.move.energy === 'pull_back' ? 'bg-orange-500/15 text-orange-400' :
                                orch.strategy.move.energy === 'escalate' ? 'bg-emerald-500/15 text-emerald-400' :
                                'bg-brand/15 text-brand'
                              }`}>{orch.strategy.move.energy.replace('_', ' ')}</span>
                              {orch.strategy.move.risk === 'high' && (
                                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-500/15 text-red-400">High risk</span>
                              )}
                            </div>
                            <p className="text-xs text-sage italic px-1">&ldquo;{orch.strategy.move.one_liner}&rdquo;</p>

                            {/* Winner and backup — swipeable on phones, one Copy button each */}
                            {orch.winner && (
                              <ReplyOptionRail count={orch.backup && orch.backup.text !== orch.winner.text ? 2 : 1}>
                                <ReplyOptionCard
                                  featured
                                  solo={!orch.backup || orch.backup.text === orch.winner.text}
                                  label={<>
                                    <span className="flex items-center gap-1 text-amber-400"><Trophy className="h-3 w-3" /> Top pick</span>
                                    <span className={`rounded-full px-2 py-0.5 normal-case tracking-normal ${STYLE_CONFIG[orch.winner.style]?.color || 'bg-white/10 text-sage'}`}>
                                      {STYLE_CONFIG[orch.winner.style]?.label || orch.winner.style}
                                    </span>
                                  </>}
                                  text={orch.winner.text}
                                  note={orch.winner_reason}
                                  copied={copiedId === `w-${index}`}
                                  onCopy={() => { onCopy(orch.winner!.text, `w-${index}`, { msg, index, slot: 'winner', tone: orch.winner!.style }); onQuickCopyDone(); }}
                                  shareTone="best"
                                />
                                {orch.backup && orch.backup.text !== orch.winner.text && (
                                  <ReplyOptionCard
                                    label={<>
                                      <span>Backup</span>
                                      <span className={`rounded-full px-2 py-0.5 normal-case tracking-normal ${STYLE_CONFIG[orch.backup.style]?.color || 'bg-white/10 text-sage'}`}>
                                        {STYLE_CONFIG[orch.backup.style]?.label || orch.backup.style}
                                      </span>
                                    </>}
                                    text={orch.backup.text}
                                    copied={copiedId === `b-${index}`}
                                    onCopy={() => onCopy(orch.backup!.text, `b-${index}`, { msg, index, slot: 'backup', tone: orch.backup!.style })}
                                    shareTone="best"
                                  />
                                )}
                              </ReplyOptionRail>
                            )}
                            {theyRepliedOpen && (
                              <div className="flex items-center gap-2 px-1 animate-in fade-in slide-in-from-top-1 duration-200">
                                <input
                                  autoFocus
                                  value={theyRepliedInput}
                                  onChange={e => onTheyRepliedInput(e.target.value)}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter' && theyRepliedInput.trim()) onTheyRepliedSubmit(theyRepliedInput.trim());
                                    if (e.key === 'Escape') onTheyRepliedClose();
                                  }}
                                  placeholder="They replied: paste it here..."
                                  className="flex-1 min-h-11 px-3 py-2 rounded-xl bg-white/[0.05] border border-white/[0.10] text-cream placeholder-white/40 text-xs focus:outline-none focus:border-amber-500/30 transition-all"
                                />
                                <button
                                  onClick={() => { if (theyRepliedInput.trim()) onTheyRepliedSubmit(theyRepliedInput.trim()); else onTheyRepliedClose(); }}
                                  aria-label="Add their reply" className="min-h-11 px-4 rounded-xl bg-amber-500/15 border border-amber-500/25 text-amber-400 text-xs font-bold hover:bg-amber-500/25 transition-all active:scale-95"
                                >→</button>
                                <button onClick={onTheyRepliedClose} aria-label="Dismiss" className="flex h-11 w-9 items-center justify-center text-sage/70 hover:text-sage transition-colors"><X className="h-3.5 w-3.5" /></button>
                              </div>
                            )}

                            {/* Expand/collapse all candidates */}
                            <button
                              onClick={() => onToggleExpand()}
                              className="flex items-center gap-1.5 min-h-10 px-2 text-xs text-sage hover:text-sage transition-colors"
                            >
                              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                              {expanded ? 'Hide' : 'See'} all {orch.candidates?.length || 0} options and scores
                            </button>

                            {/* Expanded trace */}
                            {expanded && (
                              <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                {/* Context extraction */}
                                <div className="px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                                  <p className="text-xs font-bold text-sage uppercase tracking-wider mb-2">Context Extraction</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/[0.06] text-sage/70">tone: {orch.context_extraction.her_tone}</span>
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/[0.06] text-sage/70">topic: {orch.context_extraction.topic}</span>
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/[0.06] text-sage/70">goal: {orch.context_extraction.goal_detected}</span>
                                  </div>
                                  {orch.context_extraction.must_acknowledge.length > 0 && (
                                    <div className="mt-1.5">
                                      <p className="text-xs text-red-400/50 font-bold">Must acknowledge:</p>
                                      {orch.context_extraction.must_acknowledge.map((a, idx) => (
                                        <p key={idx} className="text-xs text-sage ml-2">• {a}</p>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                {/* All candidates with scores */}
                                {orch.candidates?.map((c, cIdx) => (
                                  <button
                                    key={cIdx}
                                    onClick={() => onCopy(c.text, `c-${index}-${cIdx}`, { msg, index, slot: cIdx === orch.winner_id ? 'winner' : cIdx === orch.backup_id ? 'backup' : `candidate_${cIdx}`, tone: c.style })}
                                    className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all active:scale-[0.98] group ${
                                      cIdx === orch.winner_id ? 'bg-amber-500/[0.06] border-amber-500/20' :
                                      cIdx === orch.backup_id ? 'bg-white/[0.03] border-white/[0.08]' :
                                      'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.04]'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between mb-1.5">
                                      <div className="flex items-center gap-1.5">
                                        {cIdx === orch.winner_id && <Trophy className="h-3 w-3 text-amber-400" />}
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STYLE_CONFIG[c.style]?.color || 'bg-white/10 text-sage'}`}>
                                          {STYLE_CONFIG[c.style]?.label || c.style}
                                        </span>
                                        <span className="text-xs text-sage/70">{c.word_count}w</span>
                                      </div>
                                      <span className="text-xs text-sage/70 group-hover:text-sage transition-colors">
                                        {copiedId === `c-${index}-${cIdx}` ? <Check className="h-3 w-3 text-emerald-400" /> : 'Copy'}
                                      </span>
                                    </div>
                                    <p className="text-[13px] text-cream mb-2">{c.text}</p>
                                    <div className="space-y-1">
                                      <CoachScoreBar label="Neediness" value={c.scores.neediness_risk} inverted />
                                      <CoachScoreBar label="Clarity" value={c.scores.clarity} />
                                      <CoachScoreBar label="Forward" value={c.scores.forward_motion} />
                                      <CoachScoreBar label="Tone match" value={c.scores.tone_match} />
                                    </div>
                                    {c.notes && <p className="text-xs text-sage/70 mt-1.5">{c.notes}</p>}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
  );
}

// One tap asks Coach to rework the drafts it just wrote.
const DRAFT_TWEAKS = [
  { key: 'shorter', label: 'Shorter', prompt: 'Make those replies shorter. Keep what they answer.' },
  { key: 'warmer', label: 'Warmer', prompt: 'Make those replies warmer and more genuine.' },
  { key: 'bolder', label: 'Bolder', prompt: 'Make those replies bolder and more confident.' },
  { key: 'casual', label: 'More casual', prompt: 'Make those replies more casual, like a quick text.' },
] as const;

function CoachDraftCards({
  msg, index, context, copiedId, onCopy, onCoachThis, onTweak, onUpgrade, isPro,
}: {
  msg: StrategyChatMessage;
  index: number;
  context: ContextType | null;
  copiedId: string | null;
  onCopy: CoachCopyFn;
  onCoachThis: (text: string) => void;
  /** Shown on the latest drafts only. */
  onTweak?: (prompt: string, key: string) => void;
  onUpgrade: () => void;
  isPro: boolean;
}) {
  if (!msg.draft) return null;
  const draftLabels = DRAFT_LABELS[getContextCategory(context)];
  const cat = getContextCategory(context);
  const headerColor = cat === 'professional' ? 'text-amber-400/70' : cat === 'platonic' ? 'text-blue-400/70' : 'text-emerald-400/70';
  const options = [
    { key: 'shorter', label: draftLabels.a, text: msg.draft.shorter },
    { key: 'spicier', label: draftLabels.b, text: msg.draft.spicier },
    { key: 'softer', label: draftLabels.c, text: msg.draft.softer },
  ].filter((option): option is { key: string; label: string; text: string } => Boolean(option.text));
  return (
                        <div className="w-full space-y-2">
                          <p className={`text-xs font-bold uppercase tracking-wider px-1 ${headerColor}`}>Coach drafts</p>
                          <ReplyOptionRail count={options.length}>
                            {options.map((option, optionIndex) => (
                              <ReplyOptionCard
                                key={option.key}
                                featured={optionIndex === 0}
                                solo={options.length === 1}
                                label={option.label}
                                text={option.text}
                                copied={copiedId === `d-${index}-${option.key}`}
                                onCopy={() => onCopy(option.text, `d-${index}-${option.key}`, { msg, index, slot: option.key, tone: option.key })}
                                onCoach={() => onCoachThis(option.text)}
                                shareTone={option.key}
                              />
                            ))}
                          </ReplyOptionRail>
                        {onTweak && (
                          <div className="flex flex-wrap gap-2 px-1 pt-1" role="group" aria-label="Adjust these replies">
                            {DRAFT_TWEAKS.map(tweak => (
                              <button
                                key={tweak.key}
                                onClick={() => onTweak(tweak.prompt, tweak.key)}
                                className="min-h-9 rounded-full border border-white/[0.10] px-3.5 text-xs font-semibold text-sage transition-colors hover:border-brand/30 hover:text-brand active:scale-95"
                              >
                                {tweak.label}
                              </button>
                            ))}
                          </div>
                        )}
                        {!isPro && (
                          <button onClick={onUpgrade} className="flex w-full items-center gap-2 px-3 py-2 rounded-xl bg-brand/[0.06] border border-brand/15 hover:bg-brand/[0.10] transition-all mt-1 text-left">
                            <Shield className="h-3 w-3 text-brand shrink-0" />
                            <span className="text-xs text-brand/60 flex-1">Pro scores 6 options and picks the best one</span>
                            <span className="text-xs text-brand/40">→</span>
                          </button>
                        )}
                        </div>
  );
}

export default function AppPage() {
  const searchParams = useSearchParams();
  // Read after the first render: the server cannot see localStorage, and reading
  // it during render made React throw away the server HTML for returning users.
  const [selectedContext, setSelectedContext] = useState<ContextType>(null);
  const contextPersistReady = useRef(false);
  useEffect(() => {
    const saved = localStorage.getItem('tw_context') as ContextType;
    if (saved) setSelectedContext(current => current ?? saved);
  }, []);
  const [vpnBlocked, setVpnBlocked] = useState(false);
  const [usageCount, setUsageCount] = useState(0);
  const [remainingReplies, setRemainingReplies] = useState(FREE_REPLY_LIMIT);
  const [showPaywall, setShowPaywall] = useState(false);
  // When the next free use comes back, so the upgrade sheet can say so.
  const [nextFreeAt, setNextFreeAt] = useState<string | null>(null);
  const [upgradePlan, setUpgradePlan] = useState<UpgradePlanChoice>('annual');
  const [upgradeTrigger, setUpgradeTrigger] = useState<'free_limit' | 'deep_analysis'>('free_limit');
  useEffect(() => {
    // The limit is usually hit mid-session, after usage was first loaded: refresh the reset time.
    if (!showPaywall) return;
    let active = true;
    fetch('/api/usage')
      .then(res => (res.ok ? res.json() : null))
      .then(data => { if (active && data) setNextFreeAt(typeof data.nextFreeAt === 'string' ? data.nextFreeAt : null); })
      .catch(() => {});
    return () => { active = false; };
  }, [showPaywall]);
  const [usageLimit, setUsageLimit] = useState(FREE_REPLY_LIMIT);
  const [isPro, setIsPro] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  // Full-screen screenshot viewer: which images are open and which one is showing.
  const [shotViewer, setShotViewer] = useState<{ images: string[]; index: number } | null>(null);
  // Set when onboarding hands off with ?start=screenshot: points at the upload card.
  const [highlightUpload, setHighlightUpload] = useState(false);
  const [savedThreads, setSavedThreads] = useState<SavedThread[]>([]);
  const [strategyData, setStrategyData] = useState<StrategyData>(null);
  const [strategyChatHistory, setStrategyChatHistory] = useState<StrategyChatMessage[]>([]);
  const [strategyChatInput, setStrategyChatInput] = useState('');
  // A message to send to Coach as soon as the page is ready (arrivals from share links and the homepage).
  const [coachAutoSend, setCoachAutoSend] = useState<string | null>(null);
  // Who the current chat is with, read from the screenshot header; names the saved chat.
  const [coachContactName, setCoachContactName] = useState<string | null>(null);
  // Once someone picks "who is it" themselves in a chat, detection stops overriding it.
  const contextPickedInChat = useRef(false);
  const [strategyChatLoading, setStrategyChatLoading] = useState(false);
  const [extractedThread, setExtractedThread] = useState('');
  const [expandedCoachTrace, setExpandedCoachTrace] = useState<number | null>(null);
  const [coachCopiedId, setCoachCopiedId] = useState<string | null>(null);
  const [theyRepliedForIdx, setTheyRepliedForIdx] = useState<number | null>(null);
  const [theyRepliedInput, setTheyRepliedInput] = useState('');
  const [coachPipelineStep, setCoachPipelineStep] = useState<string | null>(null);
  const [coachStreaming, setCoachStreaming] = useState(false);
  const [coachOutcome, setCoachOutcome] = useState<CoachOutcomePrompt | null>(null);
  const [showCoachThreads, setShowCoachThreads] = useState(false);
  const [showContextSheet, setShowContextSheet] = useState(false);
  const [coachDragActive, setCoachDragActive] = useState(false);
  const coachRunIds = useRef<Record<number, string>>({});
  const coachCopiedReplies = useRef<Record<string, string>>({});
  const [loadingSession, setLoadingSession] = useState(false);
  const coachFileInputRef = useRef<HTMLInputElement>(null);
  const coachTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [coachScreenshotExtracting, setCoachScreenshotExtracting] = useState(false);
  const coachEndRef = useRef<HTMLDivElement>(null);
  const coachCardRef = useRef<HTMLDivElement>(null);
  const coachSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const [activeCoachSessionId, setActiveCoachSessionId] = useState<string | null>(null);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const isSocialTraffic = useRef(false);
  const isCultureDraft = useRef(false);
  const cultureDraftTracked = useRef(false);
  const { toast } = useToast();
  

  const updateCoachInput = (value: string) => {
    setStrategyChatInput(value);
    const draft = value.startsWith(CULTURE_REWRITE_PROMPT) ? value.slice(CULTURE_REWRITE_PROMPT.length) : value;
    if (isCultureDraft.current && !cultureDraftTracked.current && draft.trim() && !CULTURE_REWRITE_PROMPT.trim().startsWith(value.trim())) {
      cultureDraftTracked.current = true;
      track('composer_start', { from: 'culture_draft', length: draft.length });
    }
  };






  // ── Dynamic placeholder rotation ──────────────────────
  const SMART_PLACEHOLDERS = [
    'Ask anything or paste a message...',
    'Decode why they sent "k."...',
    'What should I reply to this?',
    'Is this a good sign or bad?',
    'Help me start something new...',
    'Am I overthinking this?',
    'How do I bring this up with my coworker?',
    'My friend went cold — what do I say?',
    'How do I follow up without being pushy?',
  ];

  // Auto-resize coach textarea when input changes. Only steal focus when the
  // input was set programmatically (chip tap, Smart Preview) — re-focusing on
  // every keystroke makes the caret jump and the iOS keyboard flicker, which
  // felt like the field "getting stuck" while typing.
  useEffect(() => {
    const el = coachTextareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
    if (strategyChatInput.trim() && document.activeElement !== el) el.focus();
  }, [strategyChatInput]);

  // Size the Coach card to fill the real available space instead of a fixed
  // magic offset. Measures the card's actual top and fills down to the bottom
  // of the *visual* viewport — which already shrinks when the keyboard opens,
  // so it adapts to the usage bar, trial banner, notch/safe-areas and keyboard
  // automatically (fixes the card feeling small/cramped on mobile).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const el = coachCardRef.current;
    if (!el) return;
    const recompute = () => {
      const top = el.getBoundingClientRect().top;
      const vh = window.visualViewport?.height ?? window.innerHeight;
      const bottomGap = 12; // breathing room above the bottom safe area
      // The signed-in tab bar sits under the card on phones; it hides while the keyboard is open.
      const keyboardOpen = window.innerHeight - vh > 80;
      const nav = document.querySelector<HTMLElement>('[data-app-nav]');
      const navHeight = keyboardOpen ? 0 : nav?.offsetHeight || 0;
      const h = Math.max(380, vh - top - bottomGap - navHeight);
      el.style.height = `${h}px`;
    };
    recompute();
    // Re-measure after layout settles (fonts/banners) and on viewport changes.
    const raf = requestAnimationFrame(recompute);
    const vv = window.visualViewport;
    vv?.addEventListener('resize', recompute);
    vv?.addEventListener('scroll', recompute);
    window.addEventListener('resize', recompute);
    window.addEventListener('orientationchange', recompute);
    return () => {
      cancelAnimationFrame(raf);
      vv?.removeEventListener('resize', recompute);
      vv?.removeEventListener('scroll', recompute);
      window.removeEventListener('resize', recompute);
      window.removeEventListener('orientationchange', recompute);
    };
  }, [usageCount, isPro, trialDaysLeft, strategyChatHistory.length, userId]);

  // Rotate placeholder text every 4s when input is empty
  useEffect(() => {
    if (strategyChatInput.trim()) return;
    const timer = setInterval(() => {
      setPlaceholderIdx(prev => (prev + 1) % SMART_PLACEHOLDERS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [strategyChatInput, SMART_PLACEHOLDERS.length]);

  // ── Short-form / paid-traffic entry: capture attribution, force Fast mode, prefill message ──
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const attribution = captureAttribution();
      const params = new URLSearchParams(window.location.search);
      const src = params.get('src');
      const mode = params.get('mode');
      const prefill = params.get('prefill');
      const via = params.get('via');
      const intent = params.get('intent');
      const start = parseStartIntent(params.get('start'));

      // Onboarding hands off with the first action the person picked.
      if (start) {
        if (start === 'paste') {
          setStrategyChatInput(previous => previous || 'Help me reply to this: ');
          window.setTimeout(() => {
            const input = coachTextareaRef.current;
            if (!input) return;
            input.focus();
            input.setSelectionRange(input.value.length, input.value.length);
          }, 400);
        } else {
          setHighlightUpload(true);
        }
        track('first_run_start', { start });
      }

      if (src || mode) {
        track('app_view', { src: src || undefined, mode: mode || undefined, via: via || undefined });
      }
      const socialSources = ['tiktok', 'youtube', 'instagram', 'ig', 'shorts', 'reels'];
      const isFastEntry = mode === 'fast' || via === 'share' || Boolean(src && socialSources.includes(src.toLowerCase()));
      if (isFastEntry) {
        isSocialTraffic.current = true;
      }
      if (intent === 'rewrite' && prefill !== '1') {
        isCultureDraft.current = true;
        setStrategyChatInput(previous => previous || CULTURE_REWRITE_PROMPT);
        track('culture_draft_ready', { from: 'dont_send_that' });
      }
      if (prefill === '1') {
        const msg = sessionStorage.getItem('tw_prefill_message');
        if (msg) {
          // A prefilled message is an intent to get a reply, not an invitation
          // to hunt through the workspace for the right mode.
          const shouldAutoRun = isFastEntry || via === 'paste' || via === 'upload';
          if (shouldAutoRun) {
            // Arriving with a message to answer: Coach answers it straight away.
            setCoachAutoSend(receivedMessagePrompt(msg));
          } else {
            setStrategyChatInput(msg);
          }
          sessionStorage.removeItem('tw_prefill_message');
          track('app_prefill_loaded', { length: msg.length, via: via || 'paste' });
        }
      }
      // Strip params from URL so refresh doesn't re-trigger prefill
      if (src || mode || prefill || start) {
        const cleanUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, '', cleanUrl);
      }
      void attribution;
    } catch {
      // tracking must never break the app
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Restore a high-intent visitor's reply after signup/onboarding instead of
  // making them paste the same message a second time.
  useEffect(() => {
    if (typeof window === 'undefined' || searchParams.get('restore') !== '1') return;

    const removePending = () => {
      try {
        sessionStorage.removeItem(PENDING_THREAD_STORAGE_KEY);
        localStorage.removeItem(PENDING_THREAD_STORAGE_KEY);
      } catch {}
    };

    try {
      const raw = sessionStorage.getItem(PENDING_THREAD_STORAGE_KEY)
        || localStorage.getItem(PENDING_THREAD_STORAGE_KEY);
      if (!raw) return;

      const pending = JSON.parse(raw);
      if (!pending.savedAt || Date.now() - pending.savedAt > PENDING_THREAD_MAX_AGE_MS) {
        removePending();
        return;
      }

      // The homepage hands over their message and the replies it wrote; pick up in Coach.
      const session = coachSessionFromPending(pending);
      if (session) {
        setStrategyChatHistory(session.history as StrategyChatMessage[]);
        setExtractedThread(session.threadText);
      }
      if (pending.selectedContext) {
        // Chosen on the homepage, so screenshot detection shouldn't override it.
        setSelectedContext(pending.selectedContext as ContextType);
        contextPickedInChat.current = true;
      }
      removePending();
      track('saved_thread_restored', { source: isSocialTraffic.current ? 'social' : 'organic' });
    } catch {
      removePending();
    } finally {
      window.history.replaceState({}, '', window.location.pathname + window.location.hash);
    }
  }, [searchParams]);

  // Back from sign-up after choosing a plan: restore the chat and pick up where they left off.
  useEffect(() => {
    if (typeof window === 'undefined' || searchParams.get('resume') !== '1') return;
    const pending = takePendingCoach();
    if (pending) {
      const restored = loadCoachSession('coach', pending.messages);
      setStrategyChatHistory(restored.history);
      setExtractedThread(pending.threadText || restored.threadText);
      setStrategyData(restored.strategy);
      if (pending.context) {
        setSelectedContext(pending.context as ContextType);
        contextPickedInChat.current = true;
      }
      if (pending.input) setStrategyChatInput(pending.input);
      setUpgradePlan(pending.plan);
      setShowPaywall(true);
      track('saved_thread_restored', { source: 'upgrade_signup' });
    }
    window.history.replaceState({}, '', window.location.pathname + window.location.hash);
  }, [searchParams]);

  // Track when the coach reply is displayed; the server owns success counting.
  const prevCoachLen = useRef(0);
  useEffect(() => {
    const assistantMsgs = strategyChatHistory.filter(m => m.role === 'assistant');
    if (assistantMsgs.length > prevCoachLen.current && prevCoachLen.current >= 0) {
      track('reply_displayed', { source: isSocialTraffic.current ? 'social' : 'organic', count: assistantMsgs.length });
    }
    prevCoachLen.current = assistantMsgs.length;
  }, [strategyChatHistory]);

  // Persist selected context across sessions
  useEffect(() => {
    // Skip the mount pass, which runs before the saved choice has been restored.
    if (!contextPersistReady.current) { contextPersistReady.current = true; return; }
    if (selectedContext) localStorage.setItem('tw_context', selectedContext);
    else localStorage.removeItem('tw_context');
  }, [selectedContext]);

  // Load usage and Pro status from server on mount
  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const res = await fetch('/api/usage');
        if (res.ok) {
          const data = await res.json();
          setUsageCount(data.usageCount);
          setRemainingReplies(data.remaining);
          if (data.limit) setUsageLimit(data.limit);
          setNextFreeAt(typeof data.nextFreeAt === 'string' ? data.nextFreeAt : null);
          // Store user info for checkout
          if (data.userId) setUserId(data.userId);
          // Check if user is Pro (unlimited or has active subscription)
          if (data.isPro) {
            setIsPro(true);
          }
          if (data.trialDaysLeft !== undefined && data.trialDaysLeft !== null) {
            setTrialDaysLeft(data.trialDaysLeft);
          }
          if (data.userName) setUserName(data.userName);
          // One-time greeting right after sign-in or onboarding.
          try {
            const arrival = parseArrival(sessionStorage.getItem(ARRIVAL_STORAGE_KEY));
            if (arrival && data.userId) {
              sessionStorage.removeItem(ARRIVAL_STORAGE_KEY);
              toast(arrivalGreeting({
                arrival,
                fullName: data.userName,
                isPro: Boolean(data.isPro),
                remaining: typeof data.remaining === 'number' ? data.remaining : FREE_REPLY_LIMIT,
                limit: data.limit || FREE_REPLY_LIMIT,
              }));
            }
          } catch {}
        }
      } catch (error) {
        console.error('Failed to fetch usage:', error);
      }
    };
    fetchUsage();
    fetchThreads();
    
    // Check for successful payment redirect
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      toast({
        title: "Payment received",
        description: "Your Pro access is syncing now. Your coach is ready in a few seconds.",
      });
      track('checkout_completed', {
        plan: urlParams.get('plan') || undefined,
        source: isSocialTraffic.current ? 'social' : 'organic',
      });
      // Clean up URL
      window.history.replaceState({}, '', '/app');
      // Refetch to get updated Pro status
      setTimeout(fetchUsage, 1000);
    }
  }, [toast]);

  // Auto-load session from ?load= query param (from /history or dashboard deep link)
  // Inlines restoration to avoid double-fetch (handleLoadThread would re-fetch the same thread)
  useEffect(() => {
    const loadId = searchParams.get('load');
    if (!loadId) return;
    setLoadingSession(true);
    (async () => {
      try {
        const res = await fetch(`/api/threads?id=${loadId}`);
        if (!res.ok) return;
        const data = await res.json();
        const ft = data.thread;
        if (!ft) return;
        const type = ft.type || 'thread';
        const msgs = ft.messages || [];

        // Restore into Coach chat UI
        const restored = loadCoachSession(type, msgs);
        setStrategyChatHistory(restored.history);
        setExtractedThread(restored.threadText);
        setCoachContactName(null);
        contextPickedInChat.current = true;
      setCoachContactName(null);
      contextPickedInChat.current = true;
        setStrategyData(restored.strategy);

        setActiveCoachSessionId(ft.id);
        if (ft.context) setSelectedContext(ft.context as ContextType);
        window.history.replaceState({}, '', '/app');
      } catch {
        toast({ title: "Couldn't open that chat", variant: 'destructive' });
      } finally {
        setLoadingSession(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Rotate taglines every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll coach chat. Scroll the inner container directly instead of
  // scrollIntoView — the latter bubbles up to the document (which has global
  // smooth-scroll) and can jump the whole page on mobile when a reply arrives.
  useEffect(() => {
    const end = coachEndRef.current;
    const container = end?.parentElement;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
  }, [strategyChatHistory, strategyChatLoading]);

  // Ask about the last copied reply when someone comes back later.
  useEffect(() => {
    const t = setTimeout(() => {
      const pending = readPendingOutcome();
      if (pending && isOutcomeDue(pending, Date.now())) {
        setCoachOutcome({ ...pending, asked: 'return_visit', preview: pending.theirMessagePreview });
      }
    }, 0);
    return () => clearTimeout(t);
  }, []);

  // Auto-save coach session after 2+ messages (2s debounce)
  useEffect(() => {
    if (strategyChatHistory.length < 2) return;
    if (coachSaveTimer.current) clearTimeout(coachSaveTimer.current);
    coachSaveTimer.current = setTimeout(() => {
      autoSaveCoachSession();
    }, 2000);
    return () => { if (coachSaveTimer.current) clearTimeout(coachSaveTimer.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strategyChatHistory]);














  // Share a Coach reply as a card (their message + the reply) that links back to Text Wingman.
  const shareCoachReply = async (text: string, tone: string) => {
    const lastThem = extractedThread
      .split('\n')
      .map(line => line.trim())
      .filter(line => /^them:/i.test(line))
      .pop()
      ?.replace(/^them:\s*/i, '')
      .replace(/\s*\([^)]*\)\s*$/, '');
    const lastAsked = [...strategyChatHistory].reverse()
      .find(m => m.role === 'user' && m.content.trim() && !m.images?.length)?.content;
    const theirMessage = (lastThem || lastAsked || '…').slice(0, 100);
    try {
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theirMessage, myReply: text, tone }),
      });
      const data = await res.json();
      if (!res.ok || !data.shareUrl) throw new Error('share failed');
      const url = `${window.location.origin}${data.shareUrl}`;
      if (typeof navigator.share === 'function') {
        try {
          await navigator.share({ title: 'My reply, via Text Wingman', url });
          track('reply_shared', { tone, method: 'native' });
          return;
        } catch (error) {
          if ((error as Error)?.name === 'AbortError') return;
        }
      }
      await navigator.clipboard.writeText(url);
      track('reply_shared', { tone, method: 'link' });
      toast({ title: 'Share link copied', description: 'The card shows their message and your reply.' });
    } catch {
      toast({ title: "Couldn't create a share link", variant: 'destructive' });
    }
  };
















  // ── Saved threads ─────────────────────────────────────
  const fetchThreads = async () => {
    try {
      const res = await fetch('/api/threads');
      if (res.ok) {
        const data = await res.json();
        setSavedThreads(data.threads || []);
      }
    } catch {}
  };

  const autoSaveCoachSession = async () => {
    if (strategyChatHistory.length < 2) return;
    try {
      const firstUserMsg = strategyChatHistory.find(m => m.role === 'user');
      const lastOrch = [...strategyChatHistory].reverse().find(m => m.orchestration);
      const orchTopic = lastOrch?.orchestration?.context_extraction?.topic;
      const orchTone = lastOrch?.orchestration?.context_extraction?.her_tone;
      const autoName = activeCoachSessionId
        ? undefined
        : coachContactName
          ? coachContactName
        : orchTopic && orchTone
          ? `${orchTopic} · ${orchTone}`
          : orchTopic
            ? orchTopic
            : firstUserMsg
              ? firstUserMsg.content.slice(0, 50) + (firstUserMsg.content.length > 50 ? '...' : '')
              : 'Coach session';

      const res = await fetch('/api/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeCoachSessionId || undefined,
          name: autoName,
          // Keep what Coach needs to pick the chat back up: the conversation it read
          // from screenshots and the full Deep Analysis, not just the visible text.
          messages: strategyChatHistory.map(serializeCoachMessage),
          context: selectedContext,
          type: 'coach',
        }),
      });
      const data = await res.json();
      if (data.thread) {
        if (!activeCoachSessionId) {
          setActiveCoachSessionId(data.thread.id);
        }
        fetchThreads();
      }
    } catch {} finally {
    }
  };

  const handleLoadThread = async (saved: SavedThread) => {
    try {
      const res = await fetch(`/api/threads?id=${saved.id}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const fullThread = data.thread;
      const type = saved.type || fullThread?.type || 'thread';
      const msgs = fullThread?.messages || [];

      // Convert ALL sessions into Coach chat history so they display in Coach UI
      const restored = loadCoachSession(type, msgs);
      setStrategyChatHistory(restored.history);
      setExtractedThread(restored.threadText);
      setCoachContactName(null);
      contextPickedInChat.current = true;
      setStrategyData(restored.strategy);

      setActiveCoachSessionId(saved.id);
      setCoachOutcome(null);
      setShowCoachThreads(false);
      coachRunIds.current = {};
      if (saved.context) setSelectedContext(saved.context as ContextType);
    } catch {
      toast({ title: "Couldn't open that chat", variant: 'destructive' });
    }
  };

  const handleDeleteThread = async (id: string) => {
    try {
      const res = await fetch(`/api/threads?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setSavedThreads(prev => prev.filter(t => t.id !== id));
      if (activeCoachSessionId === id) {
        setActiveCoachSessionId(null);
        setStrategyChatHistory([]);
        setStrategyChatInput('');
      }
    } catch {
      toast({ title: "Couldn't delete that chat", variant: 'destructive' });
    }
  };


  const handleNewThread = () => {
    setStrategyData(null);
    setStrategyChatHistory([]);
    setStrategyChatInput('');
    setActiveCoachSessionId(null);
    setExtractedThread('');
    setExpandedCoachTrace(null);
    setCoachCopiedId(null);
    setCoachPipelineStep(null);
    setCoachOutcome(null);
    setCoachContactName(null);
    contextPickedInChat.current = false;
    coachRunIds.current = {};
  };

  const coachSource = () => (isSocialTraffic.current ? 'social' : 'organic');

  const refreshFreeUsage = async () => {
    try {
      const response = await fetch('/api/usage', { cache: 'no-store' });
      if (!response.ok) return;
      const data = await response.json();
      if (data.isPro) return;
      if (typeof data.usageCount === 'number') setUsageCount(data.usageCount);
      if (typeof data.remaining === 'number') setRemainingReplies(data.remaining);
      if (typeof data.limit === 'number') setUsageLimit(data.limit);
      setNextFreeAt(typeof data.nextFreeAt === 'string' ? data.nextFreeAt : null);
    } catch {
      // Keep the last known count if the refresh is temporarily unavailable.
    }
  };

  // One "generated" event per Coach answer that contains replies someone could send.
  const logCoachGenerated = (engine: 'fast' | 'verified' | 'deep', replyCount: number): string => {
    const runId = createReplyGenerationId();
    sendReplyLearningEvent({
      event: 'generated',
      generationId: runId,
      replyId: runId,
      context: selectedContext,
      props: { source: coachSource(), mode: 'coach', engine, reply_count: replyCount },
    });
    return runId;
  };

  // Copying a Coach reply is a real choice: it feeds Style DNA and lets us ask whether it worked.
  const copyCoachText = (
    text: string,
    id: string,
    learn?: { msg: StrategyChatMessage; index: number; slot: string; tone: string },
  ) => {
    navigator.clipboard.writeText(text);
    if (navigator.vibrate) navigator.vibrate(30);
    setCoachCopiedId(id);
    setTimeout(() => setCoachCopiedId(null), 2000);
    if (!learn) {
      track('reply_copied', { from: 'coach', id });
      return;
    }
    const runId = learn.msg.generationId || (coachRunIds.current[learn.index] ||= createReplyGenerationId());
    const replyId = replyIdFor(runId, learn.slot);
    if (coachCopiedReplies.current[replyId] !== text) {
      coachCopiedReplies.current[replyId] = text;
      const styleSignals = deriveStyleSignals(text);
      recordLocalStyleSignal(styleSignals, learn.tone, 'copied');
      for (const event of ['selected', 'copied'] as const) {
        sendReplyLearningEvent({
          event,
          generationId: runId,
          replyId,
          tone: learn.tone,
          context: selectedContext,
          styleSignals,
          props: { source: coachSource(), from: 'coach', engine: learn.msg.orchestration ? 'deep' : isPro ? 'verified' : 'fast', slot: learn.slot },
        });
      }
    }
    const lastUserText = [...strategyChatHistory.slice(0, learn.index)].reverse().find(m => m.role === 'user' && m.content)?.content || '';
    savePendingOutcome({ generationId: runId, replyId, tone: learn.tone, context: selectedContext || 'crush', theirMessagePreview: lastUserText });
    setCoachOutcome({ generationId: runId, replyId, tone: learn.tone, context: selectedContext, asked: 'after_copy' });
  };

  const submitTheyReplied = (text: string) => {
    setStrategyChatInput(`They replied: "${text}"`);
    setTheyRepliedForIdx(null);
    setTheyRepliedInput('');
    setTimeout(() => handleStrategyChatSend(), 50);
  };

  const closeTheyReplied = () => {
    setTheyRepliedForIdx(null);
    setTheyRepliedInput('');
  };

  const coachThisDraft = (text: string) => {
    setStrategyChatInput(`I'm thinking of sending this: "${text}" — is this the right move?`);
    setTimeout(() => coachTextareaRef.current?.focus(), 50);
  };

  const reportCoachOutcome = (outcome: ReplyOutcome) => {
    if (!coachOutcome) return;
    sendReplyLearningEvent({
      event: 'outcome_reported',
      generationId: coachOutcome.generationId,
      replyId: coachOutcome.replyId,
      tone: coachOutcome.tone,
      context: coachOutcome.context,
      outcome,
      props: { source: coachSource(), from: 'coach', asked: coachOutcome.asked },
    });
    clearPendingOutcome();
    setCoachOutcome(null);
    if (outcome === 'got_reply') {
      toast({ title: 'Nice. Logged as a win.', description: 'Paste what they said and get your next move.' });
      setStrategyChatInput('They replied: ');
      setTimeout(() => coachTextareaRef.current?.focus(), 50);
    } else if (outcome === 'no_reply') {
      toast({ title: 'Logged. Thanks for telling us.' });
    }
  };

  // Sends one message to Coach and streams the answer into the chat as it is written.
  const requestCoachReply = async (body: Record<string, unknown>, signal?: AbortSignal): Promise<'ok' | 'limit'> => {
    const res = await fetch('/api/strategy-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, stream: true, analytics: getAnalyticsContext(), you: coachProfileInput() }),
      signal,
    });
    if (!res.ok) {
      if (res.status === 429) return 'limit';
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed');
    }

    const withRunId = (draft: CoachDraft | null | undefined) => {
      const count = draft ? [draft.shorter, draft.spicier, draft.softer].filter(Boolean).length : 0;
      return count > 0 ? logCoachGenerated(isPro ? 'verified' : 'fast', count) : undefined;
    };

    if (!res.body || !res.headers.get('content-type')?.includes('ndjson')) {
      const data = await res.json();
      const runId = withRunId(data.draft);
      setStrategyChatHistory(prev => [...prev, { role: 'assistant', content: data.reply, draft: data.draft, generationId: runId }]);
      return 'ok';
    }

    let started = false;
    let finished = false;
    let text = '';
    const write = (patch: Partial<StrategyChatMessage>) => {
      const isFirst = !started;
      started = true;
      setStrategyChatHistory(prev => isFirst
        ? [...prev, { role: 'assistant', content: '', ...patch }]
        : [...prev.slice(0, -1), { ...prev[prev.length - 1], ...patch }]);
    };
    try {
      await readCoachStream(res.body, event => {
        if (event.t === 'delta') {
          text += event.v;
          setCoachStreaming(true);
          write({ content: text });
        } else if (event.t === 'done') {
          finished = true;
          write({ content: event.reply, draft: event.draft, generationId: withRunId(event.draft) });
        }
      });
      if (!finished) throw new Error('Failed');
    } catch (error) {
      // Drop the half-written answer so the caller can restore the person's message for a retry.
      if (started) setStrategyChatHistory(prev => prev.slice(0, -1));
      throw error;
    } finally {
      setCoachStreaming(false);
    }
    return 'ok';
  };


  const handleCoachScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    void processCoachScreenshots(Array.from(e.target.files || []));
  };

  // Screenshots can arrive from the file picker, a paste, or a drop onto the Coach card.
  const processCoachScreenshots = async (incoming: File[]) => {
    const files = incoming.filter(file => file.type.startsWith('image/')).slice(0, 6);
    if (!files.length || coachScreenshotExtracting || strategyChatLoading) return;
    setCoachScreenshotExtracting(true);
    try {
      // Downsize each screenshot first: full-size phone screenshots are too big
      // for the extraction request, and the same image feeds the thumbnail.
      const fileData = await Promise.all(files.map(file => compressImage(file)));

      // Add a user message with image thumbnails immediately (no text — thumbnail is enough)
      const imageUrls = fileData.map(b64 => b64);
      setStrategyChatHistory(prev => [...prev, {
        role: 'user',
        content: '',
        images: imageUrls,
      }]);

      // Extract text from each screenshot
      const results = await Promise.all(fileData.map(async (base64) => {
        const res = await fetch('/api/extract-text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64 }),
        });
        const data = await res.json();
        return {
          text: (data.full_conversation as string | null) || null,
          contact: typeof data.contact_name === 'string' ? data.contact_name : null,
          relationship: typeof data.relationship === 'string' ? data.relationship as ContextType : null,
        };
      }));
      const extracted = results.map(r => r.text).filter((text): text is string => Boolean(text));

      // Fill in who this is with, unless they already chose it in this chat.
      const contact = results.find(r => r.contact)?.contact;
      if (contact) setCoachContactName(contact);
      const detected = results.find(r => r.relationship)?.relationship;
      if (detected && !contextPickedInChat.current && detected !== selectedContext) {
        setSelectedContext(detected);
        track('context_selected', { context: detected, source: 'detected' });
      }

      if (extracted.length > 0) {
        setStrategyChatLoading(true);
        const threadText = extracted.join('\n\n');
        setExtractedThread(threadText);
        // Attach the conversation to the screenshot message so a saved chat keeps it.
        setStrategyChatHistory(prev => {
          const index = prev.map(m => Boolean(m.images?.length && !m.threadText)).lastIndexOf(true);
          if (index < 0) return prev;
          const next = [...prev];
          next[index] = { ...next[index], threadText };
          return next;
        });

        // Build rich history for context
        const richHistory = strategyChatHistory.map((m) => {
          if (m.role === 'assistant' && m.orchestration) {
            const o = m.orchestration;
            const parts = [];
            if (o.strategy?.move?.one_liner) parts.push(`Strategy: "${o.strategy.move.one_liner}"`);
            if (o.winner?.text) parts.push(`Winner (${o.winner.style}): "${o.winner.text}"`);
            if (o.backup?.text) parts.push(`Backup (${o.backup.style}): "${o.backup.text}"`);
            return { role: m.role, content: parts.join('\n') || 'Analyzed the conversation.' };
          }
          if (m.role === 'assistant' && m.draft) {
            const d = m.draft;
            const draftText = [d.shorter ? `Shorter: "${d.shorter}"` : null, d.spicier ? `Spicier: "${d.spicier}"` : null, d.softer ? `Softer: "${d.softer}"` : null].filter(Boolean).join(', ');
            return { role: m.role, content: `${m.content}\nDrafts: ${draftText}` };
          }
          if (m.role === 'user' && m.images && !m.content) return { role: m.role, content: '[Uploaded screenshot]' };
          return { role: m.role, content: m.content || '[empty]' };
        });

        try {
          if (isPro) {
            // Pro: Full X2 orchestrate pipeline — 6 candidates, scored, strategy breakdown
            setCoachPipelineStep('analyzing');
            const stepTimer = setTimeout(() => setCoachPipelineStep('generating'), 3000);
            const stepTimer2 = setTimeout(() => setCoachPipelineStep('scoring'), 8000);

            const isNewConvo = strategyChatHistory.some((m) => m.orchestration || m.draft);
            const res = await fetch('/api/x2/orchestrate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userMessage: isNewConvo
                  ? 'New screenshot uploaded — might be a different conversation. Analyze it.'
                  : 'Analyze this conversation from the screenshot',
                threadText,
                chatHistory: richHistory,
                goal: 'general',
                relationshipContext: selectedContext || 'not specified',
                mode: 'orchestrate',
                analytics: getAnalyticsContext(),
                you: coachProfileInput(),
              }),
            });
            clearTimeout(stepTimer);
            clearTimeout(stepTimer2);

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed');

            if (data.mode === 'orchestrate') {
              const runId = logCoachGenerated('deep', data.candidates?.length || 0);
              setStrategyChatHistory(prev => [...prev, { role: 'assistant', content: '', orchestration: data, generationId: runId }]);
              // Also update strategyData for the rest of the app
              if (data.strategy) {
                setStrategyData({
                  momentum: data.strategy.momentum,
                  balance: data.strategy.balance,
                  move: data.strategy.move,
                  latencyMs: data.latency?.total || 0,
                });
              }
            } else {
              const runId = data.draft ? logCoachGenerated('deep', Object.values(data.draft).filter(Boolean).length) : undefined;
              setStrategyChatHistory(prev => [...prev, { role: 'assistant', content: data.reply, draft: data.draft, generationId: runId }]);
            }
          } else {
            // Free: Use strategy-chat (single coach call)
            const contextMsg = extracted.length === 1
              ? `Here's the conversation from the screenshot:\n${extracted[0]}`
              : `Here's the conversation from ${extracted.length} screenshots:\n${extracted.map((t: string, i: number) => `[Screenshot ${i + 1}]\n${t}`).join('\n\n')}`;
            // The conversation is in the message itself; follow-ups get it as context.
            const result = await requestCoachReply({
              threadContext: '',
              strategy: strategyData,
              context: selectedContext || 'crush',
              chatHistory: richHistory,
              userMessage: contextMsg,
            });
            if (result === 'limit') {
              setShowPaywall(true);
              setStrategyChatHistory(prev => prev.slice(0, -1));
              return;
            }
          }
        } catch (err: any) {
          const msg = err?.message || '';
          if (msg.includes('401') || msg.toLowerCase().includes('auth')) {
            setStrategyChatHistory(prev => [...prev, { role: 'assistant', content: "Sign in to get coaching on your screenshots. It's free." }]);
          } else if (msg.includes('403')) {
            setStrategyChatHistory(prev => [...prev, { role: 'assistant', content: "Upgrade to Pro to unlock Deep Analysis — 6 scored candidates, winner badge, full strategy breakdown." }]);
          } else {
            setStrategyChatHistory(prev => [...prev, { role: 'assistant', content: "Couldn't analyze the screenshot right now. Try again or paste the conversation text." }]);
          }
        } finally {
          setStrategyChatLoading(false);
          setCoachPipelineStep(null);
          if (!isPro) void refreshFreeUsage();
        }
      } else {
        toast({ title: "Couldn't read that screenshot", description: 'Try a clearer one, or paste the messages.', variant: 'destructive' });
        // Remove the image message since extraction failed
        setStrategyChatHistory(prev => prev.slice(0, -1));
      }
    } catch {
      toast({ title: "Couldn't upload that", description: 'Try again.', variant: 'destructive' });
    } finally {
      setCoachScreenshotExtracting(false);
      if (coachFileInputRef.current) coachFileInputRef.current.value = '';
    }
  };

  const handleCoachRegenerate = () => {
    if (strategyChatLoading) return;
    const lastUser = [...strategyChatHistory].reverse().find(m => m.role === 'user');
    if (!lastUser) return;
    setStrategyChatHistory(prev => {
      const last = [...prev];
      while (last.length && last[last.length - 1].role === 'assistant') last.pop();
      return last;
    });
    handleStrategyChatSendWithMsg(lastUser.content);
  };

  // Clearing starts a genuinely new chat: a new saved session, no leftover screenshot or read.
  const clearCoachChat = () => handleNewThread();

  const handleStrategyChatSend = async () => {
    if (!strategyChatInput.trim() || strategyChatLoading) return;
    const userMsg = strategyChatInput.trim();
    setStrategyChatInput('');
    handleStrategyChatSendWithMsg(userMsg);
  };

  const handleStrategyChatSendWithMsg = async (userMsg: string) => {
    if (!userMsg.trim() || strategyChatLoading) return;
    setStrategyChatHistory(prev => [...prev, { role: 'user' as const, content: userMsg }]);
    setStrategyChatLoading(true);
    setTheyRepliedForIdx(null);
    setTheyRepliedInput('');

    const controller = new AbortController();
    // Keep the client ceiling just below the route's 60s Vercel budget.
    const timeout = setTimeout(() => controller.abort(), 55000);

    // Build rich chat history — include what the coach actually suggested
    const richHistory = strategyChatHistory.map((m) => {
      if (m.role === 'assistant' && m.orchestration) {
        const o = m.orchestration;
        const parts = [];
        if (o.strategy?.move?.one_liner) parts.push(`Strategy: "${o.strategy.move.one_liner}"`);
        if (o.winner?.text) parts.push(`Winner (${o.winner.style}): "${o.winner.text}"`);
        if (o.backup?.text) parts.push(`Backup (${o.backup.style}): "${o.backup.text}"`);
        if (o.candidates?.length) {
          const others = o.candidates
            .filter((c: Candidate) => c.text !== o.winner?.text && c.text !== o.backup?.text)
            .map((c: Candidate) => `${c.style}: "${c.text}"`)
            .join(', ');
          if (others) parts.push(`Other options: ${others}`);
        }
        return { role: m.role, content: parts.join('\n') || 'Analyzed the conversation.' };
      }
      if (m.role === 'assistant' && m.draft) {
        const d = m.draft;
        const draftText = [d.shorter ? `Shorter: "${d.shorter}"` : null, d.spicier ? `Spicier: "${d.spicier}"` : null, d.softer ? `Softer: "${d.softer}"` : null].filter(Boolean).join(', ');
        return { role: m.role, content: `${m.content}\nDrafts suggested: ${draftText}` };
      }
      if (m.role === 'user' && m.images && !m.content) return { role: m.role, content: '[Uploaded screenshot]' };
      return { role: m.role, content: m.content || '[empty]' };
    });

    try {
      // Pro + has extracted thread from screenshot → use orchestrate for follow-ups
      if (isPro && extractedThread) {
        const res = await fetch('/api/x2/orchestrate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userMessage: userMsg,
            threadText: extractedThread,
            chatHistory: richHistory,
            goal: 'general',
            relationshipContext: selectedContext || 'not specified',
            mode: 'chat',
            analytics: getAnalyticsContext(),
            you: coachProfileInput(),
          }),
          signal: controller.signal,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed');
        if (data.mode === 'orchestrate') {
          const runId = logCoachGenerated('deep', data.candidates?.length || 0);
          setStrategyChatHistory(prev => [...prev, { role: 'assistant', content: '', orchestration: data, generationId: runId }]);
          if (data.strategy) {
            setStrategyData({
              momentum: data.strategy.momentum,
              balance: data.strategy.balance,
              move: data.strategy.move,
              latencyMs: data.latency?.total || 0,
            });
          }
        } else {
          const runId = data.draft ? logCoachGenerated('deep', Object.values(data.draft).filter(Boolean).length) : undefined;
          setStrategyChatHistory(prev => [...prev, { role: 'assistant', content: data.reply, draft: data.draft, generationId: runId }]);
        }
      } else {
        // Free users or no thread — use strategy-chat
        const result = await requestCoachReply({
          threadContext: extractedThread,
          strategy: strategyData,
          context: selectedContext || 'crush',
          chatHistory: richHistory,
          userMessage: userMsg,
        }, controller.signal);
        if (result === 'limit') {
          setShowPaywall(true);
          setStrategyChatHistory(prev => prev.slice(0, -1));
          setStrategyChatInput(userMsg);
          return;
        }
      }
    } catch (err: any) {
      const isTimeout = err?.name === 'AbortError';
      toast({
        title: isTimeout ? 'Coach timed out' : 'Coach unavailable',
        description: 'Tap to retry your message',
        variant: 'destructive',
      });
      setStrategyChatHistory(prev => prev.slice(0, -1));
      setStrategyChatInput(userMsg);
    } finally {
      clearTimeout(timeout);
      setStrategyChatLoading(false);
      if (!isPro) void refreshFreeUsage();
    }
  };

  useEffect(() => {
    if (!coachAutoSend) return;
    setCoachAutoSend(null);
    void handleStrategyChatSendWithMsg(coachAutoSend);
    // Runs once per queued message; the handler reads current state when called.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coachAutoSend]);



  // Handle Stripe checkout
  const handleCheckout = async (plan: 'monthly' | 'weekly' | 'annual') => {
    const source = isSocialTraffic.current ? 'social' : 'organic';
    track('upgrade_clicked', { plan, source, from: 'app_paywall' });
    // Require login before checkout
    if (!userId) {
      track('signup_started', { from: 'paywall', plan, source });
      // Carry the chat through sign-up so they come straight back to it, on the plan they picked.
      const choice = plan === 'monthly' ? 'monthly' : 'annual';
      savePendingCoach({
        messages: strategyChatHistory.map(serializeCoachMessage),
        threadText: extractedThread,
        context: selectedContext,
        input: strategyChatInput,
        plan: choice,
      });
      const loginParams = new URLSearchParams({
        mode: 'signup',
        redirect: resumePath(choice),
        plan,
      });
      try {
        const attr = captureAttribution();
        ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'video_id', 'src']
          .forEach((key) => {
            const value = attr[key];
            if (typeof value === 'string' && value) loginParams.set(key, value);
          });
      } catch {}
      window.location.href = `/login?${loginParams.toString()}`;
      return;
    }
    track('checkout_started', { plan, source, from: 'app_paywall' });
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, analytics: { attribution: captureAttribution() } }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.alreadySubscribed) {
        // Already subscribed: plan changes happen in the billing portal.
        window.location.href = '/billing';
      } else {
        track('checkout_failed', { plan, source, from: 'app_paywall', reason: data.error || 'missing_url' });
        toast({
          title: 'Error',
          description: 'Failed to start checkout',
          variant: 'destructive',
        });
      }
    } catch (error) {
      track('checkout_failed', { plan, source, from: 'app_paywall', reason: 'network_error' });
      toast({
        title: 'Error',
        description: 'Something went wrong',
        variant: 'destructive',
      });
    }
  };


  // VPN Abuse Block Modal
  if (vpnBlocked) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-panel border border-line rounded-3xl overflow-hidden">
          <CardContent className="p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto">
              <Shield className="h-8 w-8 text-white" aria-hidden />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-cream mb-2">Unusual Activity Detected</h2>
              <p className="text-sage">We noticed multiple connections from different locations.</p>
              <p className="text-sm text-sage/70 mt-2">This can happen with VPNs or shared networks.</p>
            </div>
            <div className="space-y-3">
              <Button 
                onClick={() => handleCheckout('monthly')}
                className="w-full h-14 bg-brand text-brand-ink font-bold text-lg rounded-2xl"
              >
                Unlock Pro - {PLAN_PRICES.monthly.displayAmount}/month
              </Button>
              <p className="text-xs text-sage/80">Pro users get unlimited access from anywhere</p>
            </div>
            <button onClick={() => setVpnBlocked(false)} className="text-sm text-sage/70 hover:text-sage">
              Try again later
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ShareReplyContext.Provider value={shareCoachReply}>
    <UpgradeSheet
      open={showPaywall}
      trigger={upgradeTrigger}
      initialPlan={upgradePlan}
      usageLimit={usageLimit}
      nextFreeAt={nextFreeAt}
      signedIn={Boolean(userId)}
      onCheckout={handleCheckout}
      onClose={() => { setShowPaywall(false); setUpgradeTrigger('free_limit'); }}
    />
    {shotViewer && (
      <ScreenshotViewer
        images={shotViewer.images}
        index={shotViewer.index}
        onIndexChange={(index) => setShotViewer(viewer => viewer && { ...viewer, index })}
        onClose={() => setShotViewer(null)}
      />
    )}
    <div className="min-h-screen bg-ink relative overflow-hidden">
      {/* Ambient background mesh */}
      <div className="fixed inset-0 pointer-events-none hidden md:block">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-brand/8 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-brand/8 blur-[120px]" />
        <div className="absolute top-[40%] left-[50%] w-[40%] h-[40%] rounded-full bg-brand/5 blur-[100px]" />
      </div>
      <div className="fixed inset-0 pointer-events-none md:hidden">
        <div className="absolute top-[-10%] left-[-5%] w-[50%] h-[50%] rounded-full bg-brand/6 blur-[80px]" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[40%] h-[40%] rounded-full bg-brand/6 blur-[80px]" />
      </div>

      <div className={`relative z-10 mx-auto px-5 pt-safe-6 py-6 pb-[max(3.5rem,env(safe-area-inset-bottom,3.5rem))] lg:pb-3 max-w-lg md:max-w-3xl lg:max-w-6xl xl:max-w-[88rem] ${usageCount > 0 && !isPro ? 'pt-20' : ''}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3 sm:mb-6">
          {/* Coach is home: signed-in people get no back button, visitors can return to the homepage. */}
          {userId ? <div className="w-10 h-10" aria-hidden="true" /> : (
            <Link href="/" aria-label="Back to the homepage" className="w-10 h-10 rounded-2xl bg-white/[0.08] border border-white/[0.12] flex items-center justify-center hover:bg-white/15 transition-all active:scale-90">
              <ArrowLeft className="h-5 w-5 text-sage" />
            </Link>
          )}
          <Link href="/" className="transition-transform hover:scale-105">
            <Logo size="sm" showText={true} />
          </Link>
          {/* On phones the tab bar carries Chats and Account; the header repeats them only on wider screens. */}
          <div className="flex items-center gap-2">
            {userId && (
              <Link href="/history" className="hidden md:flex h-10 items-center gap-2 px-3.5 rounded-2xl bg-white/[0.08] border border-white/[0.12] text-sm font-semibold text-sage hover:bg-white/15 hover:text-cream transition-all active:scale-95">
                <Clock className="h-4 w-4" /> Chats
              </Link>
            )}
            <Link href={userId ? '/profile' : '/login'} aria-label={userId ? 'Account' : 'Sign in'} className={`w-10 h-10 rounded-2xl bg-white/[0.08] border border-white/[0.12] items-center justify-center hover:bg-white/15 transition-all active:scale-90 ${userId ? 'hidden md:flex' : 'flex'}`}>
              <User className="h-5 w-5 text-sage" />
            </Link>
            {userId && <div className="w-10 h-10 md:hidden" aria-hidden="true" />}
          </div>
        </div>

        {/* Trial Banner - shows for invite/beta trial users */}
        {isPro && trialDaysLeft !== null && (
          <div className={`mb-4 p-4 rounded-2xl backdrop-blur border transition-all duration-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
            trialDaysLeft <= 1 
              ? 'bg-gradient-to-r from-red-500/20 to-orange-500/20 border-red-500/30'
              : trialDaysLeft <= 3
                ? 'bg-gradient-to-r from-orange-500/20 to-yellow-500/20 border-orange-500/30'
                : 'bg-brand/10 border-brand/30'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                trialDaysLeft <= 1 ? 'bg-red-500' : trialDaysLeft <= 3 ? 'bg-orange-500' : 'bg-brand'
              }`}>
                <Sparkles className={`h-4 w-4 ${trialDaysLeft > 3 ? 'text-brand-ink' : 'text-cream'}`} />
              </div>
              <div>
                <p className="text-cream font-bold text-sm">
                  {trialDaysLeft <= 0 
                    ? 'Your free trial expires today!' 
                    : trialDaysLeft === 1 
                      ? '1 day left on your free trial' 
                      : `${trialDaysLeft} days left on your free trial`}
                </p>
                <p className="text-sage text-xs">Unlimited replies with Deep Analysis</p>
              </div>
            </div>
            {trialDaysLeft <= 3 && (
              <Button asChild size="sm" className="bg-white/10 hover:bg-white/20 text-cream font-bold rounded-xl text-xs">
                <Link href="/pricing">Keep Pro</Link>
              </Button>
            )}
          </div>
        )}

        {/* Pro Status Badge removed — V2 On button in Coach header serves this purpose */}

        {/* Usage Bar - Hidden for Pro users */}
        {usageCount > 0 && !isPro && (
          <div className={`fixed top-0 left-0 right-0 z-50 text-cream animate-in slide-in-from-top duration-300 ${
            usageCount >= usageLimit 
              ? 'bg-[#1a0a0f] border-b border-red-500/30' 
              : 'bg-panel border-b border-brand/20'
          }`}>
            <div className="mx-auto px-5 py-2.5">
              <div className="flex items-center justify-between max-w-2xl mx-auto">
                <div className="flex items-center gap-2.5">
                  <div>
                    <p className="text-sm font-bold">
                      {usageCount >= usageLimit 
                        ? 'Free limit reached' 
                        : `${remainingReplies} free ${remainingReplies === 1 ? 'use' : 'uses'} left in your 24-hour window`}
                    </p>
                    <p className="text-xs text-sage">
                      {Math.min(usageCount, usageLimit)}/{usageLimit} used
                    </p>
                  </div>
                </div>
                {usageCount >= usageLimit - 1 && (
                  <Button 
                    asChild
                    size="sm" 
                    className="bg-white/10 border border-white/20 text-cream hover:bg-white/20 font-bold rounded-xl text-xs h-8"
                  >
                    <Link href="/#pricing">Upgrade</Link>
                  </Button>
                )}
                {usageCount < usageLimit - 1 && (
                  <div className="flex gap-1">
                    {Array.from({ length: usageLimit }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full transition-all ${
                          i < usageCount ? 'bg-white/80' : 'bg-white/25'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Coach's screenshot picker. */}
        <input ref={coachFileInputRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp" multiple onChange={handleCoachScreenshotUpload} className="hidden" />

        {/* ── COACH SECTION — Apple iMessage pattern: header / scrollable content / pinned input ──
            On large screens this becomes a split view: a saved-conversations sidebar on the
            left and the Coach card on the right. The wrapper's height is measured at runtime
            (see coachCardRef effect); the calc() is the pre-hydration fallback. */}
        <div ref={coachCardRef} className="flex gap-4" style={{ height: 'calc(100dvh - 14.5rem - var(--kb-inset, 0px))' }}>
          {/* ── Saved conversations sidebar — desktop only (mobile keeps the in-card flow) ── */}
          <aside className="hidden lg:flex lg:flex-col w-72 shrink-0 h-full rounded-3xl bg-white/[0.04] border border-white/[0.08] overflow-hidden">
            <div className="shrink-0 flex items-center justify-between px-4 pt-5 pb-3 border-b border-white/[0.06]">
              <span className="text-sage text-xs font-bold uppercase tracking-widest">Conversations</span>
              <button
                onClick={handleNewThread}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/[0.06] border border-white/[0.10] text-sage hover:bg-white/[0.12] hover:text-cream text-xs font-bold transition-all active:scale-95"
              >
                <Plus className="h-3 w-3" /> New
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-2 py-2 min-h-0">
              <ConversationList threads={savedThreads} userId={userId} isThreadActive={(id) => activeCoachSessionId === id} onLoad={handleLoadThread} onDelete={handleDeleteThread} />
            </div>
            {/* Plan and shortcuts — the desktop stand-in for the phone tab bar */}
            <div className="shrink-0 border-t border-white/[0.06] p-3 space-y-2">
              {!userId ? (
                <Link href={`/login?mode=signup&redirect=${encodeURIComponent('/app')}`} className="flex h-10 items-center justify-center rounded-xl bg-brand text-xs font-bold text-brand-ink hover:bg-brand-soft transition-colors">Create a free account</Link>
              ) : isPro ? (
                <div className="flex items-center gap-2 rounded-xl border border-brand/20 bg-brand/10 px-3 py-2.5">
                  <Crown className="h-4 w-4 text-brand" />
                  <span className="text-xs font-bold text-brand">Pro</span>
                  <span className="text-xs text-sage">Unlimited replies</span>
                </div>
              ) : (
                <Link href="/pricing?src=coach_sidebar" className="group flex items-center justify-between gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 hover:border-brand/30 transition-colors">
                  <span className="text-xs text-sage"><span className="font-bold text-cream">{Math.max(0, remainingReplies)} of {usageLimit}</span> free replies left</span>
                  <span className="text-xs font-bold text-brand group-hover:underline">Go unlimited</span>
                </Link>
              )}
              {userId && (
                <div className="grid grid-cols-2 gap-1">
                  <Link href="/history" className="flex flex-col items-center gap-1 rounded-xl py-2 text-xs font-semibold text-sage hover:bg-white/[0.06] hover:text-cream transition-colors"><Clock className="h-4 w-4" />Chats</Link>
                  <Link href="/profile" className="flex flex-col items-center gap-1 rounded-xl py-2 text-xs font-semibold text-sage hover:bg-white/[0.06] hover:text-cream transition-colors"><User className="h-4 w-4" />Account</Link>
                </div>
              )}
            </div>
          </aside>

          {/* ── Coach card ── */}
          <div
            className={`relative flex-1 min-w-0 h-full rounded-3xl bg-white/[0.04] border overflow-hidden flex flex-col transition-colors ${coachDragActive ? 'border-brand/60' : 'border-white/[0.08]'}`}
            onDragOver={(e) => { if (e.dataTransfer.types.includes('Files')) { e.preventDefault(); setCoachDragActive(true); } }}
            onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setCoachDragActive(false); }}
            onDrop={(e) => {
              if (!e.dataTransfer.types.includes('Files')) return;
              e.preventDefault();
              setCoachDragActive(false);
              void processCoachScreenshots(Array.from(e.dataTransfer.files));
            }}
          >
          {coachDragActive && (
            <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-ink/85 text-center">
              <Camera className="h-8 w-8 text-brand" />
              <p className="text-base font-bold text-cream">Drop your screenshot</p>
              <p className="text-sm text-sage">Coach will read the conversation for you</p>
            </div>
          )}
          {/* ─ Header — always visible, compact, personalized ─ */}
          <div className="shrink-0 pt-3 sm:pt-5 pb-3 px-4 sm:px-6 border-b border-white/[0.06]">
            <div className="flex items-center justify-between gap-2 mb-1">
              <h2 className="text-xl font-bold text-cream flex items-center gap-2">
                {userName ? (
                  <div className="w-7 h-7 rounded-lg bg-brand flex items-center justify-center text-[13px] font-black text-brand-ink shadow-sm shadow-brand/30">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                ) : (
                  <Sparkles className="h-5 w-5 text-brand" />
                )}
                Coach
              </h2>
              <div className="flex items-center gap-2">
              <button
                onClick={() => { fetchThreads(); setShowCoachThreads(true); }}
                className="lg:hidden flex min-h-11 items-center gap-1.5 px-3.5 rounded-xl text-[13px] font-bold border bg-white/[0.06] border-white/[0.12] text-sage hover:bg-white/[0.12] transition-all active:scale-95"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                Chats{savedThreads.length > 0 ? ` (${savedThreads.length})` : ''}
              </button>
              </div>
            </div>
            <p className={`text-sm text-sage/70 ${strategyChatHistory.length > 0 ? 'hidden sm:block' : ''}`}>
              {userName ? `What's up ${userName.split(' ')[0]}? ` : ''}Drop a screenshot, paste, or pick a scenario
            </p>

            {/* Strategy Status Indicator — only visible when Coach has strategy data */}
            {strategyData && (
              <div className="flex xl:hidden items-center gap-3 mt-3 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] animate-in fade-in slide-in-from-top-1 duration-300">
                {(() => {
                  const sd = strategyData;
                  const momentumColor =
                    sd.momentum === 'Rising' ? 'bg-emerald-400 shadow-emerald-400/40 shadow-sm' :
                    (sd.momentum === 'Declining' || sd.momentum === 'Stalling') ? 'bg-red-400 shadow-red-400/40 shadow-sm' :
                    'bg-amber-400 shadow-amber-400/40 shadow-sm';
                  const balanceColor =
                    (sd.balance === 'Balanced' || sd.balance === 'You lead') ? 'bg-emerald-400 shadow-emerald-400/40 shadow-sm' :
                    sd.balance === 'They lead' ? 'bg-amber-400 shadow-amber-400/40 shadow-sm' :
                    'bg-white/20';
                  const energyColor =
                    sd.move.energy === 'escalate' ? 'bg-emerald-400 shadow-emerald-400/40 shadow-sm' :
                    sd.move.energy === 'pull_back' ? 'bg-red-400 shadow-red-400/40 shadow-sm' :
                    sd.move.energy === 'match' ? 'bg-amber-400 shadow-amber-400/40 shadow-sm' :
                    'bg-white/20';
                  return (
                    <>
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full transition-all duration-500 ${momentumColor}`} />
                        <span className="text-xs font-bold uppercase tracking-wider text-sage">{sd.momentum}</span>
                      </div>
                      <div className="w-px h-3 bg-white/[0.08]" />
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full transition-all duration-500 ${balanceColor}`} />
                        <span className="text-xs font-bold uppercase tracking-wider text-sage">{sd.balance}</span>
                      </div>
                      <div className="w-px h-3 bg-white/[0.08]" />
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full transition-all duration-500 ${energyColor}`} />
                        <span className="text-xs font-bold uppercase tracking-wider text-sage">{sd.move.energy.replace('_', ' ')}</span>
                      </div>
                      {sd.move.risk && sd.move.risk !== 'low' && (
                        <>
                          <div className="w-px h-3 bg-white/[0.08]" />
                          <span className={`text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            sd.move.risk === 'high' ? 'bg-red-500/15 text-red-400' : 'bg-amber-500/15 text-amber-400'
                          }`}>{sd.move.risk} risk</span>
                        </>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </div>

          {/* ─ Scrollable content — chips OR chat history ─ */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-3 min-h-0">
            {/* Contextual hint — inside card so it doesn't push card below safe area */}
            <ContextualHints
              screenshotUsed={strategyChatHistory.some(m => (m.images?.length ?? 0) > 0)}
              onAction={(hintId) => {
                if (hintId === 'screenshot') coachFileInputRef.current?.click();
              }}
            />

            {/* ── Start here — entry-point cards (empty state) ── */}
            {!loadingSession && strategyChatHistory.length === 0 && (
              <CoachEntryCards
                threads={savedThreads}
                highlightUpload={highlightUpload}
                onUpload={() => { setHighlightUpload(false); coachFileInputRef.current?.click(); }}
                onPaste={() => { setStrategyChatInput('Help me reply to this: '); setTimeout(() => coachTextareaRef.current?.focus(), 50); }}
                onLoadThread={handleLoadThread}
              />
            )}

            {/* Loading session overlay */}
            {loadingSession && (
              <div className="flex items-center justify-center py-16">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-brand" />
                  <span className="text-sm text-sage/70 font-medium">Loading session...</span>
                </div>
              </div>
            )}

            {/* Scenario chips — only when no chat history */}
            {!loadingSession && strategyChatHistory.length === 0 && (() => {
              const h = new Date().getHours();
              const isEvening = h >= 18 || h < 5;
              const isWeekend = [0, 5, 6].includes(new Date().getDay());
              const hasThread = savedThreads.length > 0;
              const threadName = hasThread ? savedThreads[0]?.name?.split(' ').slice(0, 2).join(' ') : '';
              const cat = getContextCategory(selectedContext);
              const chips = cat === 'professional' ? [
                { label: 'Draft the message', sub: 'Clear ask, right tone', prompt: 'Help me write a professional message', glow: true },
                { label: 'Follow up', sub: 'Without being pushy', prompt: 'How do I follow up on this without looking desperate?', glow: false },
                { label: 'Push back', sub: 'Professionally', prompt: 'Help me disagree or push back on this professionally', glow: false },
                { label: 'Decode this', sub: 'What do they actually mean?', prompt: 'Decode this work message for me — what are they really saying?', glow: false },
                { label: 'Make it shorter', sub: 'Cut the fluff', prompt: 'Make this message shorter and more direct', glow: false },
                { label: 'Nail the tone', sub: 'Calibrate for your audience', prompt: 'Is this the right tone for my boss / coworker?', glow: false },
              ] : cat === 'platonic' ? [
                { label: 'Reach back out', sub: hasThread ? `Reconnect with ${threadName}` : 'Without making it weird', prompt: "Help me reach back out to a friend I haven't talked to in a while", glow: hasThread },
                { label: "What'd they say?", sub: 'Craft the right reply', prompt: 'Help me reply to this message', glow: false },
                { label: 'Decode this', sub: 'Read between the lines', prompt: 'Decode their message for me — what does it really mean?', glow: false },
                { label: 'Fix the awkward', sub: 'Address it and move on', prompt: 'Help me address an awkward situation with my friend', glow: false },
                { label: 'Check in', sub: 'Warm but not intense', prompt: 'Write me a genuine check-in message — warm but no pressure', glow: isWeekend },
                { label: 'Read the situation', sub: 'Where do things stand?', prompt: 'Read this conversation and tell me where things stand with my friend', glow: false },
              ] : [
                { label: "What'd they say?", sub: hasThread ? `Reply to ${threadName}` : 'Craft the perfect reply', prompt: 'Help me reply to this message', glow: hasThread },
                { label: 'Decode this', sub: hasThread ? `Decode ${threadName}'s message` : 'Read between the lines', prompt: 'Decode their message for me', glow: false },
                { label: isEvening ? 'Flirty opener' : 'Start the convo', sub: isEvening ? 'Prime time to move' : 'Break the ice', prompt: isEvening ? 'Write me a flirty opener for tonight' : 'Write me a great opener', glow: isEvening },
                { label: 'Revive dead chat', sub: isWeekend ? 'Weekend = perfect timing' : 'Bring it back', prompt: 'Help me revive a dead conversation', glow: isWeekend },
                { label: 'Am I being played?', sub: 'Get an honest read', prompt: 'Am I being played or are they genuinely interested?', glow: false },
                { label: 'Read the situation', sub: 'Full vibe analysis', prompt: 'Read this convo and tell me where I stand', glow: false },
              ];
              return (
                <>
                <p className="text-xs text-sage/70 font-bold uppercase tracking-wider mb-2 px-1">
                  Or ask Coach
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {chips.slice(0, 4).map(chip => (
                    <button
                      key={chip.label}
                      onClick={() => setStrategyChatInput(chip.prompt)}
                      className={`px-3 py-2.5 rounded-xl text-left transition-all active:scale-95 border ${
                        chip.glow
                          ? 'bg-brand/[0.10] border-brand/25 hover:bg-brand/[0.18] hover:border-brand/40 shadow-sm shadow-brand/10'
                          : 'bg-white/[0.07] border-white/[0.12] hover:bg-white/[0.12]'
                      }`}
                    >
                      <p className="text-xs font-semibold text-sage leading-snug">
                        {chip.label}
                      </p>
                      <p className="text-xs text-sage mt-0.5 leading-tight">{chip.sub}</p>
                    </button>
                  ))}
                </div>
                </>
              );
            })()}

            {/* Chat history */}
            {!loadingSession && strategyChatHistory.length > 0 && (
              <div className="space-y-4">
                {strategyChatHistory.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                    <div className={`${msg.orchestration || msg.draft ? 'w-full min-w-0 sm:w-auto sm:max-w-[90%]' : 'max-w-[90%]'} lg:max-w-[80%] flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                      {/* Inline image thumbnails */}
                      {msg.images && msg.images.length > 0 && (
                        <div className={`flex gap-2 flex-wrap ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in zoom-in-95 duration-500`}>
                          {msg.images.map((img, imgIdx) => (
                            <button
                              key={imgIdx}
                              type="button"
                              onClick={() => setShotViewer({ images: msg.images!, index: imgIdx })}
                              aria-label={`View screenshot ${imgIdx + 1} full size`}
                              className="group relative block rounded-2xl overflow-hidden border border-white/[0.10] shadow-xl shadow-black/40 max-w-[180px] hover:border-brand/40 transition-all active:scale-[0.98]"
                            >
                              <img src={img} alt={`Screenshot ${imgIdx + 1}`} loading="lazy" decoding="async" className="w-full h-auto max-h-[240px] object-cover object-top" />
                              <span className="absolute bottom-1.5 right-1.5 flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-xs font-semibold text-cream">
                                <Maximize2 className="h-3 w-3" /> View
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                      {/* Message bubble — skip if empty (orchestration-only messages) */}
                      {msg.content && (
                        <div className={`px-4 py-3 rounded-2xl text-[14px] lg:text-[15px] leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-brand text-brand-ink rounded-br-md shadow-md shadow-brand/20'
                            : 'bg-white/[0.07] text-cream border border-white/[0.08] rounded-bl-md'
                        }`}>
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      )}

                      {/* ── Orchestration results (full pipeline — Pro) ── */}
                      {msg.orchestration && (
                        <CoachOrchestrationResult
                          orch={msg.orchestration} msg={msg} index={i}
                          copiedId={coachCopiedId}
                          expanded={expandedCoachTrace === i}
                          onToggleExpand={() => setExpandedCoachTrace(expandedCoachTrace === i ? null : i)}
                          onCopy={copyCoachText}
                          onQuickCopyDone={() => setTheyRepliedForIdx(i)}
                          theyRepliedOpen={theyRepliedForIdx === i && i === strategyChatHistory.length - 1}
                          theyRepliedInput={theyRepliedInput}
                          onTheyRepliedInput={setTheyRepliedInput}
                          onTheyRepliedSubmit={submitTheyReplied}
                          onTheyRepliedClose={closeTheyReplied}
                        />
                      )}

                      {/* Re-generate button — last assistant message only */}
                      {msg.role === 'assistant' && i === strategyChatHistory.length - 1 && (
                        <button
                          onClick={handleCoachRegenerate}
                          disabled={strategyChatLoading}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-sage hover:text-sage hover:bg-white/[0.05] border border-transparent hover:border-white/[0.08] transition-all disabled:opacity-30"
                        >
                          <RefreshCw className="h-3 w-3" />
                          Re-generate
                        </button>
                      )}

                      {/* Strategy badges — only for non-orchestration coach responses */}
                      {msg.role === 'assistant' && !msg.orchestration && strategyData && i === strategyChatHistory.length - 1 && (
                        <div className="flex xl:hidden flex-wrap gap-1.5 px-1">
                          <span className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                            strategyData.momentum === 'Rising' ? 'bg-emerald-500/15 text-emerald-400' :
                            strategyData.momentum === 'Declining' || strategyData.momentum === 'Stalling' ? 'bg-red-500/15 text-red-400' :
                            'bg-white/[0.08] text-sage'
                          }`}>
                            {strategyData.momentum === 'Rising' ? <TrendingUp className="h-2.5 w-2.5" /> : strategyData.momentum === 'Declining' || strategyData.momentum === 'Stalling' ? <TrendingDown className="h-2.5 w-2.5" /> : <Minus className="h-2.5 w-2.5" />}
                            {strategyData.momentum}
                          </span>
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white/[0.08] text-sage">{strategyData.balance}</span>
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                            strategyData.move.energy === 'pull_back' ? 'bg-orange-500/15 text-orange-400' :
                            strategyData.move.energy === 'escalate' ? 'bg-emerald-500/15 text-emerald-400' :
                            'bg-brand/15 text-brand'
                          }`}>{strategyData.move.energy.replace('_', ' ')}</span>
                        </div>
                      )}

                      {/* Draft reply cards (free tier / coaching mode) */}
                      {msg.role === 'assistant' && msg.draft && (msg.draft.shorter || msg.draft.spicier || msg.draft.softer) && (
                        <CoachDraftCards
                          msg={msg} index={i} context={selectedContext}
                          copiedId={coachCopiedId} onCopy={copyCoachText}
                          onCoachThis={coachThisDraft} isPro={isPro}
                          onTweak={i === strategyChatHistory.length - 1 && !strategyChatLoading ? (prompt, key) => {
                            track('draft_tweaked', { tweak: key });
                            void handleStrategyChatSendWithMsg(prompt);
                          } : undefined}
                          onUpgrade={() => { setUpgradeTrigger('deep_analysis'); setShowPaywall(true); }}
                        />
                      )}
                    </div>
                  </div>
                ))}
                {strategyChatLoading && !coachStreaming && (
                  <div className="flex justify-start">
                    <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-white/[0.07] border border-white/[0.08] flex items-center gap-2">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-brand" />
                      <span className="text-[13px] text-sage/70">
                        {coachPipelineStep === 'analyzing' ? 'Analyzing conversation...' :
                         coachPipelineStep === 'generating' ? 'Writing 6 options...' :
                         coachPipelineStep === 'scoring' ? 'Scoring & picking winner...' :
                         'Thinking...'}
                      </span>
                    </div>
                  </div>
                )}
                <div ref={coachEndRef} />
              </div>
            )}
          </div>

          {coachOutcome && (
            <div className="shrink-0 mx-4 sm:mx-6 mt-2 rounded-2xl border border-emerald-400/20 bg-emerald-500/[0.08] px-3 py-2.5" aria-live="polite">
              <p className="text-[13px] font-bold text-cream">
                Did they reply{coachOutcome.preview ? <> to &ldquo;{coachOutcome.preview}&rdquo;</> : null}?
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button onClick={() => reportCoachOutcome('got_reply')} className="min-h-10 rounded-xl border border-emerald-300/30 bg-emerald-400/15 px-3 text-xs font-bold text-emerald-100 hover:bg-emerald-400/25 active:scale-95">Yes, they replied</button>
                <button onClick={() => reportCoachOutcome('no_reply')} className="min-h-10 rounded-xl border border-white/10 bg-white/[0.05] px-3 text-xs font-bold text-sage hover:bg-white/10 active:scale-95">No reply</button>
                {coachOutcome.asked === 'after_copy' ? (
                  <button onClick={() => setCoachOutcome(null)} className="min-h-10 px-2 text-xs font-semibold text-sage hover:text-cream">Not sent yet</button>
                ) : (
                  <button onClick={() => reportCoachOutcome('not_reported')} className="min-h-10 px-2 text-xs font-semibold text-sage hover:text-cream">Skip</button>
                )}
              </div>
            </div>
          )}

          {/* ─ Context selector row ─ */}
          <div className="shrink-0 px-4 sm:px-6 pt-2 sm:pt-3 pb-1">
            {/* Phones: one button that opens a sheet, so the chat keeps the vertical room. */}
            <div className="flex items-center justify-between gap-2 sm:hidden">
              <button
                onClick={() => setShowContextSheet(true)}
                className={`flex min-h-11 items-center gap-1.5 rounded-xl border px-3 text-[13px] font-semibold transition-all active:scale-95 ${
                  selectedContext ? 'border-brand/30 bg-brand/15 text-brand' : 'border-white/[0.10] bg-white/[0.05] text-sage'
                }`}
              >
                {selectedContext
                  ? <>{CONTEXT_OPTIONS.find(c => c.value === selectedContext)?.label || 'Custom'}</>
                  : <>Who is it?</>}
                <ChevronDown className="h-3.5 w-3.5 opacity-70" />
              </button>
              {strategyChatHistory.length > 0 && (
                <button onClick={clearCoachChat} className="min-h-11 px-2 text-xs font-semibold text-sage hover:text-cream">Clear chat</button>
              )}
            </div>
            <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
              <span className="text-xs text-sage font-bold uppercase tracking-wider shrink-0">Who?</span>
              {CONTEXT_OPTIONS.map((ctx) => (
                <button
                  key={ctx.value}
                  onClick={() => { contextPickedInChat.current = true; setSelectedContext(selectedContext === ctx.value ? null : ctx.value as ContextType); }}
                  className={`shrink-0 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all active:scale-95 ${
                    selectedContext === ctx.value
                      ? 'bg-brand/20 text-brand border border-brand/30'
                      : 'bg-white/[0.05] text-sage border border-white/[0.08] hover:bg-white/[0.10] hover:text-sage'
                  }`}
                >
                  {ctx.label}
                </button>
              ))}
              {!selectedContext && (
                <span className="text-xs text-sage/70 shrink-0 ml-1 italic">← set for smarter results</span>
              )}
            </div>
          </div>

          {/* ─ Input — pinned at bottom, never cut off, safe-area aware ─ */}
          <div className="shrink-0 px-4 sm:px-6 pb-safe-5 pt-2 border-t border-white/[0.06]">
            <div className="flex items-end gap-2">
              <button
                onClick={() => coachFileInputRef.current?.click()}
                disabled={coachScreenshotExtracting}
                className="w-11 h-11 sm:w-10 sm:h-10 rounded-xl bg-white/[0.05] border border-white/[0.10] flex items-center justify-center text-sage hover:text-sage hover:bg-white/[0.10] transition-all active:scale-90 shrink-0 disabled:opacity-40"
                title="Upload screenshot"
                aria-label="Upload screenshot"
              >
                {coachScreenshotExtracting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              </button>
              <textarea
                ref={coachTextareaRef}
                value={strategyChatInput}
                onChange={(e) => { updateCoachInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'; }}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleStrategyChatSend(); } }}
                onPaste={(e) => {
                  // A screenshot on the clipboard goes straight to Coach; pasted text behaves as usual.
                  const images = Array.from(e.clipboardData.files).filter(file => file.type.startsWith('image/'));
                  if (images.length === 0) return;
                  e.preventDefault();
                  void processCoachScreenshots(images);
                }}
                rows={1}
                disabled={strategyChatLoading}
                enterKeyHint="send"
                autoCapitalize="sentences"
                autoCorrect="on"
                spellCheck
                inputMode="text"
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.10] text-cream placeholder-white/40 text-[16px] md:text-[15px] focus:outline-none focus:border-brand/40 transition-all disabled:opacity-50 resize-none overflow-hidden leading-relaxed"
                style={{ minHeight: '44px' }}
                placeholder={selectedContext ? (
                  getContextCategory(selectedContext) === 'professional'
                    ? `Ask about your ${CONTEXT_OPTIONS.find(c => c.value === selectedContext)?.label.toLowerCase()}...`
                    : getContextCategory(selectedContext) === 'platonic'
                    ? `Ask about your ${CONTEXT_OPTIONS.find(c => c.value === selectedContext)?.label.toLowerCase()}...`
                    : `Ask about your ${CONTEXT_OPTIONS.find(c => c.value === selectedContext)?.label.toLowerCase()}...`
                ) : SMART_PLACEHOLDERS[placeholderIdx]}
              />
              <VoiceInputButton
                disabled={strategyChatLoading}
                hideWhenIdle={Boolean(strategyChatInput.trim())}
                className="w-11 h-11 sm:w-10 sm:h-10"
                onText={(text) => {
                  updateCoachInput(text);
                  const input = coachTextareaRef.current;
                  if (input) window.requestAnimationFrame(() => { input.style.height = 'auto'; input.style.height = Math.min(input.scrollHeight, 120) + 'px'; });
                }}
              />
              <button
                onClick={handleStrategyChatSend}
                disabled={!strategyChatInput.trim() || strategyChatLoading}
                aria-label="Send to Coach"
                className={`rounded-xl flex items-center justify-center text-brand-ink transition-all active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed shrink-0 ${
                  strategyChatInput.trim()
                    ? 'px-4 h-11 sm:h-10 gap-1.5 bg-brand shadow-md shadow-brand/25 hover:shadow-brand/40'
                    : 'w-11 h-11 sm:w-10 sm:h-10 bg-brand shadow-md shadow-brand/20 hover:shadow-brand/35 disabled:shadow-none'
                }`}
              >
                {strategyChatInput.trim() ? (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    <span className="text-xs font-bold">Go</span>
                  </>
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>
            {strategyChatHistory.length > 0 && (
              <div className="hidden sm:flex justify-end mt-2">
                <button onClick={clearCoachChat} className="text-xs text-sage/70 hover:text-sage transition-colors">Clear chat</button>
              </div>
            )}
          </div>
          </div>

          {/* ── The read — desktop-only panel; phones show the same signals inside the card ── */}
          <aside className="hidden xl:flex xl:flex-col w-80 shrink-0 h-full rounded-3xl bg-white/[0.04] border border-white/[0.08] overflow-hidden">
            <div className="shrink-0 px-5 pt-5 pb-3 border-b border-white/[0.06]">
              <span className="text-sage text-xs font-bold uppercase tracking-widest">The read</span>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0 p-5">
              <CoachReadPanel strategy={strategyData} />
            </div>
            <div className="shrink-0 border-t border-white/[0.06] px-5 py-3 text-xs text-sage/70">
              <p><kbd className="rounded border border-white/15 bg-white/[0.06] px-1.5 py-0.5 font-sans text-sage">Enter</kbd> to send · <kbd className="rounded border border-white/15 bg-white/[0.06] px-1.5 py-0.5 font-sans text-sage">Shift + Enter</kbd> for a new line</p>
              <p className="mt-1.5">Paste or drop a screenshot anywhere in the chat.</p>
            </div>
          </aside>
        </div>

        {showContextSheet && (
          <div className="fixed inset-0 z-[90] sm:hidden" role="dialog" aria-modal="true" aria-label="Who are you texting?">
            <button aria-label="Close" className="absolute inset-0 bg-black/70" onClick={() => setShowContextSheet(false)} />
            <div className="absolute inset-x-0 bottom-0 rounded-t-3xl border-t border-white/[0.10] bg-panel px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 animate-in slide-in-from-bottom-4 duration-200">
              <div className="mb-1 flex items-center justify-between">
                <h2 className="text-base font-bold text-cream">Who are you texting?</h2>
                <button onClick={() => setShowContextSheet(false)} aria-label="Close" className="flex h-11 w-11 items-center justify-center rounded-xl text-sage hover:text-cream">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="mb-3 text-xs text-sage">Coach adjusts the tone and the advice to fit.</p>
              <div className="grid grid-cols-2 gap-2">
                {CONTEXT_OPTIONS.map((ctx) => {
                  const active = selectedContext === ctx.value;
                  return (
                    <button
                      key={ctx.value}
                      onClick={() => { contextPickedInChat.current = true; setSelectedContext(active ? null : ctx.value as ContextType); setShowContextSheet(false); }}
                      aria-pressed={active}
                      className={`flex min-h-[60px] items-center gap-3 rounded-2xl border px-3 text-left transition-all active:scale-[0.98] ${
                        active ? 'border-brand/40 bg-brand/15' : 'border-white/[0.08] bg-white/[0.04]'
                      }`}
                    >
                      <span className="min-w-0">
                        <span className={`block text-sm font-bold ${active ? 'text-brand' : 'text-cream'}`}>{ctx.label}</span>
                        <span className="block text-xs leading-snug text-sage">{ctx.description}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {showCoachThreads && (
          <div className="fixed inset-0 z-[90] lg:hidden" role="dialog" aria-modal="true" aria-label="Your conversations">
            <button aria-label="Close conversations" className="absolute inset-0 bg-black/70" onClick={() => setShowCoachThreads(false)} />
            <div className="absolute inset-x-0 bottom-0 flex max-h-[80dvh] flex-col rounded-t-3xl border-t border-white/[0.10] bg-panel pb-[max(1rem,env(safe-area-inset-bottom))] animate-in slide-in-from-bottom-4 duration-200">
              <div className="flex shrink-0 items-center justify-between px-5 pb-3 pt-4">
                <h2 className="text-base font-bold text-cream">Conversations</h2>
                <div className="flex items-center gap-2">
                  <button onClick={() => { handleNewThread(); setShowCoachThreads(false); }} className="flex min-h-10 items-center gap-1.5 rounded-xl border border-white/[0.12] bg-white/[0.06] px-3 text-xs font-bold text-cream active:scale-95">
                    <Plus className="h-3.5 w-3.5" /> New
                  </button>
                  <button onClick={() => setShowCoachThreads(false)} aria-label="Close" className="flex h-10 w-10 items-center justify-center rounded-xl text-sage hover:text-cream">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2"><ConversationList threads={savedThreads} userId={userId} isThreadActive={(id) => activeCoachSessionId === id} onLoad={handleLoadThread} onDelete={handleDeleteThread} /></div>
              {userId ? (
                <Link href="/history" className="mx-5 mt-1 flex min-h-11 items-center justify-center rounded-xl border border-white/[0.10] text-xs font-semibold text-sage hover:bg-white/[0.06]">Search all history</Link>
              ) : (
                <Link href={`/login?mode=signup&redirect=${encodeURIComponent('/app')}`} className="mx-5 mt-1 flex min-h-11 items-center justify-center rounded-xl bg-brand text-xs font-bold text-brand-ink hover:bg-brand-soft">Create a free account</Link>
              )}
            </div>
          </div>
        )}

      </div>
      {userId && <AppNav />}
    </div>
  </ShareReplyContext.Provider>
  );
}
