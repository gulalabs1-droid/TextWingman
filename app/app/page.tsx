'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, ArrowRight, Copy, Sparkles, Loader2, Lightbulb, Zap, Heart, MessageCircle, Crown, Shield, CheckCircle, Check, Lock, Camera, X, ImageIcon, Search, Brain, Flag, BookmarkPlus, BookmarkCheck, Trash2, Send, AlertTriangle, ChevronUp, ChevronDown, Plus, Clock, Target, TrendingUp, TrendingDown, Minus, RefreshCw, Trophy } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { CURRENT_VERSION } from '@/lib/changelog';
import FeatureTour from '@/components/FeatureTour';
import ContextualHints from '@/components/ContextualHints';
import { getContextCategory, DRAFT_LABELS } from '@/lib/context-category';

type Reply = {
  tone: 'shorter' | 'spicier' | 'softer';
  text: string;
};

type V2Meta = {
  ruleChecks: Record<string, boolean>;
  toneChecks: Record<string, boolean>;
  confidence: Record<string, number>;
  notes?: string;
} | null;

const TONE_CONFIG = {
  shorter: {
    label: 'Shorter',
    description: 'Brief & casual',
    color: 'bg-blue-500',
    gradient: 'from-blue-500 to-cyan-500',
    lightBg: 'bg-blue-50',
    icon: Zap,
    emoji: '⚡',
  },
  spicier: {
    label: 'Spicier',
    description: 'Playful & flirty',
    color: 'bg-red-500',
    gradient: 'from-rose-500 to-pink-500',
    lightBg: 'bg-rose-50',
    icon: Sparkles,
    emoji: '🔥',
  },
  softer: {
    label: 'Softer',
    description: 'Warm & genuine',
    color: 'bg-green-500',
    gradient: 'from-green-500 to-emerald-500',
    lightBg: 'bg-green-50',
    icon: Heart,
    emoji: '💚',
  },
};

const EXAMPLE_MESSAGES = [
  "Hey, what are you doing this weekend?",
  "Want to grab coffee sometime?",
  "Sorry I missed your call earlier",
  "That's actually pretty funny lol"
];

const TAGLINES = [
  "Flirt smarter, not harder 💘",
  "Replies smoother than silk 🎯",
  "Built for game, not games 🔥",
  "Your secret weapon for perfect texts ⚡",
  "Never fumble a reply again 💯",
  "Text like a pro, every time 🌟"
];

type DecodeResult = {
  intent: string;
  subtext: string;
  energy: string;
  flags: { type: 'green' | 'red' | 'yellow'; text: string }[];
  coach_tip: string;
} | null;

type Opener = {
  tone: string;
  text: string;
  why: string;
};

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

type ThreadMessage = {
  role: 'them' | 'you';
  text: string;
  timestamp: number;
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

const STYLE_CONFIG: Record<string, { label: string; emoji: string; color: string }> = {
  hood_charisma: { label: 'Hood Charisma', emoji: '👑', color: 'text-amber-400 bg-amber-500/15' },
  clean_direct: { label: 'Clean Direct', emoji: '🎯', color: 'text-blue-400 bg-blue-500/15' },
  playful_tease: { label: 'Playful Tease', emoji: '😏', color: 'text-pink-400 bg-pink-500/15' },
  bold_closer: { label: 'Bold Closer', emoji: '⚡', color: 'text-orange-400 bg-orange-500/15' },
  warm_genuine: { label: 'Warm Genuine', emoji: '💚', color: 'text-emerald-400 bg-emerald-500/15' },
  chill_unbothered: { label: 'Chill', emoji: '🧊', color: 'text-cyan-400 bg-cyan-500/15' },
};

type StrategyChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  draft?: { shorter?: string; spicier?: string; softer?: string } | null;
  orchestration?: OrchestrateResult | null;
  images?: string[];
};

type ScanResult = {
  platform: string;
  messageCount: number;
  confidence: string;
  fullConversation: string;
  lastReceived: string;
  strategy: StrategyData;
  replies: Reply[];
} | null;

type AppMode = 'reply' | 'decode' | 'opener' | 'revive' | 'coach';

type ReviveMessage = {
  tone: string;
  text: string;
  why: string;
};

const OPENER_CONTEXTS = [
  { value: 'dating-app', label: 'Dating App', emoji: '💘', description: 'Tinder, Hinge, Bumble' },
  { value: 'instagram-dm', label: 'Instagram DM', emoji: '📸', description: 'Slide into DMs' },
  { value: 'cold-text', label: 'Cold Text', emoji: '📱', description: 'Got their number' },
  { value: 'reconnect', label: 'Reconnect', emoji: '👋', description: 'Haven\'t talked in a while' },
  { value: 'networking', label: 'Networking', emoji: '💼', description: 'Professional intro' },
] as const;

const OPENER_TONE_CONFIG: Record<string, { label: string; emoji: string; gradient: string; lightBg: string }> = {
  bold: { label: 'Bold', emoji: '🎯', gradient: 'from-red-500 to-orange-500', lightBg: 'bg-red-50' },
  witty: { label: 'Witty', emoji: '⚡', gradient: 'from-purple-500 to-pink-500', lightBg: 'bg-purple-50' },
  warm: { label: 'Warm', emoji: '💚', gradient: 'from-green-500 to-emerald-500', lightBg: 'bg-green-50' },
};

const REVIVE_TONE_CONFIG: Record<string, { label: string; emoji: string; gradient: string }> = {
  smooth: { label: 'Smooth', emoji: '🎯', gradient: 'from-cyan-500 to-blue-500' },
  bold: { label: 'Bold', emoji: '🔥', gradient: 'from-orange-500 to-red-500' },
  warm: { label: 'Warm', emoji: '💚', gradient: 'from-green-500 to-emerald-500' },
};

