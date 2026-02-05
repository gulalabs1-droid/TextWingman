'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Copy, Sparkles, Loader2, Lightbulb, Zap, Heart, MessageCircle, Crown, Shield, CheckCircle } from 'lucide-react';
import { Logo } from '@/components/Logo';

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
  const usageLimit = 3; // Matches homepage pricing: 3 free replies per day
  const [showExamplesDrawer, setShowExamplesDrawer] = useState(false);
  const [v2Mode, setV2Mode] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [v2Meta, setV2Meta] = useState<V2Meta>(null);
  const [v2Step, setV2Step] = useState<string | null>(null);
  const { toast } = useToast();
  
  const charCount = message.length;

  // Load usage and Pro status from server on mount
  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const res = await fetch('/api/usage');
        if (res.ok) {
          const data = await res.json();
          setUsageCount(data.usageCount);
          setRemainingReplies(data.remaining);
          // Check if user is Pro (unlimited or has active subscription)
          if (data.isPro || data.remaining === 999) {
            setIsPro(true);
          }
        }
      } catch (error) {
        console.error('Failed to fetch usage:', error);
      }
    };
    fetchUsage();
  }, []);

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
      const endpoint = v2Mode && isPro ? '/api/generate-v2' : '/api/generate';
      
      // Show progress steps for V2
      if (v2Mode && isPro) {
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
      if (v2Mode && isPro && data.shorter && data.spicier && data.softer) {
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
        title: "✨ Replies generated!",
        description: "Pick your favorite and copy it",
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
        title: "✓ Copied to clipboard!",
        description: "Paste it into your chat app",
      });
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
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `textwingman-${reply.tone}.png`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "📥 Image downloaded!", description: "Share it anywhere" });
    } catch (err) {
      toast({ title: "Failed to download", variant: "destructive" });
    }
    setTimeout(() => { setSharing(null); setShareMenuOpen(null); }, 2000);
  };

  // Share: Copy image to clipboard
  const handleCopyImage = async (reply: Reply) => {
    setSharing(reply.tone);
    try {
      const imageUrl = `/api/share/image?their=${encodeURIComponent(message.substring(0, 100))}&reply=${encodeURIComponent(reply.text)}&tone=${reply.tone}`;
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      toast({ title: "� Image copied!", description: "Paste it in any app" });
    } catch (err) {
      toast({ title: "Failed to copy image", description: "Try downloading instead", variant: "destructive" });
    }
    setTimeout(() => { setSharing(null); setShareMenuOpen(null); }, 2000);
  };

  const handleTryAgain = () => {
    setMessage('');
    setReplies([]);
    setCopied(null);
    setShowExamples(true);
  };

  const handleExampleClick = (example: string) => {
    setMessage(example);
    setShowExamples(false);
  };

  // Handle Stripe checkout
  const handleCheckout = async (plan: 'weekly' | 'monthly' | 'annual') => {
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
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
      <div className={`container mx-auto px-4 py-8 max-w-md md:max-w-2xl ${usageCount > 0 && !isPro ? 'pt-20' : ''}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button asChild variant="ghost" size="sm" className="text-white/90 hover:text-white hover:bg-white/10 rounded-xl transition-all">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <Link href="/" className="transition-transform hover:scale-105">
            <Logo size="sm" showText={true} />
          </Link>
          <Button asChild variant="ghost" size="sm" className="text-white/90 hover:text-white hover:bg-white/10 rounded-xl transition-all">
            <Link href="/profile">
              <Crown className="h-4 w-4 mr-2" />
              Profile
            </Link>
          </Button>
        </div>

        {/* Pro V2 Status Banner */}
        {isPro && v2Mode && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-green-500/20 via-emerald-500/20 to-teal-500/20 border border-green-500/30 backdrop-blur">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-green-100">V2 Verified Mode Active</p>
                  <p className="text-xs text-green-300/80">3-agent pipeline: Draft → Rule-Check → Tone-Verify</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-green-500/30 text-green-200 px-2 py-1 rounded-full">≤18 words</span>
                <span className="text-xs bg-blue-500/30 text-blue-200 px-2 py-1 rounded-full">No emojis</span>
              </div>
            </div>
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

        {/* Input Section */}
        <Card className="mb-8 bg-white/95 backdrop-blur-xl border-0 shadow-2xl hover:shadow-purple-500/20 rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-1">
          <CardHeader className="pb-4 pt-6 bg-gradient-to-br from-purple-50 to-white">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-purple-600 animate-bounce" />
              What&apos;d they say? Drop it here 👇
            </CardTitle>
            <CardDescription className="text-sm text-gray-600 font-medium">
              Wing it like a pro — paste the text and we&apos;ll handle the rest ✨
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-6 pb-6">
            {/* Context Selector */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <span>🎯</span> Who is this?
              </label>
              <div className="grid grid-cols-3 gap-2">
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
                placeholder="Drop their message here... we got you 💬"
                className="w-full min-h-[130px] p-5 pb-8 rounded-2xl border-2 border-gray-200 bg-white/50 text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-300 transition-all shadow-sm hover:shadow-md focus:shadow-lg"
                maxLength={500}
                aria-label="Message input"
              />
              <div className={`absolute bottom-3 right-3 text-xs transition-colors ${
                charCount > 450 ? 'text-red-500 font-semibold' : 'text-gray-400'
              }`}>
                {charCount}/500
              </div>
            </div>

            {/* Quick Examples Button */}
            {!message && (
              <button
                onClick={() => setShowExamplesDrawer(!showExamplesDrawer)}
                className="w-full p-3 rounded-xl border-2 border-dashed border-purple-300 hover:border-purple-500 bg-purple-50/50 hover:bg-purple-50 transition-all text-purple-700 font-medium text-sm flex items-center justify-center gap-2"
              >
                <Lightbulb className="h-4 w-4" />
                {showExamplesDrawer ? 'Hide' : 'Show'} Quick Examples
              </button>
            )}

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

            {/* V2 Toggle - Pro Only */}
            {isPro && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-bold text-green-800">V2 Verified Mode</p>
                    <p className="text-xs text-green-600">≤18 words • No emojis • No needy text • Tone-matched</p>
                  </div>
                </div>
                <button
                  onClick={() => setV2Mode(!v2Mode)}
                  className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                    v2Mode ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${
                      v2Mode ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            )}

            <div className="space-y-2">
              <Button
                onClick={handleGenerate}
                disabled={loading || !message.trim()}
                className={`w-full h-14 text-base shadow-xl hover:shadow-2xl rounded-2xl font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed animate-pulse hover:animate-none ${
                  v2Mode && isPro
                    ? 'bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 hover:from-green-700 hover:via-emerald-700 hover:to-teal-700'
                    : 'bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-600 hover:from-purple-700 hover:via-purple-800 hover:to-indigo-700'
                }`}
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {v2Mode && isPro ? (
                      v2Step === 'drafting' ? '✍️ Drafting replies...' :
                      v2Step === 'rule-checking' ? '📋 Rule-checking...' :
                      v2Step === 'tone-verifying' ? '🎯 Tone-verifying...' :
                      'Finalizing...'
                    ) : 'Crafting perfect replies...'}
                  </>
                ) : (
                  <>
                    {v2Mode && isPro ? <Shield className="mr-2 h-5 w-5" /> : <Sparkles className="mr-2 h-5 w-5" />}
                    {v2Mode && isPro ? 'Generate V2 Replies' : 'Generate Replies'}
                  </>
                )}
              </Button>
              {!loading && !replies.length && (
                <p className="text-center text-xs text-gray-500 font-medium animate-fade-in transition-opacity duration-500">
                  {TAGLINES[currentTagline]}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Replies Section */}
        {replies.length > 0 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-5 duration-500">
            <div className="text-center space-y-2">
              {showCraftedMessage && (
                <p className="text-purple-300 text-sm font-medium animate-in fade-in duration-300 mb-2">
                  ✨ Crafted with care just for you 💬
                </p>
              )}
              <h2 className="text-2xl font-bold text-white animate-in slide-in-from-top duration-300">Choose your reply</h2>
              <p className="text-purple-200 text-sm animate-in fade-in duration-500 delay-100">Pick your favorite and copy it 👇</p>
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
                    className="relative overflow-hidden bg-white border-2 shadow-2xl rounded-3xl transition-all duration-500 hover:shadow-purple-500/40 hover:scale-[1.04] hover:-translate-y-2 animate-in fade-in slide-in-from-bottom-5 cursor-pointer group"
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
                        <span className={`text-xs font-bold bg-gradient-to-r ${config.gradient} text-white px-4 py-2 rounded-full shadow-md`}>
                          {reply.text ? reply.text.split(' ').length : 0} words
                        </span>
                        {/* V2 Badges with Tooltips */}
                        {v2Meta && (
                          <div className="flex items-center gap-2 flex-wrap">
                            {v2Meta.ruleChecks[reply.tone] && (
                              <span 
                                className="flex items-center gap-1 text-xs font-bold bg-green-100 text-green-700 px-3 py-1.5 rounded-full cursor-help"
                                title="✓ ≤18 words • No emojis • No needy language • No double questions"
                              >
                                <CheckCircle className="h-3 w-3" />
                                Rule-Compliant
                              </span>
                            )}
                            {!v2Meta.ruleChecks[reply.tone] && v2Meta.ruleChecks[reply.tone] !== undefined && (
                              <span 
                                className="flex items-center gap-1 text-xs font-bold bg-yellow-100 text-yellow-700 px-3 py-1.5 rounded-full cursor-help"
                                title="Some rules not met - best attempt shown"
                              >
                                ⚠️ Partial
                              </span>
                            )}
                            {v2Meta.toneChecks[reply.tone] && (
                              <span 
                                className="flex items-center gap-1 text-xs font-bold bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full cursor-help"
                                title={`Matches ${reply.tone} tone: ${reply.tone === 'shorter' ? 'minimal, confident' : reply.tone === 'spicier' ? 'assertive, flirty tension' : 'warm, considerate'}`}
                              >
                                <CheckCircle className="h-3 w-3" />
                                Tone Verified
                              </span>
                            )}
                            {v2Meta.confidence[reply.tone] !== undefined && (
                              <span 
                                className={`text-xs font-bold px-3 py-1.5 rounded-full cursor-help ${
                                  v2Meta.confidence[reply.tone] >= 80 
                                    ? 'bg-green-100 text-green-700' 
                                    : v2Meta.confidence[reply.tone] >= 60 
                                      ? 'bg-yellow-100 text-yellow-700'
                                      : 'bg-red-100 text-red-700'
                                }`}
                                title={`Confidence score: ${v2Meta.confidence[reply.tone] >= 80 ? 'Strong match' : v2Meta.confidence[reply.tone] >= 60 ? 'Acceptable' : 'Weak match'}`}
                              >
                                {v2Meta.confidence[reply.tone]}% confident
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
