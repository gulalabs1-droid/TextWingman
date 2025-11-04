'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Copy, Sparkles, Loader2, Lightbulb, Zap, Heart, MessageCircle } from 'lucide-react';
import { Logo } from '@/components/Logo';

type Reply = {
  tone: 'shorter' | 'spicier' | 'softer';
  text: string;
};

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

export default function AppPage() {
  const [message, setMessage] = useState('');
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [showExamples, setShowExamples] = useState(true);
  const [currentTagline, setCurrentTagline] = useState(0);
  const [showCraftedMessage, setShowCraftedMessage] = useState(false);
  const { toast } = useToast();
  
  const charCount = message.length;

  // Rotate taglines every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTagline((prev) => (prev + 1) % TAGLINES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleGenerate = async () => {
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
    
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          toast({
            title: "Daily limit reached",
            description: "Upgrade to Pro for unlimited replies!",
            variant: "destructive",
          });
        } else {
          throw new Error(data.error || 'Failed to generate replies');
        }
        return;
      }
      
      // API returns array of replies, validate and use it
      if (Array.isArray(data.replies) && data.replies.length > 0) {
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
    }
  };

  const handleCopy = async (text: string, tone: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(tone);
    
    // Visual feedback
    setTimeout(() => setCopied(null), 2000);
    
    toast({
      title: "✓ Copied!",
      description: `${TONE_CONFIG[tone as keyof typeof TONE_CONFIG].label} reply ready to send`,
    });
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
      <div className="container mx-auto px-4 py-8 max-w-md md:max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button asChild variant="ghost" size="sm" className="text-white/90 hover:text-white hover:bg-white/10 rounded-xl transition-all">
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <Link href="/" className="transition-transform hover:scale-105">
            <Logo size="sm" showText={true} />
          </Link>
          <div className="w-20" /> {/* Spacer */}
        </div>

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

            {/* Example Messages */}
            {showExamples && !message && (
              <div className="space-y-2 animate-in fade-in slide-in-from-bottom-3 duration-300">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Lightbulb className="h-4 w-4" />
                  <span>Try an example:</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {EXAMPLE_MESSAGES.map((example, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleExampleClick(example)}
                      className="text-left text-sm p-2 rounded-lg border border-gray-200 hover:border-purple-400 hover:bg-purple-50 transition-all text-gray-700"
                    >
                      &ldquo;{example}&rdquo;
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Button
                onClick={handleGenerate}
                disabled={loading || !message.trim()}
                className="w-full h-14 text-base bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-600 hover:from-purple-700 hover:via-purple-800 hover:to-indigo-700 shadow-xl hover:shadow-2xl rounded-2xl font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed animate-pulse hover:animate-none"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Crafting perfect replies...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Generate Replies
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
                return (
                  <Card 
                    key={reply.tone} 
                    style={{ animationDelay: `${idx * 150}ms` }}
                    className="relative overflow-hidden bg-white border-2 shadow-2xl rounded-3xl transition-all duration-500 hover:shadow-purple-500/40 hover:scale-[1.04] hover:-translate-y-2 animate-in fade-in slide-in-from-bottom-5 cursor-pointer group"
                  >
                    <div className={`absolute top-0 left-0 right-0 h-3 bg-gradient-to-r ${config.gradient} transition-all duration-300 group-hover:h-4`} />
                    <div className={`absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br ${config.gradient} rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity duration-500`} />
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
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold bg-gradient-to-r ${config.gradient} text-white px-4 py-2 rounded-full shadow-md`}>
                          {reply.text ? reply.text.split(' ').length : 0} words
                        </span>
                      </div>
                      <Button
                        onClick={() => handleCopy(reply.text, reply.tone)}
                        className={`w-full h-14 rounded-2xl font-bold text-base shadow-xl transition-all duration-300 active:scale-95 hover:shadow-2xl hover:-translate-y-1 ${
                          isCopied 
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white animate-in zoom-in duration-200' 
                            : `bg-gradient-to-r ${config.gradient} hover:opacity-95 text-white`
                        }`}
                        size="lg"
                      >
                        {isCopied ? (
                          <>
                            ✓ Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy
                          </>
                        )}
                      </Button>
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
