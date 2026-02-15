'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Copy, Sparkles, Loader2, Lightbulb, Zap, Heart, MessageCircle, Crown, Shield, CheckCircle, Check, Lock, Camera, X, ImageIcon, Search, Brain, Flag, BookmarkPlus, BookmarkCheck, Trash2, Send, AlertTriangle, ChevronUp, ChevronDown, Plus, Clock } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { CURRENT_VERSION } from '@/lib/changelog';
import FeatureTour from '@/components/FeatureTour';
import ContextualHints from '@/components/ContextualHints';

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
  updated_at: string;
  message_count: number;
  last_message: any;
};

type ThreadMessage = {
  role: 'them' | 'you';
  text: string;
  timestamp: number;
};

type AppMode = 'reply' | 'decode' | 'opener';

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
  const [message, setMessage] = useState('');
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [showExamples, setShowExamples] = useState(true);
  const [currentTagline, setCurrentTagline] = useState(0);
  const [showCraftedMessage, setShowCraftedMessage] = useState(false);
  const [selectedContext, setSelectedContext] = useState<ContextType>(null);
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
  const [appMode, setAppMode] = useState<AppMode>('reply');
  const [decodeResult, setDecodeResult] = useState<DecodeResult>(null);
  const [decoding, setDecoding] = useState(false);
  const [openers, setOpeners] = useState<Opener[]>([]);
  const [openerContext, setOpenerContext] = useState<string>('dating-app');
  const [openerDescription, setOpenerDescription] = useState('');
  const [loadingOpeners, setLoadingOpeners] = useState(false);
  const [savedThreads, setSavedThreads] = useState<SavedThread[]>([]);
  const [showThreads, setShowThreads] = useState(false);
  const [savingThread, setSavingThread] = useState(false);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [activeThreadName, setActiveThreadName] = useState<string | null>(null);
  const [thread, setThread] = useState<ThreadMessage[]>([]);
  const [showThread, setShowThread] = useState(true);
  const [pendingSent, setPendingSent] = useState<Reply | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const threadEndRef = useRef<HTMLDivElement>(null);
  const inputAreaRef = useRef<HTMLDivElement>(null);
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  
  const charCount = message.length;

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

    if (!message.trim()) {
      toast({
        title: "Empty message",
        description: "Please paste a message first",
        variant: "destructive",
      });
      return;
    }

    // Add their message to thread
    addToThread('them', message.trim());

    setLoading(true);
    setReplies([]); // Clear previous replies
    setV2Meta(null); // Clear previous V2 meta
    setV2Step(null);
    setPendingSent(null);
    
    try {
      // Use V2 API if enabled (Pro-only)
      const endpoint = isPro ? '/api/generate-v2' : '/api/generate';
      
      // Build full conversation context for smarter replies
      const fullContext = buildThreadContext(message.trim());
      
      // Show progress steps for V2
      if (isPro) {
        setV2Step('drafting');
        await new Promise(r => setTimeout(r, 800));
        setV2Step('rule-checking');
        await new Promise(r => setTimeout(r, 600));
        setV2Step('tone-verifying');
      }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: thread.length > 0 ? fullContext : message.trim(),
          context: selectedContext || 'crush'
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
      if (isPro && data.shorter && data.spicier && data.softer) {
        const v2Replies: Reply[] = [
          { tone: 'shorter', text: data.shorter },
          { tone: 'spicier', text: data.spicier },
          { tone: 'softer', text: data.softer },
        ];
        setReplies(v2Replies);
        if (data.meta) {
          setV2Meta(data.meta);
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
        title: isPro ? "✅ Verified replies ready!" : "✨ Replies generated!",
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

  const handleCopy = async (text: string, tone: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(tone);
      setPendingSent({ tone: tone as Reply['tone'], text });
      toast({
        title: isPro ? "✅ Verified reply copied!" : "✓ Copied to clipboard!",
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

  // Screenshot upload & extraction
  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file',
        description: 'Please upload an image file (PNG, JPEG, WebP)',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (4MB)
    if (file.size > 4 * 1024 * 1024) {
      toast({
        title: 'Image too large',
        description: 'Please upload an image under 4MB',
        variant: 'destructive',
      });
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setScreenshotPreview(base64);
      setExtracting(true);
      setExtractedPlatform(null);

      try {
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
          setMessage(data.extracted_text);
          setShowExamples(false);
          setExtractedPlatform(data.platform);
          const msgCount = data.message_count || 1;
          toast({
            title: `📷 ${msgCount > 1 ? `${msgCount} messages extracted!` : 'Message extracted!'}`,
            description: data.confidence === 'high' 
              ? `Full convo from ${data.platform !== 'unknown' ? data.platform : 'your screenshot'}` 
              : 'Check the text looks right, then hit Generate',
          });
        }
      } catch (error) {
        console.error('Screenshot extraction error:', error);
        toast({
          title: 'Extraction failed',
          description: 'Something went wrong. Please try pasting the message instead.',
          variant: 'destructive',
        });
        setScreenshotPreview(null);
      } finally {
        setExtracting(false);
      }
    };
    reader.readAsDataURL(file);

    // Reset file input so the same file can be re-selected
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const clearScreenshot = () => {
    setScreenshotPreview(null);
    setExtractedPlatform(null);
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
        body: JSON.stringify({ message: message.trim(), context: selectedContext || 'crush' }),
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
    setReplies([]);
    setDecodeResult(null);
    setMessage('');
    setShowExamples(false);
    setShowThread(true);
    toast({ title: '✓ Added to thread', description: 'Now paste their next reply to keep going' });
    // Scroll back to input so user knows to paste next message
    setTimeout(() => {
      inputAreaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
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

  const handleLoadThread = async (saved: SavedThread) => {
    try {
      const res = await fetch(`/api/threads?id=${saved.id}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const fullThread = data.thread;

      if (fullThread?.messages) {
        const messages: ThreadMessage[] = (fullThread.messages as any[]).map((m: any) => ({
          role: m.role === 'you' ? 'you' as const : 'them' as const,
          text: m.text || '',
          timestamp: m.timestamp ? new Date(m.timestamp).getTime() : Date.now(),
        }));
        setThread(messages);
      }

      setActiveThreadId(saved.id);
      setActiveThreadName(saved.name);
      if (saved.context) setSelectedContext(saved.context as ContextType);
      setReplies([]);
      setDecodeResult(null);
      setPendingSent(null);
      setMessage('');
      setShowThreads(false);
      setShowExamples(false);
      toast({ title: 'Thread loaded', description: saved.name });
    } catch {
      toast({ title: 'Failed to load thread', variant: 'destructive' });
    }
  };

  const handleDeleteThread = async (id: string) => {
    try {
      await fetch(`/api/threads?id=${id}`, { method: 'DELETE' });
      setSavedThreads(prev => prev.filter(t => t.id !== id));
      if (activeThreadId === id) {
        setActiveThreadId(null);
        setActiveThreadName(null);
        setThread([]);
      }
    } catch {}
  };

  const handleNewThread = () => {
    setThread([]);
    setReplies([]);
    setMessage('');
    setDecodeResult(null);
    setPendingSent(null);
    setActiveThreadId(null);
    setActiveThreadName(null);
    setShowThreads(false);
    setShowExamples(true);
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

      <div className={`relative z-10 mx-auto px-5 py-6 pb-14 max-w-lg md:max-w-2xl ${usageCount > 0 && !isPro ? 'pt-20' : ''}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/dashboard" className="w-10 h-10 rounded-2xl bg-white/[0.08] border border-white/[0.12] flex items-center justify-center hover:bg-white/15 transition-all active:scale-90">
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
          <div className="mb-5 px-4 py-3 rounded-2xl flex items-center justify-center gap-2.5 bg-emerald-500/10 border border-emerald-500/20">
            <Shield className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-bold text-emerald-300">V2 Verified</span>
            <span className="text-white/15">·</span>
            <span className="text-xs text-emerald-400/60">≤18 words · No emojis · Tone-checked</span>
          </div>
        )}

        {/* Usage Bar - Hidden for Pro users */}
        {usageCount > 0 && !isPro && (
          <div className={`fixed top-0 left-0 right-0 z-50 text-white animate-in slide-in-from-top duration-300 ${
            usageCount >= usageLimit 
              ? 'bg-red-500/20 border-b border-red-500/30 backdrop-blur-md' 
              : 'bg-violet-500/15 border-b border-violet-500/20 backdrop-blur-md'
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

        {/* Contextual Discovery Hints */}
        <ContextualHints
          hasMessage={!!message.trim()}
          hasReplies={replies.length > 0}
          appMode={appMode}
          onAction={(hintId) => {
            if (hintId === 'decode') handleDecode();
            if (hintId === 'opener') setAppMode('opener');
            if (hintId === 'save') { fetchThreads(); setShowThreads(true); }
            if (hintId === 'screenshot') fileInputRef.current?.click();
          }}
        />

        {/* Input Section */}
        <div className="mb-8 rounded-3xl bg-white/[0.04] border border-white/[0.08] overflow-hidden">
          <div className="pb-4 pt-6 px-6">
            {/* Mode Tabs */}
            <div className="flex items-center gap-1 bg-white/[0.06] rounded-2xl p-1 mb-4 border border-white/[0.08]">
              <button
                onClick={() => { setAppMode('reply'); setOpeners([]); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-sm font-bold transition-all ${
                  appMode === 'reply' ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30' : 'text-white/40 hover:text-white/60 border border-transparent'
                }`}
              >
                <MessageCircle className="h-3.5 w-3.5" />
                Reply
              </button>
              <button
                onClick={() => { setAppMode('decode'); setReplies([]); setOpeners([]); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-sm font-bold transition-all ${
                  appMode === 'decode' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-white/40 hover:text-white/60 border border-transparent'
                }`}
              >
                <Brain className="h-3.5 w-3.5" />
                Decode
              </button>
              <button
                onClick={() => { setAppMode('opener'); setReplies([]); setDecodeResult(null); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-sm font-bold transition-all ${
                  appMode === 'opener' ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30' : 'text-white/40 hover:text-white/60 border border-transparent'
                }`}
              >
                <Send className="h-3.5 w-3.5" />
                Opener
              </button>
            </div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              {appMode === 'reply' && (
                <>
                  <MessageCircle className="h-5 w-5 text-violet-400" />
                  What&apos;d they say?
                </>
              )}
              {appMode === 'decode' && (
                <>
                  <Brain className="h-5 w-5 text-amber-400" />
                  What do they really mean?
                </>
              )}
              {appMode === 'opener' && (
                <>
                  <Send className="h-5 w-5 text-pink-400" />
                  Start the conversation
                </>
              )}
            </h2>
            <p className="text-sm text-white/40 font-medium">
              {appMode === 'reply' && 'Paste the text and we\'ll handle the rest'}
              {appMode === 'decode' && 'Paste any message \u2014 we\'ll reveal the intent, subtext, and flags'}
              {appMode === 'opener' && 'Generate the perfect opening line for any situation'}
            </p>
          </div>
          <div className="space-y-4 px-6 pb-6">
            {/* ===== REPLY MODE ===== */}
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
              {selectedContext && (
                <p className="text-xs text-violet-400/80 font-medium animate-in fade-in duration-200">
                  Replies will be optimized for {CONTEXT_OPTIONS.find(c => c.value === selectedContext)?.label}
                </p>
              )}
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
                  <div className="rounded-b-3xl bg-white/[0.03] border border-white/[0.08] border-t-0 p-4 max-h-72 overflow-y-auto">
                    <div className="space-y-2.5">
                      {thread.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'you' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] px-4 py-2.5 text-[13px] leading-relaxed ${
                            msg.role === 'them'
                              ? 'bg-white/[0.07] text-white/80 rounded-2xl rounded-bl-lg border border-white/[0.06]'
                              : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-2xl rounded-br-lg shadow-lg shadow-violet-500/10'
                          }`}>
                            <p className="font-medium">{msg.text}</p>
                          </div>
                        </div>
                      ))}
                      <div ref={threadEndRef} />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="relative">
              <textarea
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  if (e.target.value.trim()) setShowExamples(false);
                }}
                placeholder={thread.length > 0 ? "What did they say back?" : "What did they send you?"}
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

            {/* Screenshot Upload */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={handleScreenshotUpload}
              className="hidden"
              aria-label="Upload screenshot"
            />
            
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

            {/* V2 Verified Badge — always on for Pro, upgrade prompt for free */}
            {isPro ? (
              <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <Shield className="h-5 w-5 text-emerald-400" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-emerald-300">V2 Verified</p>
                  <p className="text-xs text-emerald-400/60">≤18 words • No emojis • Tone-verified</p>
                </div>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/15 px-2.5 py-1 rounded-full">Active</span>
              </div>
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
                disabled={loading || !message.trim()}
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
                    <span className="text-violet-300 text-xs font-semibold truncate">{activeThreadName}</span>
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
                      {savedThreads.map(t => (
                        <button
                          key={t.id}
                          onClick={() => handleLoadThread(t)}
                          className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all group text-left active:scale-[0.98] ${
                            activeThreadId === t.id
                              ? 'bg-violet-500/15 border border-violet-500/20'
                              : 'bg-white/[0.02] border border-transparent hover:bg-white/[0.05] hover:border-white/[0.06]'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            activeThreadId === t.id ? 'bg-violet-500/20' : 'bg-white/[0.05]'
                          }`}>
                            <MessageCircle className={`h-3.5 w-3.5 ${activeThreadId === t.id ? 'text-violet-400' : 'text-white/30'}`} />
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
                      ))}
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

            {/* Screenshot Upload for Decode */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={handleScreenshotUpload}
              className="hidden"
              aria-label="Upload screenshot"
            />
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
          </div>
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

        {/* Replies Section */}
        {replies.length > 0 && (
          <div className="animate-in fade-in duration-400">
            {/* ══════════ "I SENT THIS" BANNER ══════════ */}
            {pendingSent && (
              <button
                onClick={() => handleMarkSent(pendingSent)}
                className="w-full mb-4 p-4 rounded-2xl bg-violet-500/15 border border-violet-500/30 hover:bg-violet-500/25 transition-all active:scale-[0.98] animate-in fade-in slide-in-from-bottom-2 duration-300 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-violet-500/25 flex items-center justify-center">
                      <Send className="h-4 w-4 text-violet-300" />
                    </div>
                    <div className="text-left">
                      <p className="text-violet-200 text-sm font-bold">I sent this</p>
                      <p className="text-violet-400/60 text-[11px]">Tap to add to thread &amp; get their next reply</p>
                    </div>
                  </div>
                  <div className="px-4 py-2 rounded-xl bg-violet-500/25 text-violet-200 text-xs font-bold group-hover:bg-violet-500/35 transition-colors">
                    Continue →
                  </div>
                </div>
                <p className="text-violet-300/50 text-xs mt-2 truncate text-left">&ldquo;{pendingSent.text}&rdquo;</p>
              </button>
            )}

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
                            <span className="text-[10px] font-bold text-emerald-500/60 bg-emerald-500/10 px-2 py-0.5 rounded">
                              v2
                            </span>
                          )}
                          {v2Meta && v2Meta.toneChecks[reply.tone] && (
                            <span className="text-[10px] font-bold text-blue-400/60 bg-blue-500/10 px-2 py-0.5 rounded">
                              tone ✓
                            </span>
                          )}
                        </div>
                        <p className="text-white/90 text-[15px] font-medium leading-relaxed mb-3">{reply.text}</p>
                        
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
                          {pendingSent && (
                            <button
                              onClick={() => handleMarkSent(reply)}
                              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 animate-in fade-in duration-200 ${
                                pendingSent.tone === reply.tone
                                  ? 'bg-violet-500/20 border border-violet-500/30 text-violet-300 hover:bg-violet-500/30'
                                  : 'bg-white/[0.06] border border-white/[0.10] text-white/40 hover:text-white/70 hover:bg-white/[0.10]'
                              }`}
                            >
                              <Send className="h-3.5 w-3.5" /> I sent this
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
                              <div className="absolute bottom-full mb-2 left-0 right-0 min-w-[180px] rounded-xl bg-white/[0.06] border border-white/[0.12] overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-200 backdrop-blur-md">
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

            {/* Try Again Button */}
            <div className="text-center pt-6 animate-in fade-in duration-500 delay-300">
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

        {/* Empty State */}
        {!loading && replies.length === 0 && message === '' && (
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