const ENERGY_CONFIG: Record<string, { emoji: string; color: string; bg: string }> = {
  interested: { emoji: '💚', color: 'text-green-400', bg: 'bg-green-500/20' },
  testing: { emoji: '🧪', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  neutral: { emoji: '😐', color: 'text-gray-400', bg: 'bg-gray-500/20' },
  'pulling-away': { emoji: '🚪', color: 'text-red-400', bg: 'bg-red-500/20' },
  flirty: { emoji: '😏', color: 'text-pink-400', bg: 'bg-pink-500/20' },
  confrontational: { emoji: '⚡', color: 'text-orange-400', bg: 'bg-orange-500/20' },
  anxious: { emoji: '😰', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  playful: { emoji: '😜', color: 'text-purple-400', bg: 'bg-purple-500/20' },
  cold: { emoji: '🥶', color: 'text-blue-400', bg: 'bg-blue-500/20' },
  warm: { emoji: '🤗', color: 'text-green-400', bg: 'bg-green-500/20' },
};

type ContextType = 'crush' | 'friend' | 'colleague' | 'family' | 'ex' | 'new_match' | null;

const CONTEXT_OPTIONS = [
  { value: 'crush', label: 'Crush/Dating', emoji: '💘', description: 'Someone you\'re into' },
  { value: 'friend', label: 'Friend', emoji: '🤝', description: 'Close friend' },
  { value: 'colleague', label: 'Work', emoji: '💼', description: 'Professional' },
  { value: 'family', label: 'Family', emoji: '👪', description: 'Family member' },
  { value: 'ex', label: 'Ex', emoji: '💔', description: 'Complicated' },
  { value: 'new_match', label: 'New Match', emoji: '✨', description: 'First messages' },
] as const;

export default function AppPage() {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState('');
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [showExamples, setShowExamples] = useState(true);
  const [currentTagline, setCurrentTagline] = useState(0);
  const [showCraftedMessage, setShowCraftedMessage] = useState(false);
  const [selectedContext, setSelectedContext] = useState<ContextType>(null);
  const [customContext, setCustomContext] = useState('');
  const [userIntent, setUserIntent] = useState('');
  const [sharing, setSharing] = useState<string | null>(null);
  const [shareMenuOpen, setShareMenuOpen] = useState<string | null>(null);
  const [vpnBlocked, setVpnBlocked] = useState(false);
  const [usageCount, setUsageCount] = useState(0);
  const [remainingReplies, setRemainingReplies] = useState(5);
  const [showPaywall, setShowPaywall] = useState(false);
  const [usageLimit, setUsageLimit] = useState(5);
  const [showExamplesDrawer, setShowExamplesDrawer] = useState(false);
  const [decodeUsed, setDecodeUsed] = useState(0);
  const [decodeLimit, setDecodeLimit] = useState(1);
  const [openerUsed, setOpenerUsed] = useState(0);
  const [openerLimit, setOpenerLimit] = useState(1);
  const [isPro, setIsPro] = useState(false);
  const [useV2, setUseV2] = useState(true); // Pro users default to V2, can toggle to V1 for speed
  const [v2Meta, setV2Meta] = useState<V2Meta>(null);
  const [v2Step, setV2Step] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extractedPlatform, setExtractedPlatform] = useState<string | null>(null);
  const [showFeatureSpotlight, setShowFeatureSpotlight] = useState(false);
  const [appMode, setAppMode] = useState<AppMode>('coach');
  const [decodeResult, setDecodeResult] = useState<DecodeResult>(null);
  const [decoding, setDecoding] = useState(false);
  const [openers, setOpeners] = useState<Opener[]>([]);
  const [openerContext, setOpenerContext] = useState<string>('dating-app');
  const [openerDescription, setOpenerDescription] = useState('');
  const [loadingOpeners, setLoadingOpeners] = useState(false);
  const [reviveMessages, setReviveMessages] = useState<ReviveMessage[]>([]);
  const [reviveAnalysis, setReviveAnalysis] = useState('');
  const [loadingRevive, setLoadingRevive] = useState(false);
  const [reviveUsed, setReviveUsed] = useState(0);
  const [reviveLimit, setReviveLimit] = useState(1);
  const [savedThreads, setSavedThreads] = useState<SavedThread[]>([]);
  const [showThreads, setShowThreads] = useState(false);
  const [savingThread, setSavingThread] = useState(false);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [activeThreadName, setActiveThreadName] = useState<string | null>(null);
  const [editingThreadName, setEditingThreadName] = useState(false);
  const [thread, setThread] = useState<ThreadMessage[]>([]);
  const [showThread, setShowThread] = useState(true);
  const [selectedThreadMsg, setSelectedThreadMsg] = useState<number | null>(null);
  const [pendingSent, setPendingSent] = useState<Reply | null>(null);
  const [customSent, setCustomSent] = useState('');
  const [showCustomSent, setShowCustomSent] = useState(false);
  const [strategyData, setStrategyData] = useState<StrategyData>(null);
  const [strategyChatHistory, setStrategyChatHistory] = useState<StrategyChatMessage[]>([]);
  const [strategyChatInput, setStrategyChatInput] = useState('');
  const [strategyChatLoading, setStrategyChatLoading] = useState(false);
  const [extractedThread, setExtractedThread] = useState('');
  const [expandedCoachTrace, setExpandedCoachTrace] = useState<number | null>(null);
  const [coachCopiedId, setCoachCopiedId] = useState<string | null>(null);
  const [coachPipelineStep, setCoachPipelineStep] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult>(null);
  const [saving, setSaving] = useState(false);
  const [savingCoach, setSavingCoach] = useState(false);
  const [loadingSession, setLoadingSession] = useState(false);
  const [editingReply, setEditingReply] = useState<string | null>(null); // tone being edited
  const [editText, setEditText] = useState('');
  const [refining, setRefining] = useState(false);
  const [vibeCheck, setVibeCheck] = useState<{ energy: string; vibe: string; tip: string; score: number } | null>(null);
  const [vibeLoading, setVibeLoading] = useState(false);
  const vibeTimer = useRef<NodeJS.Timeout | null>(null);
  const [translating, setTranslating] = useState(false);
  const [showToneBar, setShowToneBar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coachFileInputRef = useRef<HTMLInputElement>(null);
  const coachTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [coachScreenshotExtracting, setCoachScreenshotExtracting] = useState(false);
  const threadEndRef = useRef<HTMLDivElement>(null);
  const coachEndRef = useRef<HTMLDivElement>(null);
  const inputAreaRef = useRef<HTMLDivElement>(null);
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const coachSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const [activeCoachSessionId, setActiveCoachSessionId] = useState<string | null>(null);
  const [smartPreviewDismissed, setSmartPreviewDismissed] = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const { toast } = useToast();
  
  const charCount = message.length;

  // ── Smart Preview helpers ──────────────────────────────
  const getTimeGreeting = () => {
    const h = new Date().getHours();
    const day = new Date().getDay();
    if (day === 5 && h >= 18) return { emoji: '🌙', text: 'Friday night dead chat?', sub: 'Let\'s revive it before the weekend ends' };
    if (day === 0 && h < 12) return { emoji: '☀️', text: 'Sunday morning catch-up?', sub: 'Perfect time to send something warm' };
    if (day === 1 && h < 12) return { emoji: '📱', text: 'Monday morning reply?', sub: 'Start the week with the right energy' };
    if (h >= 22 || h < 5) return { emoji: '🌙', text: 'Late night text?', sub: 'Keep it short, keep it smooth' };
    if (h >= 18) return { emoji: '✨', text: 'Evening text incoming?', sub: 'Prime time to make your move' };
    if (h >= 12) return { emoji: '☀️', text: 'Afternoon reply?', sub: 'Drop something casual and confident' };
    return { emoji: '🌅', text: 'Morning message?', sub: 'Start fresh, keep it light' };
  };

  const getSmartPreview = () => {
    if (smartPreviewDismissed) return null;
    const recentThread = savedThreads.length > 0 ? savedThreads.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0] : null;
    if (recentThread) {
      const name = recentThread.name?.slice(0, 30) || 'Last convo';
      const ctx = recentThread.context ? ` (${recentThread.context})` : '';
      return { type: 'thread' as const, thread: recentThread, emoji: '🔥', text: `${name}${ctx}`, sub: 'Tap to pick up where you left off' };
    }
    return { type: 'time' as const, ...getTimeGreeting() };
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

  // Auto-resize + focus coach textarea when input is set programmatically (chip tap, Smart Preview)
  useEffect(() => {
    const el = coachTextareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
    if (strategyChatInput.trim()) el.focus();
  }, [strategyChatInput]);

  // Rotate placeholder text every 4s when input is empty
  useEffect(() => {
    if (strategyChatInput.trim() || appMode !== 'coach') return;
    const timer = setInterval(() => {
      setPlaceholderIdx(prev => (prev + 1) % SMART_PLACEHOLDERS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [strategyChatInput, appMode, SMART_PLACEHOLDERS.length]);

  // Show one-time feature spotlight for screenshot upload
  useEffect(() => {
    const dismissed = localStorage.getItem('tw_spotlight_screenshot_v1');
    if (!dismissed) {
      // Small delay so the page renders first
      const timer = setTimeout(() => setShowFeatureSpotlight(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismissSpotlight = () => {
    setShowFeatureSpotlight(false);
    localStorage.setItem('tw_spotlight_screenshot_v1', 'true');
  };

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
          // Store user info for checkout
          if (data.userId) setUserId(data.userId);
          if (data.userEmail) setUserEmail(data.userEmail);
          // Check if user is Pro (unlimited or has active subscription)
          if (data.isPro) {
            setIsPro(true);
          }
          if (data.decodeUsed !== undefined) setDecodeUsed(data.decodeUsed);
          if (data.decodeLimit !== undefined) setDecodeLimit(data.decodeLimit);
          if (data.openerUsed !== undefined) setOpenerUsed(data.openerUsed);
          if (data.openerLimit !== undefined) setOpenerLimit(data.openerLimit);
          if (data.trialDaysLeft !== undefined && data.trialDaysLeft !== null) {
            setTrialDaysLeft(data.trialDaysLeft);
          }
          if (data.userName) setUserName(data.userName);
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
        title: "🎉 Welcome to Pro!",
        description: "You now have unlimited verified replies. Let's go!",
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
        if (type === 'coach') {
          const coachMsgs: StrategyChatMessage[] = msgs.map((m: any) => ({
            role: m.role === 'assistant' ? 'assistant' as const : 'user' as const,
            content: m.content || '',
            draft: m.draft || null,
          }));
          setStrategyChatHistory(coachMsgs);
        } else {
          const coachMsgs: StrategyChatMessage[] = msgs.map((m: any) => ({
            role: m.role === 'them' ? 'user' as const : 'assistant' as const,
            content: m.text || m.content || '',
          }));
          setStrategyChatHistory(coachMsgs);
        }

        setActiveCoachSessionId(ft.id);
        setActiveThreadId(null);
        setActiveThreadName(null);
        setThread([]);
        setReplies([]);
        setShowThreads(false);
        setShowExamples(false);
        if (ft.context) setSelectedContext(ft.context as ContextType);
        toast({ title: 'Session loaded', description: ft.name || 'Untitled' });
        window.history.replaceState({}, '', '/app');
      } catch {
        toast({ title: 'Failed to load session', variant: 'destructive' });
      } finally {
        setLoadingSession(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Rotate taglines every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTagline((prev) => (prev + 1) % TAGLINES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll thread view
  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread]);

  // Auto-scroll coach chat
  useEffect(() => {
    coachEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [strategyChatHistory, strategyChatLoading]);

  // Auto-save thread after 2+ messages (1.5s debounce)
  useEffect(() => {
    if (thread.length < 2) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      autoSaveThread();
    }, 1500);
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thread]);

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

  // Log usage to server
  const incrementUsage = async () => {
    try {
      const res = await fetch('/api/usage', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setUsageCount(data.usageCount);
        setRemainingReplies(data.remaining);
        return true;
      } else if (res.status === 429) {
        setShowPaywall(true);
        return false;
      }
    } catch (error) {
      console.error('Failed to log usage:', error);
    }
    return true;
  };

  const handleGenerate = async () => {
    // Check if user has reached free limit
    if (usageCount >= usageLimit) {
      setShowPaywall(true);
      return;
    }

    // If textarea is empty but last thread message is from 'them', use that
    const lastThemInThread = [...thread].reverse().find(m => m.role === 'them');
    const effectiveMessage = message.trim() || (lastThemInThread ? lastThemInThread.text : '');

    if (!effectiveMessage) {
      toast({
        title: "Empty message",
        description: "Please paste a message first",
        variant: "destructive",
      });
      return;
    }

    // Only add to thread if user typed a new message in the textarea
    if (message.trim()) {
      addToThread('them', message.trim());
    }

    setLoading(true);
    setReplies([]); // Clear previous replies
    setV2Meta(null); // Clear previous V2 meta
    setV2Step(null);
    setPendingSent(null);
    
    try {
      // Use V2 API if enabled (Pro-only)
      const endpoint = (isPro && useV2) ? '/api/generate-v2' : '/api/generate';
      
      // Build full conversation context for smarter replies
      const fullContext = buildThreadContext(effectiveMessage);
      
      // Show V2 progress indicator (no fake delays — step updates happen instantly)
      if (isPro && useV2) setV2Step('drafting');
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: fullContext,
          context: selectedContext || 'crush',
          customContext: customContext.trim() || undefined,
          userIntent: userIntent.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          // Check if VPN abuse detected
          if (data.error === 'vpn_abuse_detected') {
            setVpnBlocked(true);
          } else {
            setShowPaywall(true);
          }
        } else {
          throw new Error(data.error || 'Failed to generate replies');
        }
        return;
      }
      
      // Handle V2 response format
      if (isPro && useV2 && data.shorter && data.spicier && data.softer) {
        const v2Replies: Reply[] = [
          { tone: 'shorter', text: data.shorter },
          { tone: 'spicier', text: data.spicier },
          { tone: 'softer', text: data.softer },
        ];
        setReplies(v2Replies);
        if (data.meta) {
          setV2Meta(data.meta);
        }
        if (data.strategy) {
          setStrategyData(data.strategy);
        }
      }
      // Handle V1 response format
      else if (Array.isArray(data.replies) && data.replies.length > 0) {
        // Ensure all replies have required properties
        const validReplies = data.replies.filter((r: any) => r && r.tone && r.text);
        
        if (validReplies.length > 0) {
          setReplies(validReplies);
        } else {
          throw new Error('Invalid reply format received');
        }
      } else {
        throw new Error('No replies received from server');
      }
      
      // Refresh usage count from server
      const usageRes = await fetch('/api/usage');
      if (usageRes.ok) {
        const usageData = await usageRes.json();
        setUsageCount(usageData.usageCount);
        setRemainingReplies(usageData.remaining);
      }

      // Clear input (it's now in the thread)
      setMessage('');
      setShowExamples(false);

      // Show "crafted with care" message
      setShowCraftedMessage(true);
      setTimeout(() => setShowCraftedMessage(false), 3000);

      toast({
        title: (isPro && useV2) ? "✅ Verified replies ready!" : "✨ Replies generated!",
        description: "Copy one and tap 'I sent this' to keep the thread going",
      });
    } catch (error) {
      console.error('Generation error:', error);
      toast({
        title: "Oops! Something went wrong",
        description: error instanceof Error ? error.message : "Failed to generate replies. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setV2Step(null);
    }
  };

  // Regenerate replies (regular flow) — re-calls API with same thread context, no re-add
  const handleRegenerate = async () => {
    if (loading) return;
    
    // Get last "them" message from thread to rebuild context
    const lastThem = [...thread].reverse().find(m => m.role === 'them');
    if (!lastThem) return;

    setLoading(true);
    setReplies([]);
    setV2Meta(null);
    setV2Step(null);
    setStrategyData(null);
    setPendingSent(null);

    try {
      const endpoint = (isPro && useV2) ? '/api/generate-v2' : '/api/generate';
      const fullContext = buildThreadContext(lastThem.text);

      if (isPro && useV2) setV2Step('drafting');

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: fullContext,
          context: selectedContext || 'crush',
          customContext: customContext.trim() || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to regenerate');

      if (isPro && useV2 && data.shorter && data.spicier && data.softer) {
        setReplies([
          { tone: 'shorter', text: data.shorter },
          { tone: 'spicier', text: data.spicier },
          { tone: 'softer', text: data.softer },
        ]);
        if (data.meta) setV2Meta(data.meta);
        if (data.strategy) setStrategyData(data.strategy);
      } else if (Array.isArray(data.replies) && data.replies.length > 0) {
        const validReplies = data.replies.filter((r: any) => r && r.tone && r.text);
        if (validReplies.length > 0) setReplies(validReplies);
      }

      toast({ title: '🔄 Fresh replies generated', description: 'New options for the same message' });
    } catch (error) {
      toast({ title: 'Regeneration failed', description: 'Try again', variant: 'destructive' });
    } finally {
      setLoading(false);
      setV2Step(null);
    }
  };

  // Regenerate replies for screenshot briefing — re-calls API with same extracted conversation
  const handleRegenerateScan = async () => {
    if (loading || !scanResult) return;

    setLoading(true);

    try {
      const endpoint = (isPro && useV2) ? '/api/generate-v2' : '/api/generate';
      const genRes = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: scanResult.fullConversation,
          context: selectedContext || 'crush',
          customContext: customContext.trim() || undefined,
        }),
      });

      const genData = await genRes.json();
      if (!genRes.ok) throw new Error(genData.error || 'Regeneration failed');

      let newReplies: Reply[] = [];
      let newStrategy: StrategyData = null;

      if (isPro && useV2 && genData.shorter && genData.spicier && genData.softer) {
        newReplies = [
          { tone: 'shorter', text: genData.shorter },
          { tone: 'spicier', text: genData.spicier },
          { tone: 'softer', text: genData.softer },
        ];
        if (genData.strategy) newStrategy = genData.strategy;
      } else if (Array.isArray(genData.replies) && genData.replies.length > 0) {
        newReplies = genData.replies.filter((r: any) => r && r.tone && r.text);
      }

      if (newReplies.length > 0) {
        setScanResult({
          ...scanResult,
          replies: newReplies,
          strategy: newStrategy,
        });
        toast({ title: '🔄 Fresh replies generated', description: 'New options for the same conversation' });
      }
    } catch (error) {
      toast({ title: 'Regeneration failed', description: 'Try again', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Edit + Refine reply inline
  const handleStartEdit = (tone: string, currentText: string) => {
    setEditingReply(tone);
    setEditText(currentText);
  };

  const handleCancelEdit = () => {
    setEditingReply(null);
    setEditText('');
  };

  const handleRefine = async (tone: string, originalText: string, isScan = false) => {
    if (!editText.trim() || refining) return;
    setRefining(true);

    try {
      const res = await fetch('/api/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          original: originalText,
          edited: editText.trim(),
          tone,
          context: selectedContext || 'crush',
          customContext: customContext.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Refine failed');

      if (data.refined) {
        if (isScan && scanResult) {
          // Update the scanResult replies
          setScanResult({
            ...scanResult,
            replies: scanResult.replies.map(r =>
              r.tone === tone ? { ...r, text: data.refined } : r
            ),
          });
        } else {
          // Update the regular replies
          setReplies(prev => prev.map(r =>
            r.tone === tone ? { ...r, text: data.refined } : r
          ));
        }
        toast({ title: '✨ Reply polished', description: 'Your edit has been refined' });
      }
    } catch (error) {
      toast({ title: 'Refine failed', description: 'Try again', variant: 'destructive' });
    } finally {
      setRefining(false);
      setEditingReply(null);
      setEditText('');
    }
  };

  // Use raw edit without AI polish
  const handleUseRawEdit = (tone: string, isScan = false) => {
    if (!editText.trim()) return;
    if (isScan && scanResult) {
      setScanResult({
        ...scanResult,
        replies: scanResult.replies.map(r =>
          r.tone === tone ? { ...r, text: editText.trim() } : r
        ),
      });
    } else {
      setReplies(prev => prev.map(r =>
        r.tone === tone ? { ...r, text: editText.trim() } : r
      ));
    }
    setEditingReply(null);
    setEditText('');
  };

  // ── Vibe Check — real-time feedback on user's draft ──
  const runVibeCheck = async (draft: string) => {
    if (draft.trim().length < 8 || vibeLoading) return;
    setVibeLoading(true);
    try {
      const lastThem = [...thread].reverse().find(m => m.role === 'them');
      const res = await fetch('/api/vibe-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draft: draft.trim(),
          context: selectedContext || 'crush',
          customContext: customContext.trim() || undefined,
          lastReceived: lastThem?.text || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setVibeCheck(data);
      }
    } catch {
      // Silent fail — don't interrupt typing
    } finally {
      setVibeLoading(false);
    }
  };

  // Debounced vibe check on typing
  const handleMessageChange = (value: string) => {
    setMessage(value);
    if (value.trim()) setShowExamples(false);
    setVibeCheck(null);

    if (vibeTimer.current) clearTimeout(vibeTimer.current);
    if (value.trim().length >= 8 && appMode === 'reply') {
      vibeTimer.current = setTimeout(() => runVibeCheck(value), 1500);
    }
  };

  // ── Tone Translator — rewrite draft in a different energy ──
  const handleTranslateTone = async (tone: string) => {
    if (!message.trim() || translating) return;
    setTranslating(true);
    try {
      const res = await fetch('/api/translate-tone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draft: message.trim(),
          tone,
          context: selectedContext || 'crush',
          customContext: customContext.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.translated) {
        setMessage(data.translated);
        setVibeCheck(null);
        toast({ title: `🎭 Rewritten as ${tone}`, description: data.translated });
      } else {
        toast({ title: 'Translation failed', description: data.error || 'Try again', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Translation failed', description: 'Try again', variant: 'destructive' });
    } finally {
      setTranslating(false);
    }
  };

  const handleCopy = async (text: string, tone: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(tone);
      setPendingSent({ tone: tone as Reply['tone'], text });
      toast({
        title: (isPro && useV2) ? "✅ Verified reply copied!" : "✓ Copied to clipboard!",
        description: "Tap 'I sent this' to continue the thread",
      });
      
      // Log which tone was copied (for personalization data)
      fetch('/api/log-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tone, isV2: isPro }),
      }).catch(() => {}); // Fire and forget
      
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  // Share: Copy link
  const handleShareLink = async (reply: Reply) => {
    setSharing(reply.tone);
    try {
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theirMessage: message.substring(0, 100),
          myReply: reply.text,
          tone: reply.tone,
        }),
      });
      const data = await response.json();
      if (data.slug) {
        const shareUrl = `${window.location.origin}/share/${data.slug}`;
        await navigator.clipboard.writeText(shareUrl);
        toast({ title: "🔗 Share link copied!", description: "Paste on TikTok, Instagram, or Twitter" });
      }
    } catch (err) {
      const encoded = btoa(JSON.stringify({ theirMessage: message.substring(0, 100), myReply: reply.text, tone: reply.tone }));
      await navigator.clipboard.writeText(`${window.location.origin}/share/${encoded}`);
      toast({ title: "🔗 Share link copied!" });
    }
    setTimeout(() => { setSharing(null); setShareMenuOpen(null); }, 2000);
  };

  // Share: Download image
  const handleDownloadImage = async (reply: Reply) => {
    setSharing(reply.tone);
    try {
      const imageUrl = `/api/share/image?their=${encodeURIComponent(message.substring(0, 100))}&reply=${encodeURIComponent(reply.text)}&tone=${reply.tone}`;
      const res = await fetch(imageUrl);
      if (!res.ok) throw new Error('Failed to generate image');
      const blob = await res.blob();
      if (blob.size === 0) throw new Error('Empty image');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `textwingman-${reply.tone}.png`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 100);
      toast({ title: "📥 Image downloaded!", description: "Share it anywhere" });
    } catch (err) {
      console.error('Download error:', err);
      toast({ title: "Failed to download", description: "Please try again", variant: "destructive" });
    }
    setTimeout(() => { setSharing(null); setShareMenuOpen(null); }, 2000);
  };

  // Share: Copy image to clipboard
  const handleCopyImage = async (reply: Reply) => {
    setSharing(reply.tone);
    try {
      const imageUrl = `/api/share/image?their=${encodeURIComponent(message.substring(0, 100))}&reply=${encodeURIComponent(reply.text)}&tone=${reply.tone}`;
      const res = await fetch(imageUrl);
      if (!res.ok) throw new Error('Failed to generate image');
      const blob = await res.blob();
      if (blob.size === 0) throw new Error('Empty image');
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      toast({ title: "📋 Image copied!", description: "Paste it in any app" });
    } catch (err) {
      console.error('Copy image error:', err);
      toast({ title: "Failed to copy image", description: "Try downloading instead", variant: "destructive" });
    }
    setTimeout(() => { setSharing(null); setShareMenuOpen(null); }, 2000);
  };

  // Compress image client-side to avoid size issues with iPhone screenshots
  const compressImage = (file: File, maxWidth = 1200, quality = 0.7): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Canvas not supported')); return; }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Failed to load image')); };
      img.src = objectUrl;
    });
  };

  // Screenshot upload & extraction
  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || extracting) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file',
        description: 'Please upload an image file (PNG, JPEG, WebP)',
        variant: 'destructive',
      });
      return;
    }

    // Compress image client-side (handles large iPhone screenshots)
    let base64: string;
    try {
      base64 = await compressImage(file);
    } catch {
      toast({
        title: 'Could not process image',
        description: 'Try a different screenshot',
        variant: 'destructive',
      });
      return;
    }

    setScreenshotPreview(base64);
    setExtracting(true);
    setExtractedPlatform(null);

    try {
      // Step 1: Extract conversation from screenshot
      const res = await fetch('/api/extract-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 }),
      });

      const data = await res.json();

      if (data.error && !data.extracted_text) {
        toast({
          title: '📷 Could not read screenshot',
          description: data.error || 'Try a clearer screenshot of the conversation',
          variant: 'destructive',
        });
        setScreenshotPreview(null);
        return;
      }

      if (data.extracted_text) {
        setExtractedPlatform(data.platform);
        const msgCount = data.message_count || 1;

        // For Decode, Opener, and Revive modes: just extract text into textarea, don't auto-generate replies
        if (appMode === 'decode' || appMode === 'opener' || appMode === 'revive') {
          setMessage(appMode === 'revive' ? (data.full_conversation || data.extracted_text) : (data.last_received || data.extracted_text));
          setShowExamples(false);
          setScreenshotPreview(null);
          toast({
            title: `📷 ${msgCount > 1 ? `${msgCount} messages read` : 'Message read'}`,
            description: appMode === 'decode'
              ? 'Now hit Decode to analyze it'
              : appMode === 'revive'
              ? 'Conversation loaded — hit Revive to generate re-engagement messages'
              : 'Text extracted — use it for your opener',
          });
          return;
        }

        // Smart Thread Update: if a thread already exists, compare and add only new messages
        if (thread.length > 0 && data.full_conversation) {
          const extractedLines = data.full_conversation.split('\n').filter((l: string) => l.trim());
          const extractedMsgs = extractedLines.map((line: string) => ({
            role: line.startsWith('You:') ? 'you' as const : 'them' as const,
            text: line.replace(/^(Them|You):\s*/, '').replace(/\s*\([^)]*\)\s*$/, '').trim(),
          }));

          // Normalize text for comparison (lowercase, strip punctuation/whitespace)
          const normalize = (t: string) => t.toLowerCase().replace(/[^a-z0-9]/g, '');
          const existingNormalized = thread.map(m => normalize(m.text));

          // Find messages in the extracted list that aren't in the existing thread
          // Walk from the end of the extracted messages backward to find where our thread ends
          let matchEnd = -1;
          for (let i = extractedMsgs.length - 1; i >= 0; i--) {
            const idx = existingNormalized.lastIndexOf(normalize(extractedMsgs[i].text));
            if (idx !== -1 && idx === thread.length - 1) {
              matchEnd = i;
              break;
            }
          }

          // If we couldn't find an exact tail match, try matching the last few thread messages sequentially
          if (matchEnd === -1) {
            for (let start = extractedMsgs.length - 1; start >= 0; start--) {
              let threadIdx = thread.length - 1;
              let extIdx = start;
              let matched = false;
              while (extIdx >= 0 && threadIdx >= 0) {
                if (normalize(extractedMsgs[extIdx].text) === existingNormalized[threadIdx]) {
                  if (threadIdx === thread.length - 1) {
                    matchEnd = extIdx;
                    matched = true;
                  }
                  threadIdx--;
                }
                extIdx--;
              }
              if (matched) break;
            }
          }

          const newMessages = matchEnd !== -1
            ? extractedMsgs.slice(matchEnd + 1)
            : [];

          if (newMessages.length > 0) {
            const newThreadMsgs: ThreadMessage[] = newMessages.map((m: { role: 'you' | 'them'; text: string }) => ({
              role: m.role,
              text: m.text,
              timestamp: Date.now(),
            }));

            setThread(prev => [...prev, ...newThreadMsgs]);
            setScreenshotPreview(null);
            setShowExamples(false);

            const youCount = newMessages.filter((m: { role: string }) => m.role === 'you').length;
            const themCount = newMessages.filter((m: { role: string }) => m.role === 'them').length;
            const parts = [];
            if (youCount > 0) parts.push(`${youCount} from you`);
            if (themCount > 0) parts.push(`${themCount} from them`);

            toast({
              title: `📷 Thread updated — ${newMessages.length} new message${newMessages.length !== 1 ? 's' : ''}`,
              description: parts.join(' and ') + ' added. Delete any that are wrong.',
            });

            // If the last new message is from them, set it in the textarea for easy generation
            const lastNew = newMessages[newMessages.length - 1];
            if (lastNew.role === 'them') {
              setMessage(lastNew.text);
            }

            return;
          } else {
            // No new messages found — tell the user
            setScreenshotPreview(null);
            toast({
              title: '📷 No new messages detected',
              description: 'This screenshot looks the same as your current thread. Send a new screenshot with more messages.',
            });
            return;
          }
        }

        // Reply mode: auto-generate replies via Screenshot Briefing
        toast({
          title: `📷 ${msgCount > 1 ? `${msgCount} messages read` : 'Message read'} — generating replies...`,
          description: data.platform !== 'unknown' ? `From ${data.platform}` : 'Reading your conversation',
        });

        // Step 2: Auto-generate replies using the extracted conversation
        const endpoint = (isPro && useV2) ? '/api/generate-v2' : '/api/generate';
        const genRes = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: data.extracted_text,
            context: selectedContext || 'crush',
            customContext: customContext.trim() || undefined,
          }),
        });

        const genData = await genRes.json();

        if (!genRes.ok) {
          throw new Error(genData.error || 'Generation failed');
        }

        // Parse replies from response
        let scanReplies: Reply[] = [];
        let scanStrategy: StrategyData = null;

        if (isPro && useV2 && genData.shorter && genData.spicier && genData.softer) {
          scanReplies = [
            { tone: 'shorter', text: genData.shorter },
            { tone: 'spicier', text: genData.spicier },
            { tone: 'softer', text: genData.softer },
          ];
          if (genData.strategy) {
            scanStrategy = genData.strategy;
          }
        } else if (Array.isArray(genData.replies) && genData.replies.length > 0) {
          scanReplies = genData.replies.filter((r: any) => r && r.tone && r.text);
        }

        if (scanReplies.length > 0) {
          // Auto-populate thread with extracted messages so user sees the conversation immediately
          const convoText = data.full_conversation || data.extracted_text;
          const convoLines = convoText.split('\n').filter((l: string) => l.trim());
          const threadMsgs: ThreadMessage[] = convoLines.map((line: string) => ({
            role: line.startsWith('You:') ? 'you' as const : 'them' as const,
            text: line.replace(/^(Them|You):\s*/, '').replace(/\s*\([^)]*\)\s*$/, '').trim(),
            timestamp: Date.now(),
          }));

          setThread(threadMsgs);
          setReplies(scanReplies);
          setStrategyData(scanStrategy);
          setExtractedPlatform(data.platform || null);
          setShowThread(true);
          setShowExamples(false);

          // Track usage
          const usageRes = await fetch('/api/usage');
          if (usageRes.ok) {
            const usageData = await usageRes.json();
            setUsageCount(usageData.usageCount);
            setRemainingReplies(usageData.remaining);
          }

          setScreenshotPreview(null);
          toast({
            title: `📷 ${msgCount} messages loaded — replies ready`,
            description: data.platform !== 'unknown' ? `From ${data.platform} · thread auto-saved` : 'Thread auto-saved',
          });
        } else {
          // Fallback: put text in textarea like before
          setMessage(data.extracted_text);
          setScreenshotPreview(null);
          toast({
            title: `📷 ${msgCount > 1 ? `${msgCount} messages extracted` : 'Message extracted'}`,
            description: 'Hit Generate to get replies',
          });
        }
      }
    } catch (error) {
      console.error('Screenshot extraction error:', error);
      toast({
        title: 'Scan failed',
        description: 'Something went wrong. Try pasting the message instead.',
        variant: 'destructive',
      });
      setScreenshotPreview(null);
    } finally {
      setExtracting(false);
      // Reset file input so the same file can be re-selected
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const clearScreenshot = () => {
    setScreenshotPreview(null);
    setExtractedPlatform(null);
  };

  // Continue in Thread from a scan result — hydrate thread with extracted messages
  const handleContinueInThread = () => {
    if (!scanResult) return;
    const lines = scanResult.fullConversation.split('\n').filter(l => l.trim());
    const newThread: ThreadMessage[] = lines.map(line => ({
      role: line.startsWith('You:') ? 'you' as const : 'them' as const,
      text: line.replace(/^(Them|You):\s*/, ''),
      timestamp: Date.now(),
    }));
    setThread(newThread);
    setReplies(scanResult.replies);
    setStrategyData(scanResult.strategy);
    setScanResult(null);
    setScreenshotPreview(null);
    setShowThread(true);
    setShowExamples(false);
    toast({ title: '✓ Loaded into thread', description: 'Pick a reply or keep the conversation going' });
  };

  // Decode message — "What Do They Mean?"
  const handleDecode = async () => {
    if (!message.trim()) {
      toast({ title: 'No message to decode', description: 'Paste or type a message first', variant: 'destructive' });
      return;
    }
    if (!isPro && decodeUsed >= decodeLimit) {
      setShowPaywall(true);
      toast({ title: '🔒 Daily decode used', description: 'Upgrade to Pro for unlimited decodes', variant: 'destructive' });
      return;
    }
    setDecoding(true);
    setDecodeResult(null);
    try {
      const res = await fetch('/api/decode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.trim(), context: selectedContext || 'crush', customContext: customContext.trim() || undefined }),
      });
      const data = await res.json();
      if (res.status === 429) {
        setShowPaywall(true);
        toast({ title: '🔒 Daily decode used', description: 'Upgrade to Pro for unlimited decodes', variant: 'destructive' });
        setDecodeUsed(decodeLimit);
        return;
      }
      if (data.error && !data.intent) {
        toast({ title: 'Decode failed', description: data.error, variant: 'destructive' });
        return;
      }
      setDecodeResult(data);
      setDecodeUsed(prev => prev + 1);
    } catch {
      toast({ title: 'Decode failed', description: 'Please try again', variant: 'destructive' });
    } finally {
      setDecoding(false);
    }
  };

  // Generate opening lines
  const handleGenerateOpeners = async () => {
    if (!isPro && openerUsed >= openerLimit) {
      setShowPaywall(true);
      toast({ title: '🔒 Daily opener used', description: 'Upgrade to Pro for unlimited openers', variant: 'destructive' });
      return;
    }
    setLoadingOpeners(true);
    setOpeners([]);
    try {
      const res = await fetch('/api/generate-opener', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: openerContext,
          description: openerDescription.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (res.status === 429) {
        setShowPaywall(true);
        toast({ title: '🔒 Daily opener used', description: 'Upgrade to Pro for unlimited openers', variant: 'destructive' });
        setOpenerUsed(openerLimit);
        return;
      }
      if (data.error) {
        toast({ title: 'Failed to generate openers', description: data.error, variant: 'destructive' });
        return;
      }
      setOpeners(data.openers || []);
      setOpenerUsed(prev => prev + 1);
      toast({ title: '✨ Openers ready!', description: 'Pick your favorite and send it' });
    } catch {
      toast({ title: 'Failed to generate openers', description: 'Please try again', variant: 'destructive' });
    } finally {
      setLoadingOpeners(false);
    }
  };

  // Revive a dead conversation
  const handleGenerateRevive = async () => {
    if (!message.trim()) {
      toast({ title: 'No conversation to revive', description: 'Paste the conversation or upload a screenshot first', variant: 'destructive' });
      return;
    }
    if (!isPro && reviveUsed >= reviveLimit) {
      setShowPaywall(true);
      toast({ title: '🔒 Daily revive used', description: 'Upgrade to Pro for unlimited revives', variant: 'destructive' });
      return;
    }
    setLoadingRevive(true);
    setReviveMessages([]);
    setReviveAnalysis('');
    try {
      const res = await fetch('/api/generate-revive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message.trim(),
          context: selectedContext || 'crush',
          customContext: customContext.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (res.status === 429) {
        setShowPaywall(true);
        toast({ title: '🔒 Daily revive used', description: 'Upgrade to Pro for unlimited revives', variant: 'destructive' });
        setReviveUsed(reviveLimit);
        return;
      }
      if (data.error && !data.revives) {
        toast({ title: 'Revive failed', description: data.error, variant: 'destructive' });
        return;
      }
      setReviveMessages(data.revives || []);
      setReviveAnalysis(data.analysis || '');
      setReviveUsed(prev => prev + 1);
      toast({ title: '✨ Revive messages ready!', description: 'Pick the one that feels right' });
    } catch {
      toast({ title: 'Revive failed', description: 'Please try again', variant: 'destructive' });
    } finally {
      setLoadingRevive(false);
    }
  };

  // ── Thread helpers ──────────────────────────────────────
  const buildThreadContext = (extraMessage?: string) => {
    const lines = thread.map(m => `${m.role === 'them' ? 'Them' : 'You'}: ${m.text}`);
    if (extraMessage) lines.push(`Them: ${extraMessage}`);
    return lines.join('\n');
  };

  const addToThread = (role: 'them' | 'you', text: string) => {
    setThread(prev => [...prev, { role, text, timestamp: Date.now() }]);
  };

  const handleMarkSent = (reply: Reply) => {
    addToThread('you', reply.text);
    setPendingSent(null);
    setCustomSent('');
    setShowCustomSent(false);
    setReplies([]);
    setDecodeResult(null);
    setStrategyData(null);
    setMessage('');
    setShowExamples(false);
    setShowThread(true);
    toast({ title: '✓ Added to thread', description: 'Now paste what they said back' });
    setTimeout(() => {
      inputAreaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
  };

  const handleCustomSentSubmit = () => {
    if (!customSent.trim()) return;
    addToThread('you', customSent.trim());
    setPendingSent(null);
    setCustomSent('');
    setShowCustomSent(false);
    setReplies([]);
    setDecodeResult(null);
    setStrategyData(null);
    setMessage('');
    setShowExamples(false);
    setShowThread(true);
    toast({ title: '✓ Added to thread', description: 'Now paste what they said back' });
    setTimeout(() => {
      inputAreaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
  };

  // Add "them" message to thread WITHOUT generating (for double texts)
  const handleAddTheirMessage = () => {
    if (!message.trim()) return;
    addToThread('them', message.trim());
    setMessage('');
    setShowThread(true);
    toast({ title: '✓ Added to thread', description: 'Add more or hit Generate when ready' });
  };

  // Add "you" message to thread directly (for when you sent something not from suggestions)
  const handleAddMyMessage = () => {
    if (!message.trim()) return;
    addToThread('you', message.trim());
    setMessage('');
    setShowThread(true);
    toast({ title: '✓ Your message added', description: 'Now paste what they said back' });
  };

  const handleDeleteThreadMessage = (index: number) => {
    setThread(prev => prev.filter((_, i) => i !== index));
    setSelectedThreadMsg(null);
    toast({ title: '✓ Message removed', description: 'You can re-add it with the correct sender' });
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

  const autoSaveThread = async () => {
    if (thread.length < 2) return;
    setSaving(true);
    try {
      const firstThem = thread.find(m => m.role === 'them');
      const autoName = activeThreadName || (firstThem ? firstThem.text.slice(0, 40) + (firstThem.text.length > 40 ? '...' : '') : 'Conversation');

      const res = await fetch('/api/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeThreadId || undefined,
          name: autoName,
          messages: thread.map(m => ({ role: m.role, text: m.text, timestamp: new Date(m.timestamp).toISOString() })),
          context: selectedContext,
          platform: extractedPlatform,
        }),
      });
      const data = await res.json();
      if (data.thread) {
        if (!activeThreadId) {
          setActiveThreadId(data.thread.id);
          setActiveThreadName(autoName);
        }
        fetchThreads();
      }
    } catch {} finally {
      setSaving(false);
    }
  };

  const autoSaveCoachSession = async () => {
    if (strategyChatHistory.length < 2) return;
    setSavingCoach(true);
    try {
      const firstUserMsg = strategyChatHistory.find(m => m.role === 'user');
      const autoName = firstUserMsg ? firstUserMsg.content.slice(0, 50) + (firstUserMsg.content.length > 50 ? '...' : '') : 'Coach session';

      const res = await fetch('/api/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeCoachSessionId || undefined,
          name: autoName,
          messages: strategyChatHistory.map(m => ({ role: m.role, content: m.content, draft: m.draft || null })),
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
      setSavingCoach(false);
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
      if (type === 'coach') {
        // Coach session — messages are already in {role, content, draft} format
        const coachMsgs: StrategyChatMessage[] = (msgs as any[]).map((m: any) => ({
          role: m.role === 'assistant' ? 'assistant' as const : 'user' as const,
          content: m.content || '',
          draft: m.draft || null,
        }));
        setStrategyChatHistory(coachMsgs);
      } else {
        // Thread session — convert {role: 'you'|'them', text} into coach chat format
        // "them" messages become user messages (they sent it), "you" messages become assistant suggestions
        const coachMsgs: StrategyChatMessage[] = (msgs as any[]).map((m: any) => {
          if (m.role === 'them') {
            return { role: 'user' as const, content: m.text || '' };
          } else {
            return { role: 'assistant' as const, content: m.text || '' };
          }
        });
        setStrategyChatHistory(coachMsgs);
      }

      setActiveCoachSessionId(saved.id);
      setActiveThreadId(null);
      setActiveThreadName(null);
      setThread([]);
      setReplies([]);
      setDecodeResult(null);
      setPendingSent(null);
      setMessage('');
      setShowThreads(false);
      setShowExamples(false);
      if (saved.context) setSelectedContext(saved.context as ContextType);
      toast({ title: 'Session loaded', description: saved.name });
    } catch {
      toast({ title: 'Failed to load', variant: 'destructive' });
    }
  };

  const handleDeleteThread = async (id: string) => {
    try {
      const res = await fetch(`/api/threads?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setSavedThreads(prev => prev.filter(t => t.id !== id));
      if (activeThreadId === id) {
        setActiveThreadId(null);
        setActiveThreadName(null);
        setThread([]);
      }
      if (activeCoachSessionId === id) {
        setActiveCoachSessionId(null);
        setStrategyChatHistory([]);
        setStrategyChatInput('');
      }
      toast({ title: '✓ Deleted' });
    } catch {
      toast({ title: 'Failed to delete thread', variant: 'destructive' });
    }
  };

  const handleRenameThread = async (newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed || !activeThreadId) {
      setEditingThreadName(false);
      return;
    }
    setActiveThreadName(trimmed);
    setEditingThreadName(false);
    try {
      await fetch('/api/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeThreadId,
          name: trimmed,
          messages: thread.map(m => ({ role: m.role, text: m.text, timestamp: new Date(m.timestamp).toISOString() })),
          context: selectedContext,
          platform: extractedPlatform,
        }),
      });
      fetchThreads();
      toast({ title: '✓ Thread renamed' });
    } catch {
      toast({ title: 'Rename failed', variant: 'destructive' });
    }
  };

  const handleNewThread = () => {
    setThread([]);
    setReplies([]);
    setStrategyData(null);
    setScanResult(null);
    setMessage('');
    setDecodeResult(null);
    setPendingSent(null);
    setActiveThreadId(null);
    setActiveThreadName(null);
    setShowThreads(false);
    setShowExamples(true);
    setReviveMessages([]);
    setReviveAnalysis('');
    setUserIntent('');
    setStrategyChatHistory([]);
    setStrategyChatInput('');
    setActiveCoachSessionId(null);
    setExtractedThread('');
    setExpandedCoachTrace(null);
    setCoachCopiedId(null);
    setCoachPipelineStep(null);
  };

  const copyCoachText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCoachCopiedId(id);
    toast({ title: '✓ Copied' });
    setTimeout(() => setCoachCopiedId(null), 2000);
  };

  const CoachScoreBar = ({ label, value, inverted = false }: { label: string; value: number; inverted?: boolean }) => {
    const displayValue = inverted ? 100 - value : value;
    const color =
      displayValue >= 80 ? 'bg-emerald-500' : displayValue >= 60 ? 'bg-amber-500' : 'bg-red-500';
    return (
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-white/40 w-20 shrink-0">{label}</span>
        <div className="flex-1 h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
          <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${displayValue}%` }} />
        </div>
        <span className="text-[10px] text-white/50 w-8 text-right">{value}</span>
      </div>
    );
  };

  const handleCoachScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setCoachScreenshotExtracting(true);
    try {
      // Read all files as base64 for thumbnails AND extraction
      const fileData = await Promise.all(files.map(async (file) => {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        return base64;
      }));

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
        return data.full_conversation || null;
      }));
      const extracted = results.filter(Boolean);

      if (extracted.length > 0) {
        setStrategyChatLoading(true);
        const threadText = extracted.join('\n\n');
        setExtractedThread(threadText);

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
                relationshipContext: selectedContext || 'crush',
                mode: 'orchestrate',
              }),
            });
            clearTimeout(stepTimer);
            clearTimeout(stepTimer2);

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed');

            if (data.mode === 'orchestrate') {
              setStrategyChatHistory(prev => [...prev, { role: 'assistant', content: '', orchestration: data }]);
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
              setStrategyChatHistory(prev => [...prev, { role: 'assistant', content: data.reply, draft: data.draft }]);
            }
          } else {
            // Free: Use strategy-chat (single coach call)
            const contextMsg = extracted.length === 1
              ? `Here's the conversation from the screenshot:\n${extracted[0]}`
              : `Here's the conversation from ${extracted.length} screenshots:\n${extracted.map((t: string, i: number) => `[Screenshot ${i + 1}]\n${t}`).join('\n\n')}`;
            const threadContext = thread.map(m => `${m.role === 'you' ? 'You' : 'Them'}: ${m.text}`).join('\n');
            const res = await fetch('/api/strategy-chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                threadContext,
                strategy: strategyData,
                context: selectedContext || 'crush',
                chatHistory: richHistory,
                userMessage: contextMsg,
              }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed');
            setStrategyChatHistory(prev => [...prev, { role: 'assistant', content: data.reply, draft: data.draft }]);
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
        }
      } else {
        toast({ title: 'Could not read screenshots', description: 'Try clearer images', variant: 'destructive' });
        // Remove the image message since extraction failed
        setStrategyChatHistory(prev => prev.slice(0, -1));
      }
    } catch {
      toast({ title: 'Upload failed', description: 'Try again', variant: 'destructive' });
    } finally {
      setCoachScreenshotExtracting(false);
      if (coachFileInputRef.current) coachFileInputRef.current.value = '';
    }
  };

  const handleStrategyChatSend = async () => {
    if (!strategyChatInput.trim() || strategyChatLoading) return;
    const userMsg = strategyChatInput.trim();
    setStrategyChatInput('');
    setStrategyChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setStrategyChatLoading(true);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

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
            relationshipContext: selectedContext || 'crush',
            mode: 'chat',
          }),
          signal: controller.signal,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed');
        if (data.mode === 'orchestrate') {
          setStrategyChatHistory(prev => [...prev, { role: 'assistant', content: '', orchestration: data }]);
          if (data.strategy) {
            setStrategyData({
              momentum: data.strategy.momentum,
              balance: data.strategy.balance,
              move: data.strategy.move,
              latencyMs: data.latency?.total || 0,
            });
          }
        } else {
          setStrategyChatHistory(prev => [...prev, { role: 'assistant', content: data.reply, draft: data.draft }]);
        }
      } else {
        // Free users or no thread — use strategy-chat
        const threadContext = thread.map(m => `${m.role === 'you' ? 'You' : 'Them'}: ${m.text}`).join('\n');
        const res = await fetch('/api/strategy-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            threadContext: extractedThread || threadContext,
            strategy: strategyData,
            context: selectedContext || 'crush',
            chatHistory: richHistory,
            userMessage: userMsg,
          }),
          signal: controller.signal,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed');
        setStrategyChatHistory(prev => [...prev, { role: 'assistant', content: data.reply, draft: data.draft }]);
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
    }
  };

  const handleTryAgain = () => {
    setMessage('');
    setReplies([]);
    setCopied(null);
    setShowExamples(true);
    setScreenshotPreview(null);
    setExtractedPlatform(null);
    setDecodeResult(null);
    setOpeners([]);
    setReviveMessages([]);
    setReviveAnalysis('');
  };

  const handleExampleClick = (example: string) => {
    setMessage(example);
    setShowExamples(false);
  };

  // Handle Stripe checkout
  const handleCheckout = async (plan: 'weekly' | 'monthly' | 'annual') => {
    // Require login before checkout
    if (!userId) {
      toast({
        title: 'Account Required',
        description: 'Please sign up or log in first to subscribe',
      });
      window.location.href = `/login?redirect=/pricing&plan=${plan}`;
      return;
    }
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, userId, userEmail }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast({
          title: 'Error',
          description: 'Failed to start checkout',
          variant: 'destructive',
        });
      }
    } catch (error) {
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
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-white/95 backdrop-blur rounded-3xl overflow-hidden">
          <CardContent className="p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto">
              <span className="text-3xl">🛡️</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Unusual Activity Detected</h2>
              <p className="text-gray-600">We noticed multiple connections from different locations.</p>
              <p className="text-sm text-gray-400 mt-2">This can happen with VPNs or shared networks.</p>
            </div>
            <div className="space-y-3">
              <Button 
                onClick={() => handleCheckout('weekly')}
                className="w-full h-14 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg rounded-2xl"
              >
                Unlock Pro - No Limits
              </Button>
              <p className="text-xs text-gray-500">Pro users get unlimited access from anywhere</p>
            </div>
            <button onClick={() => setVpnBlocked(false)} className="text-sm text-gray-400 hover:text-gray-600">
              Try again later
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Paywall Modal
  if (showPaywall) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-white/95 backdrop-blur rounded-3xl overflow-hidden">
          <CardContent className="p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mx-auto">
              <Crown className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">You&apos;ve used all 3 free replies</h2>
              <p className="text-gray-600">Unlock unlimited replies + full style control</p>
              <p className="text-sm text-gray-400 mt-2">Free replies reset in 24 hours</p>
            </div>
            <div className="space-y-3">
              <Button 
                onClick={() => handleCheckout('annual')}
                className="w-full h-14 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg rounded-2xl relative"
              >
                <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">Best Value</span>
                Unlock Pro - $99.99/year
              </Button>
              <Button 
                onClick={() => handleCheckout('weekly')}
                variant="outline"
                className="w-full h-12 border-2 border-purple-300 text-purple-700 font-semibold rounded-2xl hover:bg-purple-50"
              >
                $9.99/week
              </Button>
              <p className="text-xs text-gray-500">Cancel anytime</p>
            </div>
            <button onClick={() => setShowPaywall(false)} className="text-sm text-gray-400 hover:text-gray-600">
              Wait for reset
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Ambient background mesh */}
      <div className="fixed inset-0 pointer-events-none hidden md:block">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-violet-600/8 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-fuchsia-600/8 blur-[120px]" />
        <div className="absolute top-[40%] left-[50%] w-[40%] h-[40%] rounded-full bg-cyan-600/5 blur-[100px]" />
      </div>
      <div className="fixed inset-0 pointer-events-none md:hidden">
        <div className="absolute top-[-10%] left-[-5%] w-[50%] h-[50%] rounded-full bg-violet-600/6 blur-[80px]" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[40%] h-[40%] rounded-full bg-fuchsia-600/6 blur-[80px]" />
      </div>

      <div className={`relative z-10 mx-auto px-5 py-6 pb-[max(3.5rem,env(safe-area-inset-bottom,3.5rem))] max-w-lg md:max-w-2xl ${usageCount > 0 && !isPro ? 'pt-20' : ''}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href={userId ? '/dashboard' : '/pricing'} className="w-10 h-10 rounded-2xl bg-white/[0.08] border border-white/[0.12] flex items-center justify-center hover:bg-white/15 transition-all active:scale-90">
            <ArrowLeft className="h-5 w-5 text-white/70" />
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/" className="transition-transform hover:scale-105">
              <Logo size="sm" showText={true} />
            </Link>
            <Link href="/changelog" className="px-2.5 py-1 rounded-xl bg-white/[0.08] border border-white/[0.12] text-[10px] font-bold text-white/50 hover:text-white/80 transition-colors">
              v{CURRENT_VERSION}
            </Link>
          </div>
          <Link href="/profile" className="w-10 h-10 rounded-2xl bg-white/[0.08] border border-white/[0.12] flex items-center justify-center hover:bg-white/15 transition-all active:scale-90">
            <Crown className="h-5 w-5 text-white/70" />
          </Link>
        </div>

        {/* Trial Banner - shows for invite/beta trial users */}
        {isPro && trialDaysLeft !== null && (
          <div className={`mb-4 p-4 rounded-2xl backdrop-blur border transition-all duration-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
            trialDaysLeft <= 1 
              ? 'bg-gradient-to-r from-red-500/20 to-orange-500/20 border-red-500/30'
              : trialDaysLeft <= 3
                ? 'bg-gradient-to-r from-orange-500/20 to-yellow-500/20 border-orange-500/30'
                : 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                trialDaysLeft <= 1 ? 'bg-red-500' : trialDaysLeft <= 3 ? 'bg-orange-500' : 'bg-purple-500'
              }`}>
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-sm">
                  {trialDaysLeft <= 0 
                    ? 'Your free trial expires today!' 
                    : trialDaysLeft === 1 
                      ? '1 day left on your free trial' 
                      : `${trialDaysLeft} days left on your free trial`}
                </p>
                <p className="text-white/50 text-xs">Unlimited V2 verified replies</p>
              </div>
            </div>
            {trialDaysLeft <= 3 && (
              <Button asChild size="sm" className="bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs">
                <Link href="/pricing">Keep Pro</Link>
              </Button>
            )}
          </div>
        )}

        {/* Pro Status Badge - Compact */}
        {isPro && (
          <div className={`mb-5 px-4 py-3 rounded-2xl flex items-center justify-center gap-2.5 ${
            useV2 ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-violet-500/10 border border-violet-500/20'
          }`}>
            {useV2 ? <Shield className="h-4 w-4 text-emerald-400" /> : <Zap className="h-4 w-4 text-violet-400" />}
            <span className={`text-xs font-bold ${useV2 ? 'text-emerald-300' : 'text-violet-300'}`}>{useV2 ? 'V2 Verified' : 'V1 Fast Mode'}</span>
            <span className="text-white/15">·</span>
            <span className={`text-xs ${useV2 ? 'text-emerald-400/60' : 'text-violet-400/60'}`}>{useV2 ? '≤18 words · No emojis · Tone-checked' : 'Quick replies · No strategy overhead'}</span>
          </div>
        )}

        {/* Usage Bar - Hidden for Pro users */}
        {usageCount > 0 && !isPro && (
          <div className={`fixed top-0 left-0 right-0 z-50 text-white animate-in slide-in-from-top duration-300 ${
            usageCount >= usageLimit 
              ? 'bg-[#1a0a0f] border-b border-red-500/30' 
              : 'bg-[#0f0a1a] border-b border-violet-500/20'
          }`}>
            <div className="mx-auto px-5 py-2.5">
              <div className="flex items-center justify-between max-w-2xl mx-auto">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">{usageCount >= usageLimit ? '🚫' : '⚡'}</span>
                  <div>
                    <p className="text-sm font-bold">
                      {usageCount >= usageLimit 
                        ? 'Free limit reached' 
                        : `${remainingReplies} free ${remainingReplies === 1 ? 'reply' : 'replies'} left today`}
                    </p>
                    <p className="text-xs text-white/60">
                      {Math.min(usageCount, usageLimit)}/{usageLimit} used
                    </p>
                  </div>
                </div>
                {usageCount >= usageLimit - 1 && (
                  <Button 
                    asChild
                    size="sm" 
                    className="bg-white/10 border border-white/20 text-white hover:bg-white/20 font-bold rounded-xl text-xs h-8"
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

        {/* Feature Tour — shows once on first visit */}
        <FeatureTour />

        {/* ── COACH SECTION — Apple iMessage pattern: header / scrollable content / pinned input ── */}
        <div className="rounded-3xl bg-white/[0.04] border border-white/[0.08] overflow-hidden flex flex-col" style={{ height: 'calc(100dvh - 14.5rem)' }}>
          {/* Hidden file inputs */}
          <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp" onChange={handleScreenshotUpload} className="hidden" aria-label="Upload screenshot" />
          <input ref={coachFileInputRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp" multiple onChange={handleCoachScreenshotUpload} className="hidden" />

          {/* ─ Header — always visible, compact, personalized ─ */}
          <div className="shrink-0 pt-5 pb-3 px-6 border-b border-white/[0.06]">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                {userName ? (
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-[13px] font-black text-white shadow-sm shadow-violet-500/30">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                ) : (
                  <Sparkles className="h-5 w-5 text-violet-400 animate-pulse" />
                )}
                Coach
              </h2>
              {isPro && (
                <button
                  onClick={() => setUseV2(v => !v)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all border ${
                    useV2 ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/20' : 'bg-violet-500/10 border-violet-500/25 text-violet-400 hover:bg-violet-500/20'
                  }`}
                >
                  {useV2 ? <Shield className="h-3 w-3" /> : <Zap className="h-3 w-3" />}
                  {useV2 ? 'V2 On' : 'V1 On'}
                </button>
              )}
            </div>
            <p className="text-sm text-white/40">
              {userName ? `What's up ${userName.split(' ')[0]}? ` : ''}Drop a screenshot, paste, or pick a scenario
            </p>

            {/* Strategy Status Indicator — only visible when Coach has strategy data */}
            {strategyData && (
              <div className="flex items-center gap-3 mt-3 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] animate-in fade-in slide-in-from-top-1 duration-300">
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
                        <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">{sd.momentum}</span>
                      </div>
                      <div className="w-px h-3 bg-white/[0.08]" />
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full transition-all duration-500 ${balanceColor}`} />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">{sd.balance}</span>
                      </div>
                      <div className="w-px h-3 bg-white/[0.08]" />
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full transition-all duration-500 ${energyColor}`} />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">{sd.move.energy.replace('_', ' ')}</span>
                      </div>
                      {sd.move.risk && sd.move.risk !== 'low' && (
                        <>
                          <div className="w-px h-3 bg-white/[0.08]" />
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
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
          <div className="flex-1 overflow-y-auto px-6 py-3 min-h-0">
            {/* Contextual hint — inside card so it doesn't push card below safe area */}
            <ContextualHints
              hasMessage={!!message.trim()}
              hasReplies={replies.length > 0}
              appMode={appMode}
              onAction={(hintId) => {
                if (hintId === 'screenshot') coachFileInputRef.current?.click();
              }}
            />

            {/* Loading session overlay */}
            {loadingSession && (
              <div className="flex items-center justify-center py-16">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-violet-400" />
                  <span className="text-sm text-white/40 font-medium">Loading session...</span>
                </div>
              </div>
            )}

            {/* Smart Preview — inside scrollable area, above chips */}
            {!loadingSession && strategyChatHistory.length === 0 && (() => {
              const preview = getSmartPreview();
              if (!preview) return null;
              return (
                <button
                  onClick={() => {
                    if (preview.type === 'thread' && preview.thread) {
                      // Pre-fill coach input with thread context rather than loading the old session
                      setStrategyChatInput(`Help me with ${preview.thread.name || 'my last conversation'}`);
                    } else {
                      setStrategyChatInput(preview.text.replace('?', ''));
                    }
                    setSmartPreviewDismissed(true);
                  }}
                  className="w-full mb-3 p-3.5 rounded-2xl bg-gradient-to-r from-violet-500/[0.08] to-fuchsia-500/[0.08] border border-violet-500/15 hover:border-violet-500/30 hover:from-violet-500/[0.12] hover:to-fuchsia-500/[0.12] transition-all active:scale-[0.98] text-left group animate-in fade-in duration-500"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-base shrink-0">{preview.emoji}</span>
                      <div className="min-w-0">
                        <p className="text-[12px] font-semibold text-white/80 truncate">{preview.text}</p>
                        <p className="text-[10px] text-white/35 mt-0.5">{preview.sub}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <span className="text-[9px] text-violet-400/60 font-bold uppercase tracking-wider group-hover:text-violet-400 transition-colors">
                        {preview.type === 'thread' ? 'Ask about it' : 'Try it'}
                      </span>
                      <ArrowRight className="h-3 w-3 text-violet-400/40 group-hover:text-violet-400 transition-all" />
                    </div>
                  </div>
                </button>
              );
            })()}

            {/* Scenario chips — only when no chat history */}
            {!loadingSession && strategyChatHistory.length === 0 && (() => {
              const h = new Date().getHours();
              const isEvening = h >= 18 || h < 5;
              const isWeekend = [0, 5, 6].includes(new Date().getDay());
              const hasThread = savedThreads.length > 0;
              const threadName = hasThread ? savedThreads[0]?.name?.split(' ').slice(0, 2).join(' ') : '';
              const cat = getContextCategory(selectedContext);
              const chips = cat === 'professional' ? [
                { emoji: '💼', label: 'Draft the message', sub: 'Clear ask, right tone', prompt: 'Help me write a professional message', glow: true },
                { emoji: '📋', label: 'Follow up', sub: 'Without being pushy', prompt: 'How do I follow up on this without looking desperate?', glow: false },
                { emoji: '🤝', label: 'Push back', sub: 'Professionally', prompt: 'Help me disagree or push back on this professionally', glow: false },
                { emoji: '🔍', label: 'Decode this', sub: 'What do they actually mean?', prompt: 'Decode this work message for me — what are they really saying?', glow: false },
                { emoji: '⚡', label: 'Make it shorter', sub: 'Cut the fluff', prompt: 'Make this message shorter and more direct', glow: false },
                { emoji: '🎯', label: 'Nail the tone', sub: 'Calibrate for your audience', prompt: 'Is this the right tone for my boss / coworker?', glow: false },
              ] : cat === 'platonic' ? [
                { emoji: '🤝', label: 'Reach back out', sub: hasThread ? `Reconnect with ${threadName}` : 'Without making it weird', prompt: "Help me reach back out to a friend I haven't talked to in a while", glow: hasThread },
                { emoji: '💬', label: "What'd they say?", sub: 'Craft the right reply', prompt: 'Help me reply to this message', glow: false },
                { emoji: '🔍', label: 'Decode this', sub: 'Read between the lines', prompt: 'Decode their message for me — what does it really mean?', glow: false },
                { emoji: '😬', label: 'Fix the awkward', sub: 'Address it and move on', prompt: 'Help me address an awkward situation with my friend', glow: false },
                { emoji: '💚', label: 'Check in', sub: 'Warm but not intense', prompt: 'Write me a genuine check-in message — warm but no pressure', glow: isWeekend },
                { emoji: '📊', label: 'Read the situation', sub: 'Where do things stand?', prompt: 'Read this conversation and tell me where things stand with my friend', glow: false },
              ] : [
                { emoji: '💬', label: "What'd they say?", sub: hasThread ? `Reply to ${threadName}` : 'Craft the perfect reply', prompt: 'Help me reply to this message', glow: hasThread },
                { emoji: '🔍', label: 'Decode this', sub: hasThread ? `Decode ${threadName}'s message` : 'Read between the lines', prompt: 'Decode their message for me', glow: false },
                { emoji: '✨', label: isEvening ? 'Flirty opener 🔥' : 'Start the convo', sub: isEvening ? 'Prime time to move' : 'Break the ice', prompt: isEvening ? 'Write me a flirty opener for tonight' : 'Write me a great opener', glow: isEvening },
                { emoji: '🔥', label: 'Revive dead chat', sub: isWeekend ? 'Weekend = perfect timing' : 'Bring it back', prompt: 'Help me revive a dead conversation', glow: isWeekend },
                { emoji: '🎯', label: 'Am I being played?', sub: 'Get an honest read', prompt: 'Am I being played or are they genuinely interested?', glow: false },
                { emoji: '📊', label: 'Read the situation', sub: 'Full vibe analysis', prompt: 'Read this convo and tell me where I stand', glow: false },
              ];
              return (
                <div className="grid grid-cols-2 gap-2">
                  {chips.map(chip => (
                    <button
                      key={chip.label}
                      onClick={() => setStrategyChatInput(chip.prompt)}
                      className={`px-3 py-2.5 rounded-xl text-left transition-all active:scale-95 border ${
                        chip.glow
                          ? 'bg-violet-500/[0.10] border-violet-500/25 hover:bg-violet-500/[0.18] hover:border-violet-500/40 shadow-sm shadow-violet-500/10'
                          : 'bg-white/[0.07] border-white/[0.12] hover:bg-white/[0.12]'
                      }`}
                    >
                      <p className="text-[12px] font-semibold text-white/70 leading-snug">
                        <span className="mr-1">{chip.emoji}</span>{chip.label}
                      </p>
                      <p className="text-[10px] text-white/30 mt-0.5 leading-tight">{chip.sub}</p>
                    </button>
                  ))}
                </div>
              );
            })()}

            {/* Chat history */}
            {!loadingSession && strategyChatHistory.length > 0 && (
              <div className="space-y-4">
                {strategyChatHistory.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                    <div className={`max-w-[90%] flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                      {/* Inline image thumbnails */}
                      {msg.images && msg.images.length > 0 && (
                        <div className={`flex gap-2 flex-wrap ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in zoom-in-95 duration-500`}>
                          {msg.images.map((img, imgIdx) => (
                            <div key={imgIdx} className="relative rounded-2xl overflow-hidden border border-white/[0.10] shadow-xl shadow-black/40 max-w-[180px] hover:scale-[1.02] transition-transform">
                              <img src={img} alt={`Screenshot ${imgIdx + 1}`} className="w-full h-auto max-h-[240px] object-cover" />
                              <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/[0.08]" />
                            </div>
                          ))}
                        </div>
                      )}
                      {/* Message bubble — skip if empty (orchestration-only messages) */}
                      {msg.content && (
                        <div className={`px-4 py-3 rounded-2xl text-[14px] leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white rounded-br-md shadow-md shadow-violet-500/20'
                            : 'bg-white/[0.07] text-white/90 border border-white/[0.08] rounded-bl-md'
                        }`}>
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      )}

                      {/* ── Orchestration results (full pipeline — Pro) ── */}
                      {msg.orchestration && (() => {
                        const orch = msg.orchestration;
                        const isExp = expandedCoachTrace === i;
                        return (
                          <div className="w-full space-y-2">
                            {/* Strategy pills */}
                            <div className="flex flex-wrap gap-1.5 px-1">
                              <span className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full ${
                                orch.strategy.momentum === 'Rising' ? 'bg-emerald-500/15 text-emerald-400' :
                                orch.strategy.momentum === 'Declining' || orch.strategy.momentum === 'Stalling' ? 'bg-red-500/15 text-red-400' :
                                'bg-white/[0.08] text-white/50'
                              }`}>
                                {orch.strategy.momentum === 'Rising' ? <TrendingUp className="h-2.5 w-2.5" /> : orch.strategy.momentum === 'Declining' || orch.strategy.momentum === 'Stalling' ? <TrendingDown className="h-2.5 w-2.5" /> : <Minus className="h-2.5 w-2.5" />}
                                {orch.strategy.momentum}
                              </span>
                              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/[0.08] text-white/50">{orch.strategy.balance}</span>
                              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                                orch.strategy.move.energy === 'pull_back' ? 'bg-orange-500/15 text-orange-400' :
                                orch.strategy.move.energy === 'escalate' ? 'bg-emerald-500/15 text-emerald-400' :
                                'bg-violet-500/15 text-violet-300'
                              }`}>{orch.strategy.move.energy.replace('_', ' ')}</span>
                              {orch.strategy.move.risk === 'high' && (
                                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-red-500/15 text-red-400">⚠ high risk</span>
                              )}
                            </div>
                            <p className="text-[12px] text-white/50 italic px-1">&ldquo;{orch.strategy.move.one_liner}&rdquo;</p>

                            {/* Winner card */}
                            {orch.winner && (
                              <div className="relative">
                                <div className="absolute -top-1.5 left-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 z-10">
                                  <Trophy className="h-2.5 w-2.5 text-amber-400" />
                                  <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider">Winner</span>
                                </div>
                                <button
                                  onClick={() => copyCoachText(orch.winner!.text, `w-${i}`)}
                                  className="w-full text-left mt-1 px-4 pt-5 pb-3 rounded-xl bg-amber-500/[0.08] border border-amber-500/20 hover:bg-amber-500/[0.12] hover:border-amber-500/35 transition-all active:scale-[0.98] group"
                                >
                                  <div className="flex items-center justify-between mb-1.5">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STYLE_CONFIG[orch.winner.style]?.color || 'bg-white/10 text-white/50'}`}>
                                      {STYLE_CONFIG[orch.winner.style]?.emoji} {STYLE_CONFIG[orch.winner.style]?.label || orch.winner.style}
                                    </span>
                                    <span className="text-[10px] text-amber-400/50 group-hover:text-amber-400 transition-colors">
                                      {coachCopiedId === `w-${i}` ? <Check className="h-3 w-3" /> : 'Copy →'}
                                    </span>
                                  </div>
                                  <p className="text-[14px] text-white/90 font-medium">{orch.winner.text}</p>
                                  {orch.winner_reason && <p className="text-[10px] text-amber-400/40 mt-1.5">💡 {orch.winner_reason}</p>}
                                </button>
                              </div>
                            )}

                            {/* Backup card */}
                            {orch.backup && orch.backup.text !== orch.winner?.text && (
                              <button
                                onClick={() => copyCoachText(orch.backup!.text, `b-${i}`)}
                                className="w-full text-left px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.07] transition-all active:scale-[0.98] group"
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-bold text-white/30 uppercase tracking-wider">Backup</span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STYLE_CONFIG[orch.backup.style]?.color || 'bg-white/10 text-white/50'}`}>
                                      {STYLE_CONFIG[orch.backup.style]?.emoji} {STYLE_CONFIG[orch.backup.style]?.label || orch.backup.style}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-white/30 group-hover:text-white/60 transition-colors">
                                    {coachCopiedId === `b-${i}` ? <Check className="h-3 w-3" /> : 'Copy →'}
                                  </span>
                                </div>
                                <p className="text-[13px] text-white/70">{orch.backup.text}</p>
                              </button>
                            )}

                            {/* Expand/collapse all candidates */}
                            <button
                              onClick={() => setExpandedCoachTrace(isExp ? null : i)}
                              className="flex items-center gap-1.5 px-2 py-1 text-[10px] text-white/25 hover:text-white/50 transition-colors"
                            >
                              {isExp ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                              {isExp ? 'Hide' : 'Show'} all {orch.candidates?.length || 0} candidates + scores
                              <span className="text-white/15 ml-1">{orch.latency.total}ms</span>
                            </button>

                            {/* Expanded trace */}
                            {isExp && (
                              <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                {/* Context extraction */}
                                <div className="px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                                  <p className="text-[9px] font-bold text-white/25 uppercase tracking-wider mb-2">Context Extraction</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-white/40">tone: {orch.context_extraction.her_tone}</span>
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-white/40">topic: {orch.context_extraction.topic}</span>
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-white/40">goal: {orch.context_extraction.goal_detected}</span>
                                  </div>
                                  {orch.context_extraction.must_acknowledge.length > 0 && (
                                    <div className="mt-1.5">
                                      <p className="text-[9px] text-red-400/50 font-bold">Must acknowledge:</p>
                                      {orch.context_extraction.must_acknowledge.map((a, idx) => (
                                        <p key={idx} className="text-[10px] text-white/35 ml-2">• {a}</p>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                {/* All candidates with scores */}
                                {orch.candidates?.map((c, cIdx) => (
                                  <button
                                    key={cIdx}
                                    onClick={() => copyCoachText(c.text, `c-${i}-${cIdx}`)}
                                    className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all active:scale-[0.98] group ${
                                      cIdx === orch.winner_id ? 'bg-amber-500/[0.06] border-amber-500/20' :
                                      cIdx === orch.backup_id ? 'bg-white/[0.03] border-white/[0.08]' :
                                      'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.04]'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between mb-1.5">
                                      <div className="flex items-center gap-1.5">
                                        {cIdx === orch.winner_id && <Trophy className="h-3 w-3 text-amber-400" />}
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STYLE_CONFIG[c.style]?.color || 'bg-white/10 text-white/50'}`}>
                                          {STYLE_CONFIG[c.style]?.emoji} {STYLE_CONFIG[c.style]?.label || c.style}
                                        </span>
                                        <span className="text-[9px] text-white/20">{c.word_count}w</span>
                                      </div>
                                      <span className="text-[10px] text-white/20 group-hover:text-white/50 transition-colors">
                                        {coachCopiedId === `c-${i}-${cIdx}` ? <Check className="h-3 w-3 text-emerald-400" /> : 'Copy'}
                                      </span>
                                    </div>
                                    <p className="text-[13px] text-white/75 mb-2">{c.text}</p>
                                    <div className="space-y-1">
                                      <CoachScoreBar label="Neediness" value={c.scores.neediness_risk} inverted />
                                      <CoachScoreBar label="Clarity" value={c.scores.clarity} />
                                      <CoachScoreBar label="Forward" value={c.scores.forward_motion} />
                                      <CoachScoreBar label="Tone match" value={c.scores.tone_match} />
                                    </div>
                                    {c.notes && <p className="text-[9px] text-white/20 mt-1.5">{c.notes}</p>}
                                  </button>
                                ))}
                                <div className="flex gap-3 px-2 text-[9px] text-white/15">
                                  <span>Strategy: {orch.latency.strategy}ms</span>
                                  <span>Gen: {orch.latency.generation}ms</span>
                                  <span>Critic: {orch.latency.critic}ms</span>
                                  <span className="text-white/25 font-bold">Total: {orch.latency.total}ms</span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Strategy badges — only for non-orchestration coach responses */}
                      {msg.role === 'assistant' && !msg.orchestration && strategyData && i === strategyChatHistory.length - 1 && (
                        <div className="flex flex-wrap gap-1.5 px-1">
                          <span className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full ${
                            strategyData.momentum === 'Rising' ? 'bg-emerald-500/15 text-emerald-400' :
                            strategyData.momentum === 'Declining' || strategyData.momentum === 'Stalling' ? 'bg-red-500/15 text-red-400' :
                            'bg-white/[0.08] text-white/50'
                          }`}>
                            {strategyData.momentum === 'Rising' ? <TrendingUp className="h-2.5 w-2.5" /> : strategyData.momentum === 'Declining' || strategyData.momentum === 'Stalling' ? <TrendingDown className="h-2.5 w-2.5" /> : <Minus className="h-2.5 w-2.5" />}
                            {strategyData.momentum}
                          </span>
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/[0.08] text-white/50">{strategyData.balance}</span>
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                            strategyData.move.energy === 'pull_back' ? 'bg-orange-500/15 text-orange-400' :
                            strategyData.move.energy === 'escalate' ? 'bg-emerald-500/15 text-emerald-400' :
                            'bg-violet-500/15 text-violet-300'
                          }`}>{strategyData.move.energy.replace('_', ' ')}</span>
                        </div>
                      )}

                      {/* Draft reply cards (free tier / coaching mode) */}
                      {msg.role === 'assistant' && msg.draft && (msg.draft.shorter || msg.draft.spicier || msg.draft.softer) && (() => {
                        const draftLabels = DRAFT_LABELS[getContextCategory(selectedContext)];
                        return (
                        <div className="w-full space-y-2">
                          <p className="text-[10px] text-emerald-400/70 font-bold uppercase tracking-wider px-1">Coach drafts</p>
                          {msg.draft.shorter && (
                            <button onClick={() => { navigator.clipboard.writeText(msg.draft!.shorter!); toast({ title: '⚡ Copied' }); }} className="w-full text-left px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.10] hover:bg-white/[0.09] hover:border-violet-500/30 transition-all active:scale-[0.98] group">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">⚡ {draftLabels.a}</span>
                                <span className="text-[10px] text-violet-400/50 group-hover:text-violet-400 transition-colors">Copy →</span>
                              </div>
                              <p className="text-[13px] text-white/80">{msg.draft.shorter}</p>
                            </button>
                          )}
                          {msg.draft.spicier && (
                            <button onClick={() => { navigator.clipboard.writeText(msg.draft!.spicier!); toast({ title: '✓ Copied' }); }} className="w-full text-left px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.10] hover:bg-white/[0.09] hover:border-orange-500/30 transition-all active:scale-[0.98] group">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">🔥 {draftLabels.b}</span>
                                <span className="text-[10px] text-orange-400/50 group-hover:text-orange-400 transition-colors">Copy →</span>
                              </div>
                              <p className="text-[13px] text-white/80">{msg.draft.spicier}</p>
                            </button>
                          )}
                          {msg.draft.softer && (
                            <button onClick={() => { navigator.clipboard.writeText(msg.draft!.softer!); toast({ title: '✓ Copied' }); }} className="w-full text-left px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.10] hover:bg-white/[0.09] hover:border-emerald-500/30 transition-all active:scale-[0.98] group">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">💚 {draftLabels.c}</span>
                                <span className="text-[10px] text-emerald-400/50 group-hover:text-emerald-400 transition-colors">Copy →</span>
                              </div>
                              <p className="text-[13px] text-white/80">{msg.draft.softer}</p>
                            </button>
                          )}
                        </div>
                        );
                      })()}
                    </div>
                  </div>
                ))}
                {strategyChatLoading && (
                  <div className="flex justify-start">
                    <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-white/[0.07] border border-white/[0.08] flex items-center gap-2">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-400" />
                      <span className="text-[13px] text-white/40">
                        {coachPipelineStep === 'analyzing' ? 'Analyzing conversation...' :
                         coachPipelineStep === 'generating' ? 'Generating 6 candidates...' :
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

          {/* ─ Context selector row ─ */}
          <div className="shrink-0 px-6 pt-3 pb-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-white/25 font-bold uppercase tracking-wider shrink-0">Who?</span>
              {CONTEXT_OPTIONS.map((ctx) => (
                <button
                  key={ctx.value}
                  onClick={() => setSelectedContext(selectedContext === ctx.value ? null : ctx.value as ContextType)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all active:scale-95 ${
                    selectedContext === ctx.value
                      ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                      : 'bg-white/[0.05] text-white/35 border border-white/[0.08] hover:bg-white/[0.10] hover:text-white/60'
                  }`}
                >
                  {ctx.emoji} {ctx.label}
                </button>
              ))}
              {selectedContext && (() => {
                const cat = getContextCategory(selectedContext);
                const catColor = cat === 'professional' ? 'text-amber-400/70' : cat === 'platonic' ? 'text-blue-400/70' : 'text-pink-400/70';
                const catIcon = cat === 'professional' ? '💼' : cat === 'platonic' ? '🤝' : '💘';
                return <span className={`text-[10px] font-bold ml-1 ${catColor}`}>{catIcon} {cat}</span>;
              })()}
            </div>
          </div>

          {/* ─ Input — pinned at bottom, never cut off ─ */}
          <div className="shrink-0 px-6 pb-5 pt-2 border-t border-white/[0.06]">
            <div className="flex items-end gap-2">
              <button
                onClick={() => coachFileInputRef.current?.click()}
                disabled={coachScreenshotExtracting}
                className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.10] flex items-center justify-center text-white/35 hover:text-white/70 hover:bg-white/[0.10] transition-all active:scale-90 shrink-0 disabled:opacity-40"
                title="Upload screenshot"
              >
                {coachScreenshotExtracting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              </button>
              <textarea
                ref={coachTextareaRef}
                value={strategyChatInput}
                onChange={(e) => { setStrategyChatInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'; }}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleStrategyChatSend(); } }}
                placeholder={SMART_PLACEHOLDERS[placeholderIdx]}
                rows={1}
                disabled={strategyChatLoading}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.10] text-white/85 placeholder-white/25 text-[13px] focus:outline-none focus:border-violet-500/40 transition-all disabled:opacity-50 resize-none overflow-hidden leading-relaxed"
                style={{ minHeight: '42px' }}
              />
              <button
                onClick={handleStrategyChatSend}
                disabled={!strategyChatInput.trim() || strategyChatLoading}
                className={`rounded-xl flex items-center justify-center text-white transition-all active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed shrink-0 ${
                  strategyChatInput.trim()
                    ? 'px-4 h-10 gap-1.5 bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-md shadow-violet-500/25 hover:shadow-violet-500/40'
                    : 'w-10 h-10 bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-md shadow-violet-500/20 hover:shadow-violet-500/35 disabled:shadow-none'
                }`}
              >
                {strategyChatInput.trim() ? (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    <span className="text-[12px] font-bold">Go</span>
                  </>
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>
            {strategyChatHistory.length > 0 && (
              <div className="flex justify-end mt-2">
                <button onClick={() => { setStrategyChatHistory([]); setStrategyChatInput(''); }} className="text-[10px] text-white/20 hover:text-white/50 transition-colors">Clear chat</button>
              </div>
            )}
          </div>
        </div>
        {/* End of Coach Card */}

        <div className="space-y-4">
            {/* ===== REPLY MODE (hidden, logic preserved) ===== */}
            {appMode === 'reply' && (<>
            {/* Context Selector */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-white/40 uppercase tracking-widest flex items-center gap-1.5">
                Who is this?
              </label>
              <div className="flex flex-wrap gap-2">
                {CONTEXT_OPTIONS.map((context) => (
                  <button
                    key={context.value}
                    onClick={() => setSelectedContext(selectedContext === context.value ? null : context.value as ContextType)}
                    className={`px-4 py-2.5 rounded-2xl text-[13px] font-semibold transition-all active:scale-95 ${
                      selectedContext === context.value
                        ? 'bg-white/[0.16] text-white border border-white/[0.22] shadow-lg shadow-white/5'
                        : 'bg-white/[0.07] text-white/60 border border-white/[0.12] hover:bg-white/[0.12] hover:text-white/80'
                    }`}
                  >
                    <span className="mr-1.5">{context.emoji}</span>{context.label}
                  </button>
                ))}
              </div>
              {selectedContext && (() => {
                const cat = getContextCategory(selectedContext);
                const catLabel = cat === 'professional' ? '💼 Professional mode — clarity, tone, power dynamics' : cat === 'platonic' ? '🤝 Friend & Family mode — warmth, honesty, genuine connection' : '💘 Dating mode — attraction, energy, forward motion';
                const catColor = cat === 'professional' ? 'text-amber-400/80' : cat === 'platonic' ? 'text-blue-400/80' : 'text-pink-400/80';
                return <p className={`text-xs font-medium animate-in fade-in duration-200 ${catColor}`}>{catLabel}</p>;
              })()}
              {/* Custom context input */}
              <div className="relative animate-in fade-in duration-200">
                <input
                  type="text"
                  value={customContext}
                  onChange={(e) => setCustomContext(e.target.value)}
                  placeholder="Add details: 'talking 2 weeks, she's a nurse, went on one date'"
                  maxLength={200}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.10] text-white/80 placeholder-white/25 text-xs focus:outline-none focus:border-violet-500/30 transition-all"
                />
                {customContext && (
                  <button
                    onClick={() => setCustomContext('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg text-white/20 hover:text-white/50 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Scroll target for after "I sent this" */}
            <div ref={inputAreaRef} />

            {/* ══════════ THREAD VIEW ══════════ */}
            {thread.length > 0 && (
              <div className="mb-1">
                <button
                  onClick={() => setShowThread(!showThread)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-t-3xl bg-white/[0.04] border border-white/[0.08] border-b-0 transition-colors hover:bg-white/[0.06]"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-lg bg-violet-500/20 flex items-center justify-center">
                      <MessageCircle className="h-3 w-3 text-violet-400" />
                    </div>
                    <span className="text-white/60 text-xs font-bold">
                      {thread.length} message{thread.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {showThread ? <ChevronUp className="h-3.5 w-3.5 text-white/25" /> : <ChevronDown className="h-3.5 w-3.5 text-white/25" />}
                </button>

                {showThread && (
                  <div className="rounded-b-3xl bg-white/[0.03] border border-white/[0.08] border-t-0 p-4 max-h-72 overflow-y-auto" onClick={() => setSelectedThreadMsg(null)}>
                    <div className="space-y-1">
                      {thread.map((msg, i) => {
                        const prevRole = i > 0 ? thread[i - 1].role : null;
                        const nextRole = i < thread.length - 1 ? thread[i + 1].role : null;
                        const isGroupStart = prevRole !== msg.role;
                        const isGroupEnd = nextRole !== msg.role;
                        const isSelected = selectedThreadMsg === i;
                        return (
                          <div key={i} className={`flex ${msg.role === 'you' ? 'justify-end' : 'justify-start'} ${isGroupStart && i > 0 ? 'mt-3' : ''}`}>
                            <div className="relative max-w-[80%]">
                              <div
                                onClick={(e) => { e.stopPropagation(); setSelectedThreadMsg(isSelected ? null : i); }}
                                className={`px-4 py-2 text-[13px] leading-relaxed cursor-pointer transition-all ${
                                  isSelected ? 'ring-1 ring-red-400/40 ' : ''
                                }${
                                  msg.role === 'them'
                                    ? `bg-white/[0.07] text-white/80 border border-white/[0.06] ${
                                        isGroupStart && isGroupEnd ? 'rounded-2xl rounded-bl-lg' :
                                        isGroupStart ? 'rounded-2xl rounded-bl-md' :
                                        isGroupEnd ? 'rounded-2xl rounded-tl-md rounded-bl-lg' :
                                        'rounded-xl rounded-l-md'
                                      }`
                                    : `bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/10 ${
                                        isGroupStart && isGroupEnd ? 'rounded-2xl rounded-br-lg' :
                                        isGroupStart ? 'rounded-2xl rounded-br-md' :
                                        isGroupEnd ? 'rounded-2xl rounded-tr-md rounded-br-lg' :
                                        'rounded-xl rounded-r-md'
                                      }`
                                }`}>
                                <p className="font-medium">{msg.text}</p>
                              </div>
                              {/* Generate reply chip on last 'them' message when textarea is empty */}
                              {msg.role === 'them' && i === thread.length - 1 && !message.trim() && replies.length === 0 && !loading && (
                                <div className="mt-1.5 animate-in fade-in duration-300">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleGenerate(); }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-[11px] font-bold hover:bg-emerald-500/25 transition-all active:scale-95"
                                  >
                                    <Sparkles className="h-3 w-3" /> Generate reply
                                  </button>
                                </div>
                              )}
                              {isSelected && (
                                <div className={`absolute top-full mt-1 z-10 flex items-center gap-1.5 animate-in fade-in slide-in-from-bottom-1 duration-150 ${msg.role === 'you' ? 'right-0' : 'left-0'}`}>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteThreadMessage(i); }}
                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-[11px] font-bold hover:bg-red-500/30 transition-all active:scale-95"
                                  >
                                    <X className="h-3 w-3" /> Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      <div ref={threadEndRef} />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="relative">
              <textarea
                value={message}
                onChange={(e) => handleMessageChange(e.target.value)}
                placeholder={
                  thread.length === 0
                    ? "What did they send you?"
                    : thread[thread.length - 1]?.role === 'you'
                      ? "What did they say back?"
                      : "Add the next message, or generate a reply"
                }
                className={`w-full p-5 pb-8 rounded-2xl bg-white/[0.06] border border-white/[0.12] text-white placeholder-white/40 resize-none focus:outline-none focus:border-violet-500/30 transition-all ${message.length > 300 ? 'min-h-[200px]' : 'min-h-[130px]'}`}
                maxLength={2000}
                aria-label="Message input"
              />
              <div className={`absolute bottom-3 right-3 text-xs transition-colors ${
                charCount > 1800 ? 'text-red-400 font-semibold' : 'text-white/30'
              }`}>
                {charCount}/2000
              </div>
            </div>

            {/* ══════════ VIBE CHECK — real-time draft feedback ══════════ */}
            {appMode === 'reply' && message.trim().length >= 8 && (vibeCheck || vibeLoading) && (
              <div className="animate-in fade-in slide-in-from-top-1 duration-300">
                {vibeLoading ? (
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                    <Loader2 className="h-3 w-3 animate-spin text-violet-400" />
                    <span className="text-[11px] text-white/30 font-medium">Checking vibe...</span>
                  </div>
                ) : vibeCheck && (
                  <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all ${
                    vibeCheck.score >= 8 ? 'bg-emerald-500/[0.06] border-emerald-500/20' :
                    vibeCheck.score >= 5 ? 'bg-amber-500/[0.06] border-amber-500/20' :
                    'bg-red-500/[0.06] border-red-500/20'
                  }`}>
                    <div className={`text-lg leading-none ${
                      vibeCheck.score >= 8 ? 'grayscale-0' : vibeCheck.score >= 5 ? 'grayscale-0' : 'grayscale-0'
                    }`}>
                      {vibeCheck.score >= 8 ? '🟢' : vibeCheck.score >= 5 ? '🟡' : '🔴'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-bold ${
                          vibeCheck.score >= 8 ? 'text-emerald-400' :
                          vibeCheck.score >= 5 ? 'text-amber-400' :
                          'text-red-400'
                        }`}>
                          {vibeCheck.vibe}
                        </span>
                        <span className="text-[10px] text-white/20">·</span>
                        <span className="text-[10px] text-white/30 font-medium">{vibeCheck.score}/10</span>
                      </div>
                      <p className="text-[11px] text-white/50 truncate">{vibeCheck.tip}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ══════════ TONE TRANSLATOR — rewrite draft in different energy ══════════ */}
            {appMode === 'reply' && message.trim().length >= 3 && (
              <div className="animate-in fade-in duration-200">
                {!showToneBar ? (
                  <button
                    onClick={() => setShowToneBar(true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white/25 hover:text-white/50 text-[11px] font-medium transition-colors"
                  >
                    <Sparkles className="h-3 w-3" /> Rewrite in a different tone
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-white/30 font-bold uppercase tracking-wider mr-1">Rewrite as:</span>
                    {[
                      { key: 'flirty', label: '😏 Flirty', color: 'hover:bg-pink-500/15 hover:border-pink-500/30 hover:text-pink-300' },
                      { key: 'chill', label: '😎 Chill', color: 'hover:bg-blue-500/15 hover:border-blue-500/30 hover:text-blue-300' },
                      { key: 'bold', label: '🔥 Bold', color: 'hover:bg-orange-500/15 hover:border-orange-500/30 hover:text-orange-300' },
                      { key: 'witty', label: '⚡ Witty', color: 'hover:bg-purple-500/15 hover:border-purple-500/30 hover:text-purple-300' },
                      { key: 'warm', label: '💚 Warm', color: 'hover:bg-green-500/15 hover:border-green-500/30 hover:text-green-300' },
                      { key: 'pro', label: '💼 Pro', color: 'hover:bg-slate-500/15 hover:border-slate-500/30 hover:text-slate-300' },
                    ].map(t => (
                      <button
                        key={t.key}
                        onClick={() => handleTranslateTone(t.key)}
                        disabled={translating}
                        className={`px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/40 text-[11px] font-bold transition-all active:scale-95 disabled:opacity-30 ${t.color}`}
                      >
                        {translating ? '...' : t.label}
                      </button>
                    ))}
                    <button
                      onClick={() => setShowToneBar(false)}
                      className="p-1.5 rounded-lg text-white/20 hover:text-white/50 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ══════════ USER INTENT — optional direction for replies ══════════ */}
            <div className="animate-in fade-in duration-200">
              <div className="relative">
                <input
                  type="text"
                  value={userIntent}
                  onChange={(e) => setUserIntent(e.target.value)}
                  placeholder="What do you want to say? (optional) — e.g. ask what happened subtly"
                  maxLength={120}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/80 placeholder-white/20 text-xs focus:outline-none focus:border-violet-500/30 transition-all"
                />
                {userIntent && (
                  <button
                    onClick={() => setUserIntent('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg text-white/20 hover:text-white/50 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Quick add to thread buttons (for double texts / non-generated messages) */}
            {thread.length > 0 && (
              <div className="flex gap-2 animate-in fade-in duration-200">
                <button
                  onClick={handleAddTheirMessage}
                  disabled={!message.trim()}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.10] text-white/40 hover:bg-white/[0.08] hover:text-white/60 text-xs font-bold transition-all active:scale-95 disabled:opacity-30 disabled:hover:bg-white/[0.04] disabled:hover:text-white/40"
                >
                  <Plus className="h-3 w-3" /> Add as their message
                </button>
                <button
                  onClick={handleAddMyMessage}
                  disabled={!message.trim()}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-300/60 hover:bg-violet-500/15 hover:text-violet-300 text-xs font-bold transition-all active:scale-95 disabled:opacity-30 disabled:hover:bg-violet-500/10 disabled:hover:text-violet-300/60"
                >
                  <Plus className="h-3 w-3" /> Add as my message
                </button>
              </div>
            )}

            {/* Screenshot Preview */}
            {screenshotPreview && (
              <div className="relative animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="relative rounded-2xl overflow-hidden border border-white/[0.12]">
                  <img 
                    src={screenshotPreview} 
                    alt="Screenshot preview" 
                    className="w-full max-h-48 object-cover opacity-90"
                  />
                  {extracting && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <div className="flex items-center gap-3">
                        <Loader2 className="h-5 w-5 animate-spin text-violet-400" />
                        <span className="text-sm font-bold text-white/80">Reading screenshot...</span>
                      </div>
                    </div>
                  )}
                  {!extracting && (
                    <button
                      onClick={clearScreenshot}
                      className="absolute top-2 right-2 w-8 h-8 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center transition-colors"
                    >
                      <X className="h-4 w-4 text-white" />
                    </button>
                  )}
                  {!extracting && extractedPlatform && extractedPlatform !== 'unknown' && (
                    <div className="absolute bottom-2 left-2 px-3 py-1 bg-black/60 rounded-full text-xs text-white font-medium capitalize">
                      {extractedPlatform} detected
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Upload Screenshot / Paste Divider */}
            <div className="relative flex items-center gap-3">
              {/* Feature Spotlight — shows once per device */}
              {showFeatureSpotlight && (
                <div className="absolute -top-[88px] left-0 right-0 z-50 animate-in fade-in slide-in-from-bottom-3 duration-500">
                  <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl p-4 shadow-2xl shadow-purple-500/30">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                        <Camera className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm">New: Screenshot Upload</p>
                        <p className="text-xs text-white/80 mt-0.5">Take a screenshot of any convo and we&apos;ll read it for you. No more copy-pasting!</p>
                      </div>
                      <button 
                        onClick={dismissSpotlight}
                        className="text-white/60 hover:text-white text-lg leading-none shrink-0 -mt-1"
                      >
                        ✕
                      </button>
                    </div>
                    {/* Arrow pointing down */}
                    <div className="absolute -bottom-2 left-12 w-4 h-4 bg-gradient-to-br from-purple-600 to-pink-600 rotate-45" />
                  </div>
                </div>
              )}
              <button
                onClick={() => {
                  dismissSpotlight();
                  fileInputRef.current?.click();
                }}
                disabled={extracting}
                className={`flex-1 p-3 rounded-xl transition-all text-white/60 font-medium text-sm flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 ${
                  showFeatureSpotlight 
                    ? 'bg-violet-500/20 border border-violet-500/30 text-violet-300' 
                    : 'bg-white/[0.06] border border-white/[0.12] hover:bg-white/[0.12] hover:text-white/80'
                }`}
              >
                {extracting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Reading...
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4" />
                    Upload Screenshot
                  </>
                )}
              </button>
              {!message && (
                <button
                  onClick={() => setShowExamplesDrawer(!showExamplesDrawer)}
                  className="p-3 rounded-xl bg-white/[0.06] border border-white/[0.12] hover:bg-white/[0.12] transition-all text-white/40 hover:text-white/70 font-medium text-sm flex items-center justify-center gap-2"
                >
                  <Lightbulb className="h-4 w-4" />
                  Examples
                </button>
              )}
            </div>

            {/* Examples Drawer */}
            {showExamplesDrawer && !message && (
              <div className="space-y-2 animate-in slide-in-from-top duration-300 rounded-2xl bg-white/[0.04] border border-white/[0.08] p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-white/60">
                    <Sparkles className="h-4 w-4 text-violet-400" />
                    <span>Try these examples:</span>
                  </div>
                  <button 
                    onClick={() => setShowExamplesDrawer(false)}
                    className="text-white/20 hover:text-white/50 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {EXAMPLE_MESSAGES.map((example, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleExampleClick(example)}
                      className="text-left text-sm p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.07] transition-all text-white/70 font-medium"
                    >
                      <span className="text-violet-400 font-bold mr-2">{idx + 1}.</span>
                      &ldquo;{example}&rdquo;
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* V2/V1 Toggle — Pro users can switch between verified (V2) and fast (V1) */}
            {isPro ? (
              <button
                onClick={() => setUseV2(!useV2)}
                className={`flex items-center gap-2.5 p-3.5 rounded-2xl w-full text-left transition-all ${
                  useV2
                    ? 'bg-emerald-500/10 border border-emerald-500/20'
                    : 'bg-violet-500/10 border border-violet-500/20'
                }`}
              >
                {useV2 ? (
                  <Shield className="h-5 w-5 text-emerald-400" />
                ) : (
                  <Zap className="h-5 w-5 text-violet-400" />
                )}
                <div className="flex-1">
                  <p className={`text-sm font-bold ${useV2 ? 'text-emerald-300' : 'text-violet-300'}`}>
                    {useV2 ? 'V2 Verified' : 'V1 Fast Mode'}
                  </p>
                  <p className={`text-xs ${useV2 ? 'text-emerald-400/60' : 'text-violet-400/60'}`}>
                    {useV2 ? 'Strategy + 3-agent pipeline • Tap for V1' : 'Quick replies, no strategy • Tap for V2'}
                  </p>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  useV2
                    ? 'text-emerald-400 bg-emerald-500/15'
                    : 'text-violet-300 bg-violet-500/15'
                }`}>
                  {useV2 ? 'V2' : 'V1'}
                </span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setShowPaywall(true);
                  toast({ title: "🔒 V2 is Pro-only", description: "Upgrade to unlock 3-agent verified replies" });
                }}
                className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-violet-500/10 border border-violet-500/20 w-full text-left hover:border-violet-500/30 transition-colors"
              >
                <Shield className="h-5 w-5 text-violet-400" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-white/80">V2 Verified Mode <span className="text-xs font-normal text-white/40">(Pro)</span></p>
                  <p className="text-xs text-white/40">3-agent pipeline • ≤18 words • Tone-verified</p>
                </div>
                <span className="text-xs font-bold text-violet-300 bg-violet-500/15 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <Lock className="h-3 w-3" /> Upgrade
                </span>
              </button>
            )}

            <div className="space-y-3">
              <Button
                onClick={handleGenerate}
                disabled={loading || !(message.trim() || (thread.length > 0 && thread[thread.length - 1]?.role === 'them'))}
                className={`w-full h-14 text-base rounded-2xl font-extrabold transition-all active:scale-[0.97] disabled:opacity-25 disabled:cursor-not-allowed ${
                  isPro
                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-black shadow-lg shadow-emerald-500/30'
                    : 'bg-gradient-to-r from-violet-600 via-purple-500 to-fuchsia-500 text-white shadow-xl shadow-violet-600/50'
                }`}
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {isPro ? (
                      v2Step === 'drafting' ? 'Drafting...' :
                      v2Step === 'rule-checking' ? 'Checking...' :
                      v2Step === 'tone-verifying' ? 'Verifying...' :
                      'Finalizing...'
                    ) : 'Generating...'}
                  </>
                ) : (
                  <>
                    {isPro ? <Shield className="mr-2 h-5 w-5" /> : <Sparkles className="mr-2 h-5 w-5" />}
                    {isPro ? 'Generate Verified' : 'Generate'}
                  </>
                )}
              </Button>

              {/* Thread bar: Recent / New / Active indicator */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => { fetchThreads(); setShowThreads(!showThreads); }}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all active:scale-95 ${
                    showThreads
                      ? 'bg-violet-500/25 text-violet-300 border border-violet-500/30'
                      : 'bg-white/[0.08] text-white/60 border border-white/[0.12] hover:bg-white/[0.14] hover:text-white/80'
                  }`}
                >
                  <Clock className="h-3.5 w-3.5" />
                  Recent{savedThreads.length > 0 ? ` (${savedThreads.length})` : ''}
                </button>
                <button
                  onClick={handleNewThread}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white/[0.08] border border-white/[0.12] text-white/60 hover:bg-white/[0.14] hover:text-white/80 text-xs font-bold transition-all active:scale-95"
                >
                  <Plus className="h-3.5 w-3.5" /> New
                </button>
                {activeThreadName && (
                  <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-violet-500/10 border border-violet-500/20 min-w-0">
                    <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse shrink-0" />
                    {editingThreadName ? (
                      <input
                        autoFocus
                        defaultValue={activeThreadName}
                        className="bg-transparent text-violet-300 text-xs font-semibold outline-none border-b border-violet-400/40 w-full"
                        onBlur={(e) => handleRenameThread(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleRenameThread((e.target as HTMLInputElement).value); if (e.key === 'Escape') setEditingThreadName(false); }}
                      />
                    ) : (
                      <span
                        onClick={() => setEditingThreadName(true)}
                        className="text-violet-300 text-xs font-semibold truncate cursor-pointer hover:text-violet-200 transition-colors"
                        title="Tap to rename"
                      >{activeThreadName}</span>
                    )}
                    {saving && <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0 ml-auto text-violet-400" />}
                  </div>
                )}
                {!activeThreadName && saving && (
                  <div className="flex items-center gap-1.5 px-3 py-2.5 text-violet-400 text-[11px] font-medium">
                    <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" /> syncing
                  </div>
                )}
              </div>

              {!loading && !replies.length && !thread.length && (
                <p className="text-center text-xs text-white/30 font-medium animate-fade-in transition-opacity duration-500">
                  {TAGLINES[currentTagline]}
                </p>
              )}
            </div>

            {/* Recent Threads Drawer */}
            {showThreads && (
              <div className="animate-in fade-in slide-in-from-top-3 duration-300">
                <div className="rounded-3xl bg-white/[0.04] border border-white/[0.08] p-4 space-y-2">
                  <div className="flex items-center justify-between px-1 mb-2">
                    <span className="text-white/50 text-[11px] font-bold uppercase tracking-widest">Conversations</span>
                    <button onClick={() => setShowThreads(false)} className="text-white/20 hover:text-white/50 transition-colors">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {savedThreads.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-10 h-10 mx-auto rounded-2xl bg-white/[0.05] flex items-center justify-center mb-3">
                        <MessageCircle className="h-5 w-5 text-white/20" />
                      </div>
                      <p className="text-white/25 text-xs">Start a thread and it&apos;ll appear here</p>
                    </div>
                  ) : (
                    <div className="space-y-1 max-h-60 overflow-y-auto">
                      {savedThreads.map(t => {
                        const isActive = activeCoachSessionId === t.id || activeThreadId === t.id;
                        return (
                        <button
                          key={t.id}
                          onClick={() => handleLoadThread(t)}
                          className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all group text-left active:scale-[0.98] ${
                            isActive
                              ? 'bg-violet-500/15 border border-violet-500/20'
                              : 'bg-white/[0.02] border border-transparent hover:bg-white/[0.05] hover:border-white/[0.06]'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            isActive ? 'bg-violet-500/20' : 'bg-white/[0.05]'
                          }`}>
                            <Sparkles className={`h-3.5 w-3.5 ${isActive ? 'text-violet-400' : 'text-white/30'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white/80 text-sm font-semibold truncate">{t.name}</p>
                            <p className="text-white/25 text-[10px] mt-0.5">
                              {t.message_count} msgs · {new Date(t.updated_at).toLocaleDateString()}
                            </p>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteThread(t.id); }}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/20 transition-all"
                          >
                            <Trash2 className="h-3 w-3 text-red-400" />
                          </button>
                        </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
            </>)}

            {/* ===== DECODE MODE ===== */}
            {appMode === 'decode' && (<>
            <div className="relative">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Paste their message here — what did they really mean?"
                className={`w-full p-5 pb-8 rounded-2xl bg-white/[0.06] border border-white/[0.12] text-white placeholder-white/40 resize-none focus:outline-none focus:border-amber-500/30 transition-all ${message.length > 300 ? 'min-h-[200px]' : 'min-h-[130px]'}`}
                maxLength={2000}
                aria-label="Message to decode"
              />
              <div className={`absolute bottom-3 right-3 text-xs transition-colors ${
                charCount > 1800 ? 'text-red-400 font-semibold' : 'text-white/30'
              }`}>
                {charCount}/2000
              </div>
            </div>

            {/* Screenshot Preview for Decode */}
            {screenshotPreview && (
              <div className="relative animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="relative rounded-2xl overflow-hidden border border-white/[0.12]">
                  <img src={screenshotPreview} alt="Screenshot preview" className="w-full max-h-48 object-cover opacity-90" />
                  {extracting && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="flex items-center gap-3">
                        <Loader2 className="h-5 w-5 animate-spin text-amber-400" />
                        <span className="text-sm font-bold text-white/80">Reading screenshot...</span>
                      </div>
                    </div>
                  )}
                  {!extracting && (
                    <button onClick={clearScreenshot} className="absolute top-2 right-2 w-8 h-8 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center transition-colors">
                      <X className="h-4 w-4 text-white" />
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={extracting}
                className="flex-1 p-3 rounded-xl bg-white/[0.06] border border-white/[0.12] hover:bg-white/[0.12] transition-all text-white/60 hover:text-white/80 font-medium text-sm flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                <Camera className="h-4 w-4" />
                Upload Screenshot
              </button>
            </div>

            <Button
              onClick={handleDecode}
              disabled={decoding || !message.trim() || (!isPro && decodeUsed >= decodeLimit)}
              className={`w-full h-14 text-base rounded-2xl font-extrabold transition-all active:scale-[0.97] disabled:opacity-25 ${
                !isPro && decodeUsed >= decodeLimit
                  ? 'bg-white/[0.08] text-white/30'
                  : 'bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-lg shadow-amber-500/30'
              }`}
              size="lg"
            >
              {decoding ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Decoding...</>
              ) : !isPro && decodeUsed >= decodeLimit ? (
                <><Lock className="mr-2 h-5 w-5" /> Decode Used — Upgrade</>
              ) : (
                <><Brain className="mr-2 h-5 w-5" /> Decode Message</>
              )}
            </Button>
            {!isPro && (
              <p className="text-center text-xs text-white/30 font-medium">
                {decodeUsed >= decodeLimit ? '0' : `${decodeLimit - decodeUsed}`}/{decodeLimit} free decode{decodeLimit === 1 ? '' : 's'} remaining today
              </p>
            )}
            </>)}

            {/* ===== OPENER MODE ===== */}
            {appMode === 'opener' && (<>
            <div className="space-y-3">
              <label className="text-xs font-bold text-white/40 uppercase tracking-widest flex items-center gap-1.5">
                What kind of opener?
              </label>
              <div className="grid grid-cols-3 gap-2">
                {OPENER_CONTEXTS.map((ctx) => (
                  <button
                    key={ctx.value}
                    onClick={() => setOpenerContext(ctx.value)}
                    className={`p-3 rounded-2xl border transition-all duration-200 text-left ${
                      openerContext === ctx.value
                        ? 'bg-pink-500/15 border-pink-500/30 text-pink-300'
                        : 'bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.12]'
                    }`}
                  >
                    <div className="text-lg mb-1">{ctx.emoji}</div>
                    <div className="text-xs font-bold text-white/80">{ctx.label}</div>
                    <div className="text-[10px] text-white/30">{ctx.description}</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="relative">
              <textarea
                value={openerDescription}
                onChange={(e) => setOpenerDescription(e.target.value)}
                placeholder="Optional: describe them (e.g., 'loves hiking, has a golden retriever, funny bio about pizza')"
                className="w-full min-h-[80px] p-4 pb-6 rounded-2xl bg-white/[0.06] border border-white/[0.12] text-white placeholder-white/40 resize-none focus:outline-none focus:border-pink-500/30 transition-all text-sm"
                maxLength={300}
              />
              <div className={`absolute bottom-2 right-3 text-xs ${openerDescription.length > 250 ? 'text-red-400' : 'text-white/30'}`}>
                {openerDescription.length}/300
              </div>
            </div>
            {/* Screenshot upload for opener */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-white/50 hover:bg-white/[0.08] hover:text-white/70 transition-all text-sm font-semibold"
            >
              <Camera className="h-4 w-4" />
              {extracting ? 'Reading screenshot...' : 'Upload screenshot for context'}
            </button>
            <Button
              onClick={handleGenerateOpeners}
              disabled={loadingOpeners || (!isPro && openerUsed >= openerLimit)}
              className={`w-full h-14 text-base rounded-2xl font-extrabold transition-all active:scale-[0.97] disabled:opacity-25 ${
                !isPro && openerUsed >= openerLimit
                  ? 'bg-white/[0.08] text-white/30'
                  : 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/30'
              }`}
              size="lg"
            >
              {loadingOpeners ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Crafting openers...</>
              ) : !isPro && openerUsed >= openerLimit ? (
                <><Lock className="mr-2 h-5 w-5" /> Opener Used — Upgrade</>
              ) : (
                <><Send className="mr-2 h-5 w-5" /> Generate Openers</>
              )}
            </Button>
            {!isPro && (
              <p className="text-center text-xs text-white/30 font-medium">
                {openerUsed >= openerLimit ? '0' : `${openerLimit - openerUsed}`}/{openerLimit} free opener{openerLimit === 1 ? '' : 's'} remaining today
              </p>
            )}
            </>)}

            {/* ===== REVIVE MODE ===== */}
            {appMode === 'revive' && (<>
            {/* Context Selector */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-white/40 uppercase tracking-widest flex items-center gap-1.5">
                Who is this?
              </label>
              <div className="flex flex-wrap gap-2">
                {CONTEXT_OPTIONS.map((context) => (
                  <button
                    key={context.value}
                    onClick={() => setSelectedContext(selectedContext === context.value ? null : context.value as ContextType)}
                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all active:scale-95 ${
                      selectedContext === context.value
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-lg shadow-cyan-500/10'
                        : 'bg-white/[0.06] text-white/55 border border-white/[0.10] hover:bg-white/[0.10] hover:text-white/70'
                    }`}
                  >
                    <span>{context.emoji}</span>
                    <span>{context.label}</span>
                  </button>
                ))}
              </div>
              {/* Custom context input */}
              <div className="relative">
                <input
                  type="text"
                  value={customContext}
                  onChange={(e) => setCustomContext(e.target.value)}
                  placeholder="Add details: 'talking 2 weeks, she's a nurse, went on one date'"
                  maxLength={200}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.10] text-white/80 placeholder-white/25 text-xs focus:outline-none focus:border-cyan-500/30 transition-all"
                />
                {customContext && (
                  <button
                    onClick={() => setCustomContext('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg text-white/20 hover:text-white/50 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
            {/* Conversation input */}
            <div className="relative">
              <textarea
                ref={inputAreaRef as any}
                value={message}
                onChange={(e) => { setMessage(e.target.value); setShowExamples(false); }}
                placeholder="Paste the conversation thread here (or upload a screenshot below)..."
                className="w-full min-h-[120px] p-4 pb-12 rounded-2xl bg-white/[0.06] border border-white/[0.12] text-white placeholder-white/40 resize-none focus:outline-none focus:border-cyan-500/30 transition-all text-sm leading-relaxed"
                maxLength={3000}
              />
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.08] border border-white/[0.12] text-white/50 hover:text-white/80 hover:bg-white/[0.14] transition-all text-xs font-bold"
                >
                  <Camera className="h-3.5 w-3.5" />
                  {extracting ? 'Reading...' : 'Screenshot'}
                </button>
                <span className={`text-xs ${message.length > 2500 ? 'text-red-400' : 'text-white/30'}`}>
                  {message.length}/3000
                </span>
              </div>
            </div>
            {/* Screenshot preview */}
            {screenshotPreview && (
              <div className="relative rounded-2xl overflow-hidden border border-cyan-500/20">
                <img src={screenshotPreview} alt="Screenshot" className="w-full max-h-40 object-cover opacity-70" />
                <button
                  onClick={clearScreenshot}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-all"
                >
                  <X className="h-3.5 w-3.5 text-white" />
                </button>
                {extracting && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
                  </div>
                )}
              </div>
            )}
            <Button
              onClick={handleGenerateRevive}
              disabled={loadingRevive || !message.trim() || (!isPro && reviveUsed >= reviveLimit)}
              className={`w-full h-14 text-base rounded-2xl font-extrabold transition-all active:scale-[0.97] disabled:opacity-25 ${
                !isPro && reviveUsed >= reviveLimit
                  ? 'bg-white/[0.08] text-white/30'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/30'
              }`}
              size="lg"
            >
              {loadingRevive ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Crafting revive messages...</>
              ) : !isPro && reviveUsed >= reviveLimit ? (
                <><Lock className="mr-2 h-5 w-5" /> Revive Used — Upgrade</>
              ) : (
                <><RefreshCw className="mr-2 h-5 w-5" /> Revive This Convo</>
              )}
            </Button>
            {!isPro && (
              <p className="text-center text-xs text-white/30 font-medium">
                {reviveUsed >= reviveLimit ? '0' : `${reviveLimit - reviveUsed}`}/{reviveLimit} free revive{reviveLimit === 1 ? '' : 's'} remaining today
              </p>
            )}
            </>)}
          </div>

        {/* Decode Results Panel */}
        {decodeResult && (
          <div className="mb-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="rounded-3xl bg-white/[0.04] border border-amber-500/15 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-amber-500/15 flex items-center justify-center">
                    <Brain className="h-3.5 w-3.5 text-amber-400" />
                  </div>
                  <span className="text-white/60 text-[11px] font-bold uppercase tracking-widest">decoded</span>
                </div>
                <button onClick={() => setDecodeResult(null)} className="w-7 h-7 rounded-xl bg-white/[0.05] flex items-center justify-center hover:bg-white/10 transition-all">
                  <X className="h-3 w-3 text-white/30" />
                </button>
              </div>
              {/* Energy Badge */}
              <div className="inline-flex">
                <span className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border border-white/[0.06] ${
                  decodeResult.energy === 'positive' ? 'bg-emerald-500/15 text-emerald-400' :
                  decodeResult.energy === 'negative' ? 'bg-red-500/15 text-red-400' :
                  decodeResult.energy === 'mixed' ? 'bg-yellow-500/15 text-yellow-400' :
                  'bg-white/[0.06] text-white/50'
                }`}>
                  {(ENERGY_CONFIG[decodeResult.energy] || ENERGY_CONFIG.neutral).emoji} {decodeResult.energy.replace('-', ' ')}
                </span>
              </div>
              {/* Intent */}
              <div className="rounded-2xl bg-amber-500/5 border border-amber-500/10 p-4">
                <p className="text-amber-400/60 text-[10px] font-bold uppercase tracking-widest mb-1.5">what they mean</p>
                <p className="text-white/80 text-sm font-medium leading-relaxed">{decodeResult.intent}</p>
              </div>
              {/* Subtext */}
              <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4">
                <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest mb-1.5">between the lines</p>
                <p className="text-white/60 text-xs leading-relaxed">{decodeResult.subtext}</p>
              </div>
              {/* Flags */}
              {decodeResult.flags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {decodeResult.flags.map((flag, i) => (
                    <span key={i} className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border ${
                      flag.type === 'green' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      flag.type === 'red' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                      'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                    }`}>
                      {flag.text}
                    </span>
                  ))}
                </div>
              )}
              {/* Coach Tip */}
              <div className="rounded-2xl bg-violet-500/5 border border-violet-500/10 p-4">
                <p className="text-violet-400/60 text-[10px] font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> coach tip
                </p>
                <p className="text-white/70 text-xs font-medium leading-relaxed">{decodeResult.coach_tip}</p>
              </div>
            </div>
          </div>
        )}

        {/* Opener Results */}
        {openers.length > 0 && (
          <div className="animate-in fade-in duration-400 mb-8">
            <p className="text-white/35 text-xs font-bold uppercase tracking-[0.15em] mb-3">Your opening lines</p>
            <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] divide-y divide-white/[0.06] overflow-hidden">
              {openers.map((opener, idx) => {
                const config = OPENER_TONE_CONFIG[opener.tone] || OPENER_TONE_CONFIG.bold;
                const label = ['A', 'B', 'C'][idx];
                const isCopied = copied === opener.tone;
                return (
                  <div
                    key={idx}
                    style={{ animationDelay: `${idx * 60}ms` }}
                    className={`animate-in fade-in slide-in-from-bottom-2 w-full text-left group relative transition-all duration-200 ${
                      isCopied ? 'bg-emerald-500/[0.08]' : 'hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex gap-4 px-5 py-5">
                      <div className={`w-1 shrink-0 self-stretch rounded-full bg-gradient-to-b ${config.gradient} ${
                        isCopied ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'
                      } transition-opacity`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 mb-2.5">
                          <span className="text-[13px] font-bold text-white/60">{config.emoji} {config.label}</span>
                        </div>
                        <p className="text-white/90 text-[15px] font-medium leading-relaxed mb-2">{opener.text}</p>
                        <p className="text-white/30 text-xs italic mb-3">{opener.why}</p>
                        <button
                          onClick={async () => {
                            await navigator.clipboard.writeText(opener.text);
                            setCopied(opener.tone);
                            toast({ title: '✓ Copied!', description: 'Paste it and send' });
                            setTimeout(() => setCopied(null), 2000);
                          }}
                          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                            isCopied
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-white/[0.06] border border-white/[0.10] text-white/50 hover:text-white/80 hover:bg-white/[0.10]'
                          }`}
                        >
                          {isCopied ? <><Check className="h-3.5 w-3.5" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy {label}</>}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="text-center pt-5">
              <button onClick={() => setOpeners([])} className="px-6 py-2.5 rounded-2xl bg-white/[0.06] border border-white/[0.12] text-white/50 hover:text-white/80 hover:bg-white/[0.12] font-bold text-xs transition-all active:scale-95">
                <Sparkles className="h-3.5 w-3.5 inline mr-1.5" /> Try Again
              </button>
            </div>
          </div>
        )}

        {/* Revive Results */}
        {reviveMessages.length > 0 && (
          <div className="animate-in fade-in duration-400 mb-8">
            {/* Analysis */}
            {reviveAnalysis && (
              <div className="mb-4 rounded-2xl bg-cyan-500/[0.08] border border-cyan-500/20 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <RefreshCw className="h-3.5 w-3.5 text-cyan-400" />
                  <span className="text-cyan-400/80 text-[10px] font-bold uppercase tracking-widest">convo analysis</span>
                </div>
                <p className="text-white/70 text-sm leading-relaxed">{reviveAnalysis}</p>
              </div>
            )}
            <p className="text-white/35 text-xs font-bold uppercase tracking-[0.15em] mb-3">Your revive messages</p>
            <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] divide-y divide-white/[0.06] overflow-hidden">
              {reviveMessages.map((msg, idx) => {
                const config = REVIVE_TONE_CONFIG[msg.tone] || REVIVE_TONE_CONFIG.smooth;
                const label = ['A', 'B', 'C'][idx];
                const isCopied = copied === msg.tone;
                return (
                  <div
                    key={idx}
                    style={{ animationDelay: `${idx * 60}ms` }}
                    className={`animate-in fade-in slide-in-from-bottom-2 w-full text-left group relative transition-all duration-200 ${
                      isCopied ? 'bg-emerald-500/[0.08]' : 'hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex gap-4 px-5 py-5">
                      <div className={`w-1 shrink-0 self-stretch rounded-full bg-gradient-to-b ${config.gradient} ${
                        isCopied ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'
                      } transition-opacity`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 mb-2.5">
                          <span className="text-[13px] font-bold text-white/60">{config.emoji} {config.label}</span>
                        </div>
                        <p className="text-white/90 text-[15px] font-medium leading-relaxed mb-2">{msg.text}</p>
                        <p className="text-white/30 text-xs italic mb-3">{msg.why}</p>
                        <button
                          onClick={async () => {
                            await navigator.clipboard.writeText(msg.text);
                            setCopied(msg.tone);
                            toast({ title: '✓ Copied!', description: 'Send it and see what happens' });
                            setTimeout(() => setCopied(null), 2000);
                          }}
                          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                            isCopied
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-white/[0.06] border border-white/[0.10] text-white/50 hover:text-white/80 hover:bg-white/[0.10]'
                          }`}
                        >
                          {isCopied ? <><Check className="h-3.5 w-3.5" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy {label}</>}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="text-center pt-5">
              <button onClick={() => { setReviveMessages([]); setReviveAnalysis(''); }} className="px-6 py-2.5 rounded-2xl bg-white/[0.06] border border-white/[0.12] text-white/50 hover:text-white/80 hover:bg-white/[0.12] font-bold text-xs transition-all active:scale-95">
                <Sparkles className="h-3.5 w-3.5 inline mr-1.5" /> Try Again
              </button>
            </div>
          </div>
        )}

        {/* ══════════ SCREENSHOT BRIEFING CARD ══════════ */}
        {scanResult && (
          <div className="animate-in fade-in slide-in-from-bottom-3 duration-400 mb-8">
            {/* Context header */}
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Camera className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-white/80 text-sm font-bold">Screenshot Briefing</p>
                <p className="text-white/35 text-[11px]">
                  {scanResult.messageCount} message{scanResult.messageCount !== 1 ? 's' : ''} from {scanResult.platform !== 'unknown' ? scanResult.platform : 'conversation'}
                  {scanResult.confidence === 'high' && ' • high confidence'}
                </p>
              </div>
              <button
                onClick={() => { setScanResult(null); setScreenshotPreview(null); }}
                className="p-2 rounded-xl bg-white/[0.06] border border-white/[0.10] text-white/30 hover:text-white/60 hover:bg-white/[0.10] transition-all"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Strategy card (Pro only) */}
            {scanResult.strategy && (
              <div className="mb-4 rounded-2xl bg-gradient-to-r from-emerald-500/[0.08] to-cyan-500/[0.08] border border-emerald-500/20 p-4">
                <div className="flex items-center gap-2 mb-2.5">
                  <Target className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-300 text-[11px] font-bold uppercase tracking-widest">Your sharp friend says</span>
                  {scanResult.strategy.move.risk !== 'low' && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      scanResult.strategy.move.risk === 'high' ? 'bg-red-500/15 text-red-400' : 'bg-yellow-500/15 text-yellow-400'
                    }`}>
                      {scanResult.strategy.move.risk} risk
                    </span>
                  )}
                </div>
                <p className="text-white/90 text-sm font-semibold leading-relaxed mb-3">
                  {scanResult.strategy.move.one_liner}
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${
                    scanResult.strategy.momentum === 'Rising' ? 'bg-emerald-500/15 text-emerald-400' :
                    scanResult.strategy.momentum === 'Declining' || scanResult.strategy.momentum === 'Stalling' ? 'bg-red-500/15 text-red-400' :
                    'bg-white/[0.08] text-white/50'
                  }`}>
                    {scanResult.strategy.momentum === 'Rising' ? <TrendingUp className="h-3 w-3" /> :
                     scanResult.strategy.momentum === 'Declining' || scanResult.strategy.momentum === 'Stalling' ? <TrendingDown className="h-3 w-3" /> :
                     <Minus className="h-3 w-3" />}
                    {scanResult.strategy.momentum}
                  </span>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-white/[0.08] text-white/50">
                    {scanResult.strategy.balance}
                  </span>
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                    scanResult.strategy.move.energy === 'pull_back' ? 'bg-orange-500/15 text-orange-400' :
                    scanResult.strategy.move.energy === 'escalate' ? 'bg-emerald-500/15 text-emerald-400' :
                    'bg-violet-500/15 text-violet-300'
                  }`}>
                    {scanResult.strategy.move.energy.replace('_', ' ')}
                  </span>
                  {scanResult.strategy.move.constraints.keep_short && (
                    <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-white/[0.06] text-white/35">keep short</span>
                  )}
                  {scanResult.strategy.move.constraints.no_questions && (
                    <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-white/[0.06] text-white/35">no questions</span>
                  )}
                  {scanResult.strategy.move.constraints.add_tease && (
                    <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-white/[0.06] text-white/35">add tease</span>
                  )}
                  {scanResult.strategy.move.constraints.push_meetup && (
                    <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-white/[0.06] text-white/35">push meetup</span>
                  )}
                </div>
              </div>
            )}

            {/* Reply options */}
            <p className="text-white/35 text-xs font-bold uppercase tracking-[0.15em] mb-3">Your replies</p>
            <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] divide-y divide-white/[0.06] overflow-hidden mb-4">
              {scanResult.replies.map((reply, idx) => {
                const config = TONE_CONFIG[reply.tone];
                const isCopied = copied === reply.tone;
                const label = ['A', 'B', 'C'][idx];
                return (
                  <div
                    key={reply.tone}
                    style={{ animationDelay: `${idx * 60}ms` }}
                    className={`animate-in fade-in slide-in-from-bottom-2 w-full text-left group relative transition-all duration-200 ${
                      isCopied ? 'bg-emerald-500/[0.08]' : 'hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex gap-4 px-5 py-5">
                      <div className={`w-1 shrink-0 self-stretch rounded-full bg-gradient-to-b ${config.gradient} ${
                        isCopied ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'
                      } transition-opacity`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 mb-2.5">
                          <span className="text-[13px] font-bold text-white/60">{config.emoji} {config.label}</span>
                          <span className="text-white/25 text-[11px]">{reply.text.split(' ').length}w</span>
                        </div>
                        {editingReply === `scan-${reply.tone}` ? (
                          <div className="space-y-2.5 mb-3">
                            <textarea
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              className="w-full p-3 rounded-xl bg-white/[0.06] border border-violet-500/30 text-white placeholder-white/30 resize-none focus:outline-none focus:border-violet-500/50 transition-all min-h-[60px] text-sm leading-relaxed"
                              placeholder="Edit this reply, add your ideas..."
                              autoFocus
                            />
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => handleRefine(reply.tone, reply.text, true)}
                                disabled={refining || !editText.trim()}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-violet-500/20 border border-violet-500/30 text-violet-300 hover:bg-violet-500/30 transition-all active:scale-95 disabled:opacity-30"
                              >
                                {refining ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                                {refining ? 'Polishing...' : 'Polish'}
                              </button>
                              <button
                                onClick={() => handleUseRawEdit(reply.tone, true)}
                                disabled={!editText.trim()}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white/[0.06] border border-white/[0.10] text-white/50 hover:text-white/80 hover:bg-white/[0.10] transition-all active:scale-95 disabled:opacity-30"
                              >
                                <Check className="h-3 w-3" /> Use as is
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="px-3 py-2 rounded-xl text-xs font-bold text-white/30 hover:text-white/50 transition-all"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-white/90 text-[15px] font-medium leading-relaxed mb-3">{reply.text}</p>
                        )}
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleCopy(reply.text, reply.tone)}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                              isCopied
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-white/[0.06] border border-white/[0.10] text-white/50 hover:text-white/80 hover:bg-white/[0.10]'
                            }`}
                          >
                            {isCopied ? <><Check className="h-3.5 w-3.5" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy {label}</>}
                          </button>
                          {editingReply !== `scan-${reply.tone}` && (
                            <button
                              onClick={() => handleStartEdit(`scan-${reply.tone}`, reply.text)}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white/[0.04] border border-white/[0.08] text-white/30 hover:text-white/60 hover:bg-white/[0.08] transition-all active:scale-95"
                            >
                              <MessageCircle className="h-3 w-3" /> Edit
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleContinueInThread}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-violet-500/15 border border-violet-500/25 text-violet-300 hover:bg-violet-500/25 text-xs font-bold transition-all active:scale-95"
              >
                <MessageCircle className="h-3.5 w-3.5" /> Continue in Thread
              </button>
              <button
                onClick={handleRegenerateScan}
                disabled={loading}
                className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl bg-white/[0.06] border border-white/[0.10] text-white/40 hover:text-white/60 hover:bg-white/[0.10] text-xs font-bold transition-all active:scale-95 disabled:opacity-40"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Retry
              </button>
              <button
                onClick={() => { setScanResult(null); setScreenshotPreview(null); }}
                className="px-4 py-3 rounded-2xl bg-white/[0.06] border border-white/[0.10] text-white/40 hover:text-white/60 hover:bg-white/[0.10] text-xs font-bold transition-all active:scale-95"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* Replies Section */}
        {replies.length > 0 && (
          <div className="animate-in fade-in duration-400">
            {/* ══════════ STRATEGY COACH CARD ══════════ */}
            {isPro && strategyData ? (
              <div className="mb-4 rounded-2xl bg-gradient-to-r from-emerald-500/[0.08] to-cyan-500/[0.08] border border-emerald-500/20 p-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <Target className="h-3.5 w-3.5 text-emerald-400" />
                  </div>
                  <span className="text-emerald-300 text-[11px] font-bold uppercase tracking-widest">Strategy</span>
                  {strategyData.move.risk !== 'low' && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      strategyData.move.risk === 'high' ? 'bg-red-500/15 text-red-400' : 'bg-yellow-500/15 text-yellow-400'
                    }`}>
                      {strategyData.move.risk} risk
                    </span>
                  )}
                </div>
                <p className="text-white/90 text-sm font-semibold leading-relaxed mb-3">
                  {strategyData.move.one_liner}
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${
                    strategyData.momentum === 'Rising' ? 'bg-emerald-500/15 text-emerald-400' :
                    strategyData.momentum === 'Declining' || strategyData.momentum === 'Stalling' ? 'bg-red-500/15 text-red-400' :
                    'bg-white/[0.08] text-white/50'
                  }`}>
                    {strategyData.momentum === 'Rising' ? <TrendingUp className="h-3 w-3" /> :
                     strategyData.momentum === 'Declining' || strategyData.momentum === 'Stalling' ? <TrendingDown className="h-3 w-3" /> :
                     <Minus className="h-3 w-3" />}
                    {strategyData.momentum}
                  </span>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-white/[0.08] text-white/50">
                    {strategyData.balance}
                  </span>
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                    strategyData.move.energy === 'pull_back' ? 'bg-orange-500/15 text-orange-400' :
                    strategyData.move.energy === 'escalate' ? 'bg-emerald-500/15 text-emerald-400' :
                    'bg-violet-500/15 text-violet-300'
                  }`}>
                    {strategyData.move.energy.replace('_', ' ')}
                  </span>
                  {strategyData.move.constraints.keep_short && (
                    <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-white/[0.06] text-white/35">keep short</span>
                  )}
                  {strategyData.move.constraints.no_questions && (
                    <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-white/[0.06] text-white/35">no questions</span>
                  )}
                  {strategyData.move.constraints.add_tease && (
                    <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-white/[0.06] text-white/35">add tease</span>
                  )}
                  {strategyData.move.constraints.push_meetup && (
                    <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-white/[0.06] text-white/35">push meetup</span>
                  )}
                </div>
              </div>
            ) : null}

            {/* ══════════ STRATEGY CHAT ══════════ */}
            {isPro && strategyData && (
              <div className="mb-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                {/* Header */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
                  <div className="w-5 h-5 rounded-lg bg-violet-500/20 flex items-center justify-center">
                    <MessageCircle className="h-3 w-3 text-violet-400" />
                  </div>
                  <span className="text-white/50 text-[11px] font-bold uppercase tracking-widest">Ask your coach</span>
                  <span className="text-[10px] text-white/20 ml-auto">Thread context always in background</span>
                </div>

                {/* Chat history */}
                {strategyChatHistory.length > 0 && (
                  <div className="px-4 py-3 space-y-3 max-h-72 overflow-y-auto">
                    {strategyChatHistory.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1.5`}>
                          <div className={`px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed ${
                            msg.role === 'user'
                              ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-br-md'
                              : 'bg-white/[0.07] text-white/85 border border-white/[0.06] rounded-bl-md'
                          }`}>
                            <p className="font-medium whitespace-pre-wrap">{msg.content}</p>
                          </div>
                          {/* Draft replies from coach */}
                          {msg.draft && (msg.draft.shorter || msg.draft.spicier || msg.draft.softer) && (
                            <div className="w-full space-y-1.5 mt-1">
                              <p className="text-[10px] text-emerald-400/70 font-bold uppercase tracking-wider px-1">Coach draft</p>
                              {msg.draft.shorter && (
                                <button
                                  onClick={() => { navigator.clipboard.writeText(msg.draft!.shorter!); toast({ title: '✓ Copied' }); }}
                                  className="w-full text-left px-3.5 py-2.5 rounded-xl bg-emerald-500/[0.08] border border-emerald-500/20 text-white/80 text-[13px] font-medium hover:bg-emerald-500/[0.14] transition-all active:scale-[0.98] group"
                                >
                                  <span className="text-[10px] text-emerald-400/60 font-bold block mb-0.5">Shorter</span>
                                  {msg.draft.shorter}
                                  <span className="text-[10px] text-white/20 group-hover:text-white/40 ml-2 transition-colors">tap to copy</span>
                                </button>
                              )}
                              {msg.draft.spicier && (
                                <button
                                  onClick={() => { navigator.clipboard.writeText(msg.draft!.spicier!); toast({ title: '✓ Copied' }); }}
                                  className="w-full text-left px-3.5 py-2.5 rounded-xl bg-orange-500/[0.08] border border-orange-500/20 text-white/80 text-[13px] font-medium hover:bg-orange-500/[0.14] transition-all active:scale-[0.98] group"
                                >
                                  <span className="text-[10px] text-orange-400/60 font-bold block mb-0.5">Spicier</span>
                                  {msg.draft.spicier}
                                  <span className="text-[10px] text-white/20 group-hover:text-white/40 ml-2 transition-colors">tap to copy</span>
                                </button>
                              )}
                              {msg.draft.softer && (
                                <button
                                  onClick={() => { navigator.clipboard.writeText(msg.draft!.softer!); toast({ title: '✓ Copied' }); }}
                                  className="w-full text-left px-3.5 py-2.5 rounded-xl bg-blue-500/[0.08] border border-blue-500/20 text-white/80 text-[13px] font-medium hover:bg-blue-500/[0.14] transition-all active:scale-[0.98] group"
                                >
                                  <span className="text-[10px] text-blue-400/60 font-bold block mb-0.5">Softer</span>
                                  {msg.draft.softer}
                                  <span className="text-[10px] text-white/20 group-hover:text-white/40 ml-2 transition-colors">tap to copy</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {strategyChatLoading && (
                      <div className="flex justify-start">
                        <div className="px-3.5 py-2.5 rounded-2xl rounded-bl-md bg-white/[0.07] border border-white/[0.06] flex items-center gap-2">
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-400" />
                          <span className="text-[12px] text-white/40 font-medium">Thinking...</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Input row */}
                <div className="px-3 py-3 flex items-center gap-2 border-t border-white/[0.06]">
                  <button
                    onClick={() => coachFileInputRef.current?.click()}
                    disabled={coachScreenshotExtracting || strategyChatLoading}
                    className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.10] flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/[0.10] transition-all active:scale-95 disabled:opacity-30 shrink-0"
                    title="Upload screenshot for context"
                  >
                    {coachScreenshotExtracting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-400" />
                    ) : (
                      <Camera className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <input
                    type="text"
                    value={strategyChatInput}
                    onChange={(e) => setStrategyChatInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleStrategyChatSend(); } }}
                    placeholder="Ask anything or add context..."
                    maxLength={300}
                    disabled={strategyChatLoading || coachScreenshotExtracting}
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.10] text-white/80 placeholder-white/20 text-[13px] focus:outline-none focus:border-violet-500/30 transition-all disabled:opacity-50"
                  />
                  <button
                    onClick={handleStrategyChatSend}
                    disabled={!strategyChatInput.trim() || strategyChatLoading}
                    className="w-9 h-9 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-400 hover:bg-violet-500/30 transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Suggestion chips — only when no history yet */}
                {strategyChatHistory.length === 0 && !strategyChatLoading && (
                  <div className="px-3 pb-3 flex flex-wrap gap-1.5">
                    {[
                      'Should I ask what happened?',
                      'Is this a good time to check in?',
                      'How do I bring up plans?',
                    ].map((chip) => (
                      <button
                        key={chip}
                        onClick={() => { setStrategyChatInput(chip); }}
                        className="px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-white/35 text-[11px] font-medium hover:bg-white/[0.08] hover:text-white/60 transition-all active:scale-95"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {isPro && !strategyData && replies.length > 0 ? null : !isPro && replies.length > 0 ? (
              <button
                onClick={() => setShowPaywall(true)}
                className="w-full mb-4 p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.05] transition-all flex items-center gap-3 group"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <Target className="h-4 w-4 text-emerald-400/50" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-white/40 text-xs font-bold">Strategy Mode</p>
                  <p className="text-white/20 text-[10px]">AI coaching for every reply — Pro only</p>
                </div>
                <Lock className="h-3.5 w-3.5 text-white/20 group-hover:text-white/40 transition-colors" />
              </button>
            ) : null}

            <div className="mb-4">
              {showCraftedMessage && (
                <p className={`text-[11px] font-bold uppercase tracking-widest mb-2 ${
                  isPro ? 'text-emerald-400/60' : 'text-violet-400/60'
                }`}>
                  {isPro ? '✅ 3-agent verified • Safe to send' : 'Crafted with care'}
                </p>
              )}
              <p className="text-white/35 text-xs font-bold uppercase tracking-[0.15em]">
                {isPro ? 'Your verified replies' : 'Pick your reply'}
              </p>
            </div>
            <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] divide-y divide-white/[0.06] overflow-hidden">
              {replies.map((reply, idx) => {
                const config = TONE_CONFIG[reply.tone];
                const isCopied = copied === reply.tone;
                const label = ['A', 'B', 'C'][idx];
                return (
                  <div
                    key={reply.tone}
                    style={{ animationDelay: `${idx * 60}ms` }}
                    className={`animate-in fade-in slide-in-from-bottom-2 w-full text-left group relative transition-all duration-200 ${
                      isCopied
                        ? 'bg-emerald-500/[0.08]'
                        : 'hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex gap-4 px-5 py-5">
                      <div className={`w-1 shrink-0 self-stretch rounded-full bg-gradient-to-b ${config.gradient} ${
                        isCopied ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'
                      } transition-opacity`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 mb-2.5">
                          <span className="text-[13px] font-bold text-white/60">{config.emoji} {config.label}</span>
                          <span className="text-white/25 text-[11px]">{reply.text ? reply.text.split(' ').length : 0}w</span>
                          {isPro && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              useV2 ? 'text-emerald-500/60 bg-emerald-500/10' : 'text-violet-400/60 bg-violet-500/10'
                            }`}>
                              {useV2 ? 'v2' : 'v1'}
                            </span>
                          )}
                          {v2Meta && v2Meta.toneChecks[reply.tone] && (
                            <span className="text-[10px] font-bold text-blue-400/60 bg-blue-500/10 px-2 py-0.5 rounded">
                              tone ✓
                            </span>
                          )}
                        </div>
                        {editingReply === reply.tone ? (
                          <div className="space-y-2.5 mb-3">
                            <textarea
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              className="w-full p-3 rounded-xl bg-white/[0.06] border border-violet-500/30 text-white placeholder-white/30 resize-none focus:outline-none focus:border-violet-500/50 transition-all min-h-[60px] text-sm leading-relaxed"
                              placeholder="Edit this reply, add your ideas..."
                              autoFocus
                            />
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => handleRefine(reply.tone, reply.text)}
                                disabled={refining || !editText.trim()}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-violet-500/20 border border-violet-500/30 text-violet-300 hover:bg-violet-500/30 transition-all active:scale-95 disabled:opacity-30"
                              >
                                {refining ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                                {refining ? 'Polishing...' : 'Polish'}
                              </button>
                              <button
                                onClick={() => handleUseRawEdit(reply.tone)}
                                disabled={!editText.trim()}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white/[0.06] border border-white/[0.10] text-white/50 hover:text-white/80 hover:bg-white/[0.10] transition-all active:scale-95 disabled:opacity-30"
                              >
                                <Check className="h-3 w-3" /> Use as is
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="px-3 py-2 rounded-xl text-xs font-bold text-white/30 hover:text-white/50 transition-all"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-white/90 text-[15px] font-medium leading-relaxed mb-3">{reply.text}</p>
                        )}
                        
                        {/* Action buttons */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => handleCopy(reply.text, reply.tone)}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                              isCopied 
                                ? 'bg-emerald-500/20 text-emerald-400' 
                                : 'bg-white/[0.06] border border-white/[0.10] text-white/50 hover:text-white/80 hover:bg-white/[0.10]'
                            }`}
                          >
                            {isCopied ? <><Check className="h-3.5 w-3.5" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy {label}</>}
                          </button>
                          <button
                            onClick={() => handleMarkSent(reply)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-violet-500/15 border border-violet-500/25 text-violet-300 hover:bg-violet-500/25 transition-all active:scale-95"
                          >
                            <Send className="h-3.5 w-3.5" /> I sent this
                          </button>
                          {editingReply !== reply.tone && (
                            <button
                              onClick={() => handleStartEdit(reply.tone, reply.text)}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white/[0.04] border border-white/[0.08] text-white/30 hover:text-white/60 hover:bg-white/[0.08] transition-all active:scale-95"
                            >
                              <MessageCircle className="h-3 w-3" /> Edit
                            </button>
                          )}
                          <div className="relative">
                            <button
                              onClick={() => setShareMenuOpen(shareMenuOpen === reply.tone ? null : reply.tone)}
                              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                                sharing === reply.tone
                                  ? 'bg-violet-500/20 text-violet-400'
                                  : 'bg-white/[0.06] border border-white/[0.10] text-white/40 hover:text-white/70 hover:bg-white/[0.10]'
                              }`}
                            >
                              {sharing === reply.tone ? '✓ Shared' : <><Sparkles className="h-3.5 w-3.5" /> Share</>}
                            </button>
                            {shareMenuOpen === reply.tone && (
                              <div className="absolute bottom-full mb-2 left-0 right-0 min-w-[180px] rounded-xl bg-[#1a1a2e] border border-white/[0.12] overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                                <button
                                  onClick={() => handleShareLink(reply)}
                                  className="w-full px-4 py-3 text-left text-xs font-medium text-white/60 hover:bg-white/[0.06] flex items-center gap-2 border-b border-white/[0.06]"
                                >
                                  🔗 Copy Share Link
                                </button>
                                <button
                                  onClick={() => handleDownloadImage(reply)}
                                  className="w-full px-4 py-3 text-left text-xs font-medium text-white/60 hover:bg-white/[0.06] flex items-center gap-2 border-b border-white/[0.06]"
                                >
                                  📥 Download Image
                                </button>
                                <button
                                  onClick={() => handleCopyImage(reply)}
                                  className="w-full px-4 py-3 text-left text-xs font-medium text-white/60 hover:bg-white/[0.06] flex items-center gap-2"
                                >
                                  📋 Copy Image
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Regenerate + custom input */}
            <div className="pt-3 space-y-2">
              <button
                onClick={handleRegenerate}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl bg-white/[0.04] border border-white/[0.10] text-white/40 hover:text-white/60 hover:bg-white/[0.08] text-xs font-bold transition-all active:scale-95 disabled:opacity-40"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Generating...' : 'Generate different replies'}
              </button>
              {!showCustomSent ? (
                <button
                  onClick={() => setShowCustomSent(true)}
                  className="w-full p-3.5 rounded-2xl bg-white/[0.04] border border-dashed border-white/[0.12] hover:bg-white/[0.08] hover:border-white/[0.18] transition-all text-white/40 hover:text-white/60 text-sm font-medium flex items-center justify-center gap-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  I said something else...
                </button>
              ) : (
                <div className="rounded-2xl bg-white/[0.04] border border-violet-500/20 p-4 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <p className="text-violet-300 text-xs font-bold">What did you actually send?</p>
                  <textarea
                    value={customSent}
                    onChange={(e) => setCustomSent(e.target.value)}
                    placeholder="Type what you sent them..."
                    className="w-full p-3 rounded-xl bg-white/[0.06] border border-white/[0.12] text-white placeholder-white/30 resize-none focus:outline-none focus:border-violet-500/30 transition-all min-h-[60px] text-sm"
                    maxLength={500}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleCustomSentSubmit}
                      disabled={!customSent.trim()}
                      className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-violet-500/20 border border-violet-500/30 text-violet-300 hover:bg-violet-500/30 transition-all active:scale-95 disabled:opacity-30"
                    >
                      <Send className="h-3.5 w-3.5" /> Add to thread
                    </button>
                    <button
                      onClick={() => { setShowCustomSent(false); setCustomSent(''); }}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white/[0.06] border border-white/[0.10] text-white/40 hover:text-white/60 transition-all active:scale-95"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Try Again Button */}
            <div className="text-center pt-4 animate-in fade-in duration-500 delay-300">
              <button
                onClick={handleTryAgain}
                className="px-6 py-2.5 rounded-2xl bg-white/[0.06] border border-white/[0.12] text-white/50 hover:text-white/80 hover:bg-white/[0.12] font-bold text-xs transition-all active:scale-95"
              >
                <Sparkles className="h-3.5 w-3.5 inline mr-1.5" />
                Try Another Message
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] divide-y divide-white/[0.06] overflow-hidden animate-in fade-in duration-300">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4 px-5 py-5">
                <div className="w-1 shrink-0 self-stretch rounded-full bg-violet-500/20 animate-pulse" />
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-4 w-20 bg-white/[0.06] rounded-lg animate-pulse" />
                    <div className="h-3 w-8 bg-white/[0.04] rounded animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-white/[0.06] rounded-lg animate-pulse" />
                    <div className="h-4 w-4/5 bg-white/[0.04] rounded-lg animate-pulse" />
                  </div>
                  <div className="h-8 w-20 bg-white/[0.04] rounded-xl animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State — Reply mode only */}
        {appMode === 'reply' && !loading && replies.length === 0 && message === '' && (
          <div className="text-center pt-10 pb-6 space-y-4 animate-in fade-in duration-500">
            <p className="text-white/40 text-sm font-medium leading-relaxed max-w-[280px] mx-auto">
              Paste what they said above and we&apos;ll craft the perfect reply.
            </p>
            <div className="flex items-center justify-center gap-3 text-xs font-bold text-white/25">
              <span>them</span>
              <span>→</span>
              <span className="text-violet-400/40">you</span>
              <span>→</span>
              <span>send</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
