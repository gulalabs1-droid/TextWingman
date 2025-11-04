'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Copy, Sparkles, Loader2, Lightbulb } from 'lucide-react';

type Reply = {
  tone: 'shorter' | 'spicier' | 'softer';
  text: string;
};

const TONE_CONFIG = {
  shorter: {
    label: 'Shorter',
    description: 'Brief & casual',
    color: 'bg-blue-500',
  },
  spicier: {
    label: 'Spicier',
    description: 'Playful & flirty',
    color: 'bg-red-500',
  },
  softer: {
    label: 'Softer',
    description: 'Warm & genuine',
    color: 'bg-green-500',
  },
};

const EXAMPLE_MESSAGES = [
  "Hey, what are you doing this weekend?",
  "Want to grab coffee sometime?",
  "Sorry I missed your call earlier",
  "That's actually pretty funny lol"
];

export default function AppPage() {
  const [message, setMessage] = useState('');
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [showExamples, setShowExamples] = useState(true);
  const { toast } = useToast();
  
  const charCount = message.length;

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
    <div className="min-h-screen bg-gradient-to-b from-black to-purple-600">
      <div className="container mx-auto px-4 py-6 max-w-md md:max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button asChild variant="ghost" size="sm" className="text-white hover:bg-white/10">
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <h1 className="text-xl font-bold text-white">Text Wingman</h1>
          <div className="w-16" /> {/* Spacer */}
        </div>

        {/* Input Section */}
        <Card className="mb-6 bg-white/95 backdrop-blur-xl border-0 shadow-2xl hover:shadow-purple-500/10 rounded-2xl overflow-hidden transition-shadow duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Paste your message</CardTitle>
            <CardDescription className="text-sm">
              Get 3 perfect replies instantly
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <textarea
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  if (e.target.value.trim()) setShowExamples(false);
                }}
                placeholder="Paste the message you received here..."
                className="w-full min-h-[120px] p-4 pb-8 rounded-xl border-2 border-gray-200 bg-white text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
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

            <Button
              onClick={handleGenerate}
              disabled={loading || !message.trim()}
              className="w-full h-12 text-base bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-lg rounded-xl font-semibold transition-all active:scale-95"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating amazing replies...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Generate Replies
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Replies Section */}
        {replies.length > 0 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-5 duration-500">
            <h2 className="text-lg font-semibold text-white text-center mb-4">Choose your reply:</h2>
            <div className="grid gap-3">
              {replies.map((reply, idx) => {
                const config = TONE_CONFIG[reply.tone];
                const isCopied = copied === reply.tone;
                return (
                  <Card 
                    key={reply.tone} 
                    style={{ animationDelay: `${idx * 100}ms` }}
                    className="relative overflow-hidden bg-white/95 backdrop-blur-xl border-0 shadow-xl rounded-2xl transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10 hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-3"
                  >
                    <div className={`absolute top-0 left-0 right-0 h-1.5 ${config.color}`} />
                    <CardHeader className="pb-2 pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base font-bold">{config.label}</CardTitle>
                          <CardDescription className="text-xs">{config.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <p className="text-sm text-gray-700 mb-3 leading-relaxed">{reply.text}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{reply.text ? reply.text.split(' ').length : 0} words</span>
                      </div>
                      <Button
                        onClick={() => handleCopy(reply.text, reply.tone)}
                        className={`w-full rounded-xl font-semibold shadow-md transition-all active:scale-95 ${
                          isCopied 
                            ? 'bg-green-500 hover:bg-green-600' 
                            : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800'
                        }`}
                        size="sm"
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
            <div className="text-center pt-4">
              <Button
                onClick={handleTryAgain}
                variant="outline"
                className="bg-white/90 hover:bg-white text-purple-700 border-2 border-purple-300 hover:border-purple-400 rounded-xl font-semibold shadow-lg px-8"
              >
                Try Again
              </Button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="relative overflow-hidden bg-white/95 backdrop-blur border-0 shadow-xl rounded-2xl">
                <CardHeader className="pb-2 pt-4">
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 w-32 bg-gray-100 rounded animate-pulse mt-2" />
                </CardHeader>
                <CardContent className="space-y-3 pb-4">
                  <div className="space-y-2">
                    <div className="h-3 w-full bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 w-4/5 bg-gray-200 rounded animate-pulse" />
                  </div>
                  <div className="h-10 w-full bg-gray-100 rounded-xl animate-pulse" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && replies.length === 0 && message === '' && (
          <div className="text-center py-12 text-white/70 animate-in fade-in duration-500">
            <Sparkles className="h-16 w-16 mx-auto mb-4 opacity-60 animate-pulse" />
            <p className="text-base font-medium">Paste a message above to get started</p>
            <p className="text-sm mt-2 opacity-80">Get 3 AI-powered reply options instantly</p>
          </div>
        )}
      </div>
    </div>
  );
}
