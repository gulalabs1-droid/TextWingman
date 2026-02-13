'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Copy, Sparkles, Loader2, Lightbulb, Zap, Heart, MessageCircle, Crown, Shield, CheckCircle, Lock, Camera, X, ImageIcon, Search, Brain, Flag, BookmarkPlus, BookmarkCheck, Trash2, Send, AlertTriangle } from 'lucide-react';
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
  const [remainingReplies, setRemainingReplies] = useState(3);
  const [showPaywall, setShowPaywall] = useState(false);
  const [usageLimit, setUsageLimit] = useState(3);
  const [showExamplesDrawer, setShowExamplesDrawer] = useState(false);
  const [v2Mode, setV2Mode] = useState(false);
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
  const fileInputRef = useRef<HTMLInputElement>(null);
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
            setV2Mode(true); // V2 is default for Pro users
          }
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

    if (message.trim().length < 3) {
      toast({
        title: "Message too short",
        description: "Please enter a longer message for better results",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setReplies([]); // Clear previous replies
    setV2Meta(null); // Clear previous V2 meta
    setV2Step(null);
    
    try {
      // Use V2 API if enabled (Pro-only)
      const endpoint = isPro ? '/api/generate-v2' : '/api/generate';
      
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
          message: message.trim(),
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

      // Show "crafted with care" message
      setShowCraftedMessage(true);
      setTimeout(() => setShowCraftedMessage(false), 3000);

      toast({
        title: isPro ? "✅ Verified replies ready!" : "✨ Replies generated!",
        description: isPro ? "3-agent verified • Safe to send" : "Pick your favorite and copy it",
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
      toast({
        title: isPro ? "✅ Verified reply copied!" : "✓ Copied to clipboard!",
        description: isPro ? "Safe to send — paste it now" : "Paste it into your chat app",
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
    setDecoding(true);
    setDecodeResult(null);
    try {
      const res = await fetch('/api/decode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.trim(), context: selectedContext || 'crush' }),
      });
      const data = await res.json();
      if (data.error && !data.intent) {
        toast({ title: 'Decode failed', description: data.error, variant: 'destructive' });
        return;
      }
      setDecodeResult(data);
    } catch {
      toast({ title: 'Decode failed', description: 'Please try again', variant: 'destructive' });
    } finally {
      setDecoding(false);
    }
  };

  // Generate opening lines
  const handleGenerateOpeners = async () => {
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
      if (data.error) {
        toast({ title: 'Failed to generate openers', description: data.error, variant: 'destructive' });
        return;
      }
      setOpeners(data.openers || []);
      toast({ title: '✨ Openers ready!', description: 'Pick your favorite and send it' });
    } catch {
      toast({ title: 'Failed to generate openers', description: 'Please try again', variant: 'destructive' });
    } finally {
      setLoadingOpeners(false);
    }
  };

  // Saved threads
  const fetchThreads = async () => {
    try {
      const res = await fetch('/api/threads');
      if (res.ok) {
        const data = await res.json();
        setSavedThreads(data.threads || []);
      }
    } catch {}
  };

  const handleSaveThread = async () => {
    if (!message.trim()) return;
    const name = activeThreadName || prompt('Name this conversation (e.g., "Sarah 🔥"):');
    if (!name) return;
    setSavingThread(true);
    try {
      const res = await fetch('/api/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeThreadId || undefined,
          name,
          messages: [{ role: 'conversation', text: message.trim(), timestamp: new Date().toISOString() }],
          context: selectedContext,
          platform: extractedPlatform,
        }),
      });
      const data = await res.json();
      if (data.thread) {
        setActiveThreadId(data.thread.id);
        setActiveThreadName(name);
        toast({ title: '💾 Thread saved!', description: `"${name}" — come back anytime for context-aware replies` });
        fetchThreads();
      }
    } catch {
      toast({ title: 'Failed to save', description: 'Please try again', variant: 'destructive' });
    } finally {
      setSavingThread(false);
    }
  };

  const handleLoadThread = async (thread: SavedThread) => {
    try {
      const res = await fetch('/api/threads');
      if (res.ok) {
        const data = await res.json();
        const full = data.threads?.find((t: any) => t.id === thread.id);
        if (full && full.last_message) {
          setMessage(full.last_message.text || '');
          setActiveThreadId(thread.id);
          setActiveThreadName(thread.name);
          if (thread.context) setSelectedContext(thread.context as ContextType);
          setShowThreads(false);
          setShowExamples(false);
          toast({ title: `📂 Loaded "${thread.name}"`, description: 'Continue where you left off' });
        }
      }
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
      }
    } catch {}
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
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
      <div className={`container mx-auto px-4 py-8 pb-12 max-w-md md:max-w-2xl ${usageCount > 0 && !isPro ? 'pt-20' : ''}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button asChild variant="ghost" size="sm" className="text-white/90 hover:text-white hover:bg-white/10 rounded-xl transition-all">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <Link href="/" className="transition-transform hover:scale-105">
              <Logo size="sm" showText={true} />
            </Link>
            <Link href="/changelog" className="px-1.5 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-[10px] font-bold text-white/60 hover:text-white/90 transition-all">
              v{CURRENT_VERSION}
            </Link>
          </div>
          <Button asChild variant="ghost" size="sm" className="text-white/90 hover:text-white hover:bg-white/10 rounded-xl transition-all">
            <Link href="/profile">
              <Crown className="h-4 w-4 mr-2" />
              Profile
            </Link>
          </Button>
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
          <div className="mb-4 px-4 py-2.5 rounded-xl backdrop-blur border flex items-center justify-center gap-2 bg-green-500/10 border-green-500/20">
            <Shield className="h-4 w-4 text-green-400" />
            <span className="text-xs font-semibold text-green-300">V2 Verified</span>
            <span className="text-white/20">·</span>
            <span className="text-xs text-green-400/70">≤18 words · No emojis · Tone-checked</span>
          </div>
        )}

        {/* Usage Bar - Hidden for Pro users */}
        {usageCount > 0 && !isPro && (
          <div className={`fixed top-0 left-0 right-0 z-50 text-white shadow-lg animate-in slide-in-from-top duration-300 ${
            usageCount >= usageLimit 
              ? 'bg-gradient-to-r from-red-600 via-red-700 to-orange-600' 
              : 'bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-600'
          }`}>
            <div className="container mx-auto px-4 py-3">
              <div className="flex items-center justify-between max-w-2xl mx-auto">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{usageCount >= usageLimit ? '🚫' : '⚡'}</span>
                    <div>
                      <p className="text-sm font-bold">
                        {usageCount >= usageLimit 
                          ? 'Free limit reached' 
                          : `${remainingReplies} free ${remainingReplies === 1 ? 'reply' : 'replies'} left today`}
                      </p>
                      <p className="text-xs text-white/70">
                        {Math.min(usageCount, usageLimit)}/{usageLimit} used
                      </p>
                    </div>
                  </div>
                </div>
                {usageCount >= usageLimit - 1 && (
                  <Button 
                    asChild
                    size="sm" 
                    className="bg-white text-purple-700 hover:bg-gray-100 font-bold rounded-xl shadow-lg"
                  >
                    <Link href="/#pricing">Upgrade →</Link>
                  </Button>
                )}
                {usageCount < usageLimit - 1 && (
                  <div className="flex gap-1">
                    {Array.from({ length: usageLimit }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full transition-all ${
                          i < usageCount ? 'bg-purple-300' : 'bg-white/30'
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
        <Card className="mb-8 bg-white/95 backdrop-blur-xl border-0 shadow-2xl hover:shadow-purple-500/20 rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-1">
          <CardHeader className="pb-4 pt-6 bg-gradient-to-br from-purple-50 to-white">
            {/* Mode Tabs */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 mb-3">
              <button
                onClick={() => { setAppMode('reply'); setOpeners([]); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-bold transition-all ${
                  appMode === 'reply' ? 'bg-white text-purple-700 shadow-md' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <MessageCircle className="h-3.5 w-3.5" />
                Reply
              </button>
              <button
                onClick={() => { setAppMode('decode'); setReplies([]); setOpeners([]); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-bold transition-all ${
                  appMode === 'decode' ? 'bg-white text-amber-700 shadow-md' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Brain className="h-3.5 w-3.5" />
                Decode
              </button>
              <button
                onClick={() => { setAppMode('opener'); setReplies([]); setDecodeResult(null); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-bold transition-all ${
                  appMode === 'opener' ? 'bg-white text-pink-700 shadow-md' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Send className="h-3.5 w-3.5" />
                Opener
              </button>
            </div>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              {appMode === 'reply' && (
                <>
                  <MessageCircle className="h-5 w-5 text-purple-600 animate-bounce" />
                  What&apos;d they say? Drop it here 👇
                </>
              )}
              {appMode === 'decode' && (
                <>
                  <Brain className="h-5 w-5 text-amber-600 animate-bounce" />
                  What do they really mean? 🧠
                </>
              )}
              {appMode === 'opener' && (
                <>
                  <Send className="h-5 w-5 text-pink-600 animate-bounce" />
                  Start the conversation 💬
                </>
              )}
            </CardTitle>
            <CardDescription className="text-sm text-gray-600 font-medium">
              {appMode === 'reply' && 'Paste the text and we\'ll handle the rest ✨'}
              {appMode === 'decode' && 'Paste any message — we\'ll reveal the intent, subtext, and flags 🔍'}
              {appMode === 'opener' && 'Generate the perfect opening line for any situation ✨'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-6 pb-6">
            {/* ===== REPLY MODE ===== */}
            {appMode === 'reply' && (<>
            {/* Context Selector */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <span>🎯</span> Who is this?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {CONTEXT_OPTIONS.map((context) => (
                  <button
                    key={context.value}
                    onClick={() => setSelectedContext(selectedContext === context.value ? null : context.value as ContextType)}
                    className={`p-3 rounded-xl border-2 transition-all duration-200 text-left hover:scale-105 ${
                      selectedContext === context.value
                        ? 'border-purple-500 bg-purple-50 shadow-md'
                        : 'border-gray-200 bg-white hover:border-purple-300'
                    }`}
                  >
                    <div className="text-xl mb-1">{context.emoji}</div>
                    <div className="text-xs font-bold text-gray-900">{context.label}</div>
                    <div className="text-[10px] text-gray-500">{context.description}</div>
                  </button>
                ))}
              </div>
              {selectedContext && (
                <p className="text-xs text-purple-600 font-medium animate-in fade-in duration-200">
                  ✨ Replies will be optimized for {CONTEXT_OPTIONS.find(c => c.value === selectedContext)?.label}
                </p>
              )}
            </div>
            <div className="relative">
              <textarea
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  if (e.target.value.trim()) setShowExamples(false);
                }}
                placeholder="Drop their message here — or upload a screenshot of the whole convo 💬"
                className={`w-full p-5 pb-8 rounded-2xl border-2 border-gray-200 bg-white/50 text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-300 transition-all shadow-sm hover:shadow-md focus:shadow-lg ${message.length > 300 ? 'min-h-[200px]' : 'min-h-[130px]'}`}
                maxLength={2000}
                aria-label="Message input"
              />
              <div className={`absolute bottom-3 right-3 text-xs transition-colors ${
                charCount > 1800 ? 'text-red-500 font-semibold' : 'text-gray-400'
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
                <div className="relative rounded-2xl overflow-hidden border-2 border-purple-300 bg-purple-50">
                  <img 
                    src={screenshotPreview} 
                    alt="Screenshot preview" 
                    className="w-full max-h-48 object-cover opacity-90"
                  />
                  {extracting && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="flex items-center gap-3 bg-white/95 rounded-2xl px-5 py-3 shadow-xl">
                        <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
                        <span className="text-sm font-bold text-purple-800">Reading screenshot...</span>
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
                className={`flex-1 p-3 rounded-xl border-2 border-dashed transition-all text-purple-700 font-medium text-sm flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 ${
                  showFeatureSpotlight 
                    ? 'border-purple-500 bg-purple-100 shadow-lg shadow-purple-500/20 animate-pulse' 
                    : 'border-purple-300 hover:border-purple-500 bg-purple-50/50 hover:bg-purple-50'
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
                  className="p-3 rounded-xl border-2 border-dashed border-gray-300 hover:border-purple-500 bg-gray-50/50 hover:bg-purple-50 transition-all text-gray-500 hover:text-purple-700 font-medium text-sm flex items-center justify-center gap-2"
                >
                  <Lightbulb className="h-4 w-4" />
                  Examples
                </button>
              )}
            </div>

            {/* Examples Drawer */}
            {showExamplesDrawer && !message && (
              <div className="space-y-2 animate-in slide-in-from-top duration-300 bg-gradient-to-br from-purple-50 to-white p-4 rounded-2xl border-2 border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-purple-700">
                    <Sparkles className="h-4 w-4" />
                    <span>Try these examples:</span>
                  </div>
                  <button 
                    onClick={() => setShowExamplesDrawer(false)}
                    className="text-purple-400 hover:text-purple-600"
                  >
                    ✕
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {EXAMPLE_MESSAGES.map((example, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleExampleClick(example)}
                      className="text-left text-sm p-3 rounded-xl border-2 border-purple-200 hover:border-purple-400 bg-white hover:bg-purple-50 transition-all text-gray-700 font-medium"
                    >
                      <span className="text-purple-500 font-bold mr-2">{idx + 1}.</span>
                      &ldquo;{example}&rdquo;
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* V2 Verified Badge — always on for Pro, upgrade prompt for free */}
            {isPro ? (
              <div className="flex items-center gap-2 p-3 rounded-xl border-2 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                <Shield className="h-5 w-5 text-green-600" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-green-800">V2 Verified — Always On</p>
                  <p className="text-xs text-green-600">≤18 words • No emojis • Tone-verified</p>
                </div>
                <span className="text-xs font-bold text-green-600 bg-green-100 px-2.5 py-1 rounded-full">Active</span>
              </div>
            ) : (
              <button
                onClick={() => {
                  setShowPaywall(true);
                  toast({ title: "🔒 V2 is Pro-only", description: "Upgrade to unlock 3-agent verified replies" });
                }}
                className="flex items-center gap-2 p-3 rounded-xl border-2 bg-gradient-to-r from-purple-50 to-violet-50 border-purple-200 w-full text-left hover:border-purple-300 transition-colors"
              >
                <Shield className="h-5 w-5 text-purple-600" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-purple-800">V2 Verified Mode <span className="text-xs font-normal text-purple-500">(Pro)</span></p>
                  <p className="text-xs text-purple-500">3-agent pipeline • ≤18 words • Tone-verified</p>
                </div>
                <span className="text-xs font-bold text-purple-600 bg-purple-100 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <Lock className="h-3 w-3" /> Upgrade
                </span>
              </button>
            )}

            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <Button
                  onClick={handleGenerate}
                  disabled={loading || !message.trim()}
                  className={`col-span-2 h-14 text-base shadow-xl hover:shadow-2xl rounded-2xl font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                    isPro
                      ? 'bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 hover:from-green-700 hover:via-emerald-700 hover:to-teal-700'
                      : 'bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-600 hover:from-purple-700 hover:via-purple-800 hover:to-indigo-700'
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
                <Button
                  onClick={() => { fetchThreads(); setShowThreads(!showThreads); }}
                  variant="outline"
                  className="h-14 rounded-2xl font-bold border-2 border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-800 transition-all active:scale-95"
                  size="lg"
                >
                  <BookmarkPlus className="h-5 w-5" />
                  <span className="hidden sm:inline ml-1">Save</span>
                </Button>
              </div>
              {/* Active thread indicator */}
              {activeThreadName && (
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl text-xs">
                  <BookmarkCheck className="h-3.5 w-3.5 text-blue-600" />
                  <span className="text-blue-700 font-medium">Thread: {activeThreadName}</span>
                  <button onClick={handleSaveThread} disabled={savingThread || !message.trim()} className="ml-auto text-blue-600 hover:text-blue-800 font-bold disabled:opacity-50">
                    {savingThread ? 'Saving...' : 'Update'}
                  </button>
                </div>
              )}
              {!loading && !replies.length && (
                <p className="text-center text-xs text-gray-500 font-medium animate-fade-in transition-opacity duration-500">
                  {TAGLINES[currentTagline]}
                </p>
              )}
            </div>

            {/* Saved Threads Drawer */}
            {showThreads && (
              <div className="animate-in slide-in-from-top duration-300 bg-gradient-to-br from-blue-50 to-white p-4 rounded-2xl border-2 border-blue-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-blue-800 flex items-center gap-2">
                    <BookmarkCheck className="h-4 w-4" />
                    Saved Threads
                  </h4>
                  <button onClick={() => setShowThreads(false)} className="text-blue-400 hover:text-blue-600">✕</button>
                </div>
                {message.trim() && !activeThreadId && (
                  <button
                    onClick={handleSaveThread}
                    disabled={savingThread}
                    className="w-full p-3 rounded-xl border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/50 hover:bg-blue-100 transition-all text-blue-700 font-medium text-sm flex items-center justify-center gap-2"
                  >
                    <BookmarkPlus className="h-4 w-4" />
                    {savingThread ? 'Saving...' : 'Save current conversation'}
                  </button>
                )}
                {savedThreads.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No saved threads yet. Start a conversation and save it!</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {savedThreads.map(thread => (
                      <div key={thread.id} className="flex items-center gap-3 p-3 rounded-xl border border-blue-200 bg-white hover:bg-blue-50 transition-all group">
                        <button onClick={() => handleLoadThread(thread)} className="flex-1 text-left min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">{thread.name}</p>
                          <p className="text-xs text-gray-500">{thread.message_count} msgs · {new Date(thread.updated_at).toLocaleDateString()}</p>
                        </button>
                        <button onClick={() => handleDeleteThread(thread.id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all p-1">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            </>)}

            {/* ===== DECODE MODE ===== */}
            {appMode === 'decode' && (<>
            <div className="relative">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Paste their message here — what did they really mean? 🧠"
                className={`w-full p-5 pb-8 rounded-2xl border-2 border-gray-200 bg-white/50 text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-300 transition-all shadow-sm hover:shadow-md focus:shadow-lg ${message.length > 300 ? 'min-h-[200px]' : 'min-h-[130px]'}`}
                maxLength={2000}
                aria-label="Message to decode"
              />
              <div className={`absolute bottom-3 right-3 text-xs transition-colors ${
                charCount > 1800 ? 'text-red-500 font-semibold' : 'text-gray-400'
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
                <div className="relative rounded-2xl overflow-hidden border-2 border-amber-300 bg-amber-50">
                  <img src={screenshotPreview} alt="Screenshot preview" className="w-full max-h-48 object-cover opacity-90" />
                  {extracting && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="flex items-center gap-3 bg-white/95 rounded-2xl px-5 py-3 shadow-xl">
                        <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
                        <span className="text-sm font-bold text-amber-800">Reading screenshot...</span>
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
                className="flex-1 p-3 rounded-xl border-2 border-dashed border-amber-300 hover:border-amber-500 bg-amber-50/50 hover:bg-amber-50 transition-all text-amber-700 font-medium text-sm flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                <Camera className="h-4 w-4" />
                Upload Screenshot
              </button>
            </div>

            <Button
              onClick={handleDecode}
              disabled={decoding || !message.trim()}
              className="w-full h-14 text-base shadow-xl hover:shadow-2xl rounded-2xl font-bold transition-all active:scale-95 disabled:opacity-50 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:via-orange-600 hover:to-amber-700"
              size="lg"
            >
              {decoding ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Decoding...</>
              ) : (
                <><Brain className="mr-2 h-5 w-5" /> Decode Message</>
              )}
            </Button>
            </>)}

            {/* ===== OPENER MODE ===== */}
            {appMode === 'opener' && (<>
            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <span>💌</span> What kind of opener?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {OPENER_CONTEXTS.map((ctx) => (
                  <button
                    key={ctx.value}
                    onClick={() => setOpenerContext(ctx.value)}
                    className={`p-3 rounded-xl border-2 transition-all duration-200 text-left hover:scale-105 ${
                      openerContext === ctx.value
                        ? 'border-pink-500 bg-pink-50 shadow-md'
                        : 'border-gray-200 bg-white hover:border-pink-300'
                    }`}
                  >
                    <div className="text-xl mb-1">{ctx.emoji}</div>
                    <div className="text-xs font-bold text-gray-900">{ctx.label}</div>
                    <div className="text-[10px] text-gray-500">{ctx.description}</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="relative">
              <textarea
                value={openerDescription}
                onChange={(e) => setOpenerDescription(e.target.value)}
                placeholder="Optional: describe them (e.g., 'loves hiking, has a golden retriever, funny bio about pizza')"
                className="w-full min-h-[80px] p-4 pb-6 rounded-2xl border-2 border-gray-200 bg-white/50 text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-300 transition-all shadow-sm text-sm"
                maxLength={300}
              />
              <div className={`absolute bottom-2 right-3 text-xs ${openerDescription.length > 250 ? 'text-red-500' : 'text-gray-400'}`}>
                {openerDescription.length}/300
              </div>
            </div>
            <Button
              onClick={handleGenerateOpeners}
              disabled={loadingOpeners}
              className="w-full h-14 text-base shadow-xl hover:shadow-2xl rounded-2xl font-bold transition-all active:scale-95 disabled:opacity-50 bg-gradient-to-r from-pink-500 via-rose-500 to-orange-500 hover:from-pink-600 hover:via-rose-600 hover:to-orange-600"
              size="lg"
            >
              {loadingOpeners ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Crafting openers...</>
              ) : (
                <><Send className="mr-2 h-5 w-5" /> Generate Openers</>
              )}
            </Button>
            </>)}
          </CardContent>
        </Card>

        {/* Decode Results Panel */}
        {decodeResult && (
          <Card className="mb-6 bg-white/95 backdrop-blur-xl border-0 shadow-xl rounded-3xl overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-500">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Brain className="h-5 w-5 text-amber-600" />
                  Message Decoded
                </h3>
                <button onClick={() => setDecodeResult(null)} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
              </div>
              {/* Energy Badge */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-3 py-1.5 rounded-full text-sm font-bold ${(ENERGY_CONFIG[decodeResult.energy] || ENERGY_CONFIG.neutral).bg} ${(ENERGY_CONFIG[decodeResult.energy] || ENERGY_CONFIG.neutral).color} border`}>
                  {(ENERGY_CONFIG[decodeResult.energy] || ENERGY_CONFIG.neutral).emoji} {decodeResult.energy.replace('-', ' ')}
                </span>
              </div>
              {/* Intent */}
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                <p className="text-xs font-bold text-amber-700 mb-1">What they actually mean:</p>
                <p className="text-gray-900 font-medium">{decodeResult.intent}</p>
              </div>
              {/* Subtext */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <p className="text-xs font-bold text-gray-500 mb-1">Between the lines:</p>
                <p className="text-gray-700 text-sm">{decodeResult.subtext}</p>
              </div>
              {/* Flags */}
              {decodeResult.flags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {decodeResult.flags.map((flag, i) => (
                    <span key={i} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                      flag.type === 'green' ? 'bg-green-100 text-green-700 border border-green-200' :
                      flag.type === 'red' ? 'bg-red-100 text-red-700 border border-red-200' :
                      'bg-yellow-100 text-yellow-700 border border-yellow-200'
                    }`}>
                      {flag.type === 'green' ? '🟢' : flag.type === 'red' ? '🔴' : '🟡'} {flag.text}
                    </span>
                  ))}
                </div>
              )}
              {/* Coach Tip */}
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-200">
                <p className="text-xs font-bold text-purple-600 mb-1 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Coach Tip
                </p>
                <p className="text-gray-800 text-sm font-medium">{decodeResult.coach_tip}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Opener Results */}
        {openers.length > 0 && (
          <div className="space-y-5 mb-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-white">Your opening lines</h2>
              <p className="text-sm text-pink-200">Pick your favorite and send it 💬</p>
            </div>
            <div className="grid gap-4">
              {openers.map((opener, idx) => {
                const config = OPENER_TONE_CONFIG[opener.tone] || OPENER_TONE_CONFIG.bold;
                const label = ['A', 'B', 'C'][idx];
                return (
                  <Card key={idx} className="relative overflow-hidden bg-white border-2 shadow-2xl rounded-3xl transition-all duration-300 group active:scale-[0.98]">
                    <div className={`absolute top-0 left-0 right-0 h-3 bg-gradient-to-r ${config.gradient}`} />
                    <div className="absolute top-6 right-6">
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${config.gradient} flex items-center justify-center text-white font-black text-lg shadow-xl`}>
                        {label}
                      </div>
                    </div>
                    <CardHeader className="pb-3 pt-8">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${config.gradient} flex items-center justify-center text-2xl shadow-xl`}>
                          {config.emoji}
                        </div>
                        <div>
                          <CardTitle className="text-lg font-bold text-gray-900">{config.label}</CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-1 pb-5 space-y-3">
                      <div className={`${config.lightBg} rounded-2xl p-4 border-2 border-gray-100`}>
                        <p className="text-lg text-gray-900 leading-relaxed font-medium">{opener.text}</p>
                      </div>
                      <p className="text-xs text-gray-500 italic px-1">💡 {opener.why}</p>
                      <Button
                        onClick={async () => {
                          await navigator.clipboard.writeText(opener.text);
                          setCopied(opener.tone);
                          toast({ title: '✓ Copied!', description: 'Paste it and send' });
                          setTimeout(() => setCopied(null), 2000);
                        }}
                        className={`w-full h-12 rounded-2xl font-bold shadow-lg transition-all active:scale-95 ${
                          copied === opener.tone
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                            : `bg-gradient-to-r ${config.gradient} text-white hover:opacity-95`
                        }`}
                      >
                        {copied === opener.tone ? '✓ Copied!' : <><Copy className="h-4 w-4 mr-2" /> Copy {label}</>}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            <div className="text-center pt-4">
              <Button onClick={() => setOpeners([])} variant="outline" className="bg-white/95 hover:bg-white text-pink-700 border-2 border-pink-300 rounded-2xl font-bold shadow-xl px-10 h-12">
                <Sparkles className="h-4 w-4 mr-2" /> Try Again
              </Button>
            </div>
          </div>
        )}

        {/* Replies Section */}
        {replies.length > 0 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-5 duration-500">
            <div className="text-center space-y-2">
              {showCraftedMessage && (
                <p className={`text-sm font-medium animate-in fade-in duration-300 mb-2 ${
                  isPro ? 'text-green-300' : 'text-purple-300'
                }`}>
                  {isPro ? '✅ 3-agent verified • Safe to send' : '✨ Crafted with care just for you 💬'}
                </p>
              )}
              <h2 className="text-2xl font-bold text-white animate-in slide-in-from-top duration-300">
                {isPro ? 'Your verified replies' : 'Choose your reply'}
              </h2>
              <p className={`text-sm animate-in fade-in duration-500 delay-100 ${
                isPro ? 'text-green-200' : 'text-purple-200'
              }`}>
                {isPro ? 'Each reply passed our 3-agent verification 🛡️' : 'Pick your favorite and copy it 👇'}
              </p>
            </div>
            <div className="grid gap-4">
              {replies.map((reply, idx) => {
                const config = TONE_CONFIG[reply.tone];
                const isCopied = copied === reply.tone;
                const label = ['A', 'B', 'C'][idx];
                return (
                  <Card 
                    key={reply.tone} 
                    style={{ animationDelay: `${idx * 150}ms` }}
                    className={`relative overflow-hidden bg-white border-2 shadow-2xl rounded-3xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 cursor-pointer group active:scale-[0.98] ${
                      isPro 
                        ? 'border-green-200 hover:shadow-green-500/40 hover:border-green-300' 
                        : 'hover:shadow-purple-500/40'
                    }`}
                  >
                    <div className={`absolute top-0 left-0 right-0 h-3 bg-gradient-to-r ${config.gradient} transition-all duration-300 group-hover:h-4`} />
                    <div className={`absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br ${config.gradient} rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity duration-500`} />
                    
                    {/* A/B/C Label */}
                    <div className="absolute top-6 right-6 z-10">
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${config.gradient} flex items-center justify-center text-white font-black text-lg shadow-xl`}>
                        {label}
                      </div>
                    </div>

                    <CardHeader className="pb-4 pt-8">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${config.gradient} flex items-center justify-center text-3xl shadow-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6`}>
                            {config.emoji}
                          </div>
                          <div>
                            <CardTitle className="text-xl font-bold text-gray-900">{config.label}</CardTitle>
                            <CardDescription className="text-sm text-gray-600 font-semibold">{config.description}</CardDescription>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-2 space-y-5 pb-6">
                      <div className={`${config.lightBg} rounded-2xl p-5 border-2 border-gray-100`}>
                        <p className="text-lg text-gray-900 leading-relaxed font-medium">{reply.text}</p>
                      </div>
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold bg-gradient-to-r ${config.gradient} text-white px-4 py-2 rounded-full shadow-md`}>
                            {reply.text ? reply.text.split(' ').length : 0} words
                          </span>
                          {/* Verified Reply Badge for Pro V2 */}
                          {isPro && (
                            <span className="flex items-center gap-1 text-xs font-bold bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-2 rounded-full shadow-md">
                              <CheckCircle className="h-3 w-3" />
                              Verified
                            </span>
                          )}
                        </div>
                        {/* V2 Meta Badges */}
                        {v2Meta && (
                          <div className="flex items-center gap-2 flex-wrap">
                            {v2Meta.toneChecks[reply.tone] && (
                              <span 
                                className="flex items-center gap-1 text-xs font-bold bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full cursor-help"
                                title={`Matches ${reply.tone} tone`}
                              >
                                <CheckCircle className="h-3 w-3" />
                                Tone Match
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      
                                            <div className="grid grid-cols-2 gap-3">
                        <Button
                          onClick={() => handleCopy(reply.text, reply.tone)}
                          className={`h-14 rounded-2xl font-bold text-base shadow-xl transition-all duration-300 active:scale-95 ${
                            isCopied 
                              ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-green-500/50 scale-105' 
                              : `bg-gradient-to-r ${config.gradient} hover:opacity-95 text-white hover:shadow-2xl hover:-translate-y-1`
                          }`}
                          size="lg"
                        >
                          {isCopied ? (
                            <>
                              <span className="text-2xl mr-2">✓</span>
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4 mr-2" />
                              Copy {label}
                            </>
                          )}
                        </Button>
                        <div className="relative">
                          <Button
                            onClick={() => setShareMenuOpen(shareMenuOpen === reply.tone ? null : reply.tone)}
                            variant="outline"
                            className={`h-14 rounded-2xl font-bold text-base border-2 shadow-lg transition-all duration-300 active:scale-95 hover:shadow-xl hover:-translate-y-1 ${
                              sharing === reply.tone
                                ? 'border-purple-500 bg-purple-50 text-purple-700'
                                : 'border-gray-300 hover:border-purple-400 bg-white text-gray-700'
                            }`}
                            size="lg"
                          >
                            {sharing === reply.tone ? (
                              <>✓ Shared!</>
                            ) : (
                              <>
                                <Sparkles className="h-4 w-4 mr-2" />
                                Share
                              </>
                            )}
                          </Button>
                          {shareMenuOpen === reply.tone && (
                            <div className="absolute bottom-full mb-2 left-0 right-0 bg-white rounded-xl shadow-2xl border-2 border-gray-200 overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                              <button
                                onClick={() => handleShareLink(reply)}
                                className="w-full px-4 py-3 text-left text-sm font-medium hover:bg-purple-50 flex items-center gap-2 border-b border-gray-100"
                              >
                                🔗 Copy Share Link
                              </button>
                              <button
                                onClick={() => handleDownloadImage(reply)}
                                className="w-full px-4 py-3 text-left text-sm font-medium hover:bg-purple-50 flex items-center gap-2 border-b border-gray-100"
                              >
                                📥 Download Image
                              </button>
                              <button
                                onClick={() => handleCopyImage(reply)}
                                className="w-full px-4 py-3 text-left text-sm font-medium hover:bg-purple-50 flex items-center gap-2"
                              >
                                📋 Copy Image
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Try Again Button */}
            <div className="text-center pt-6 animate-in fade-in duration-500 delay-300">
              <Button
                onClick={handleTryAgain}
                variant="outline"
                className="bg-white/95 hover:bg-white text-purple-700 border-2 border-purple-300 hover:border-purple-500 rounded-2xl font-bold shadow-xl hover:shadow-2xl px-10 h-12 transition-all duration-300 hover:scale-105 animate-pulse hover:animate-none"
              >
                <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                Try Another Message
              </Button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="relative overflow-hidden bg-white border-2 border-gray-100 shadow-2xl rounded-3xl">
                <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-purple-400 to-indigo-400 animate-pulse" />
                <CardHeader className="pb-4 pt-8">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 bg-gray-200 rounded-2xl animate-pulse" />
                    <div className="space-y-2">
                      <div className="h-6 w-28 bg-gray-200 rounded animate-pulse" />
                      <div className="h-4 w-36 bg-gray-100 rounded animate-pulse" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5 pb-6">
                  <div className="bg-gray-50 rounded-2xl p-5 border-2 border-gray-100">
                    <div className="space-y-2">
                      <div className="h-5 w-full bg-gray-200 rounded animate-pulse" />
                      <div className="h-5 w-4/5 bg-gray-200 rounded animate-pulse" />
                    </div>
                  </div>
                  <div className="h-14 w-full bg-gradient-to-r from-purple-200 to-indigo-200 rounded-2xl animate-pulse" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && replies.length === 0 && message === '' && (
          <div className="text-center py-16 text-white/80 animate-in fade-in duration-500">
            <div className="inline-block p-6 bg-white/10 backdrop-blur rounded-3xl mb-6">
              <Sparkles className="h-20 w-20 mx-auto text-purple-300 animate-pulse" />
            </div>
            <p className="text-xl font-bold mb-2">Ready to craft the perfect reply?</p>
            <p className="text-base text-purple-200">Paste a message above and let AI do the magic ✨</p>
          </div>
        )}
      </div>
    </div>
  );
}
