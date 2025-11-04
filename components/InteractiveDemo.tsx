'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Copy, CheckCircle, Loader2 } from 'lucide-react';

const CONTEXT_OPTIONS = [
  { value: 'crush', label: 'Crush', emoji: '💘' },
  { value: 'friend', label: 'Friend', emoji: '🤝' },
  { value: 'work', label: 'Work', emoji: '💼' },
];

const DEMO_REPLIES = {
  crush: [
    { tone: 'Shorter', emoji: '⚡', text: "I'm down! When works for you?" },
    { tone: 'Spicier', emoji: '🔥', text: "That sounds great... or we could do drinks? 😏" },
    { tone: 'Softer', emoji: '💚', text: "I'd love to! I know a great spot we could try 😊" },
  ],
  friend: [
    { tone: 'Shorter', emoji: '⚡', text: "Yeah let's do it!" },
    { tone: 'Spicier', emoji: '🔥', text: "Finally! Thought you'd never ask 😅" },
    { tone: 'Softer', emoji: '💚', text: "That sounds awesome! I'm so down 🎉" },
  ],
  work: [
    { tone: 'Shorter', emoji: '⚡', text: "That works for me" },
    { tone: 'Spicier', emoji: '🔥', text: "Perfect, that's actually better timing" },
    { tone: 'Softer', emoji: '💚', text: "Absolutely, that time works great for me" },
  ],
};

export function InteractiveDemo() {
  const [message, setMessage] = useState('');
  const [selectedContext, setSelectedContext] = useState<'crush' | 'friend' | 'work'>('crush');
  const [loading, setLoading] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleGenerate = () => {
    if (!message.trim()) return;
    
    setLoading(true);
    setShowReplies(false);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setShowReplies(true);
    }, 1500);
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const replies = DEMO_REPLIES[selectedContext];

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card className="bg-white/95 backdrop-blur-xl border-0 shadow-2xl rounded-3xl overflow-hidden">
        <CardContent className="p-6 md:p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-bold text-gray-900">Try it yourself</h3>
            <p className="text-gray-600">Type a message and see the magic happen ✨</p>
          </div>

          {/* Context Selector */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-700">Who is this?</label>
            <div className="grid grid-cols-3 gap-3">
              {CONTEXT_OPTIONS.map((context) => (
                <button
                  key={context.value}
                  onClick={() => setSelectedContext(context.value as any)}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    selectedContext === context.value
                      ? 'border-purple-500 bg-purple-50 shadow-md scale-105'
                      : 'border-gray-200 bg-white hover:border-purple-300'
                  }`}
                >
                  <div className="text-2xl mb-1">{context.emoji}</div>
                  <div className="text-xs font-bold text-gray-900">{context.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Message Input */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Their message:</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g., Hey, want to grab coffee sometime?"
              className="w-full min-h-[100px] p-4 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none resize-none transition-all"
              maxLength={200}
            />
            <p className="text-xs text-gray-500 text-right">{message.length}/200</p>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={!message.trim() || loading}
            className="w-full h-14 text-lg font-bold rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-xl transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Generate Replies
              </>
            )}
          </Button>

          {/* Results */}
          {showReplies && (
            <div className="space-y-4 pt-4 animate-in fade-in slide-in-from-bottom duration-500">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-bold text-gray-900">Your 3 options:</h4>
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              
              {replies.map((reply, idx) => (
                <div
                  key={idx}
                  style={{ animationDelay: `${idx * 150}ms` }}
                  className="bg-gradient-to-br from-purple-50 to-white rounded-xl p-4 border-2 border-purple-200 hover:border-purple-400 transition-all animate-in fade-in slide-in-from-bottom group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-black shadow-lg">
                        {String.fromCharCode(65 + idx)}
                      </div>
                      <div>
                        <span className="font-bold text-gray-900">{reply.tone}</span>
                        <span className="text-2xl ml-2">{reply.emoji}</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopy(reply.text, idx)}
                      className={`transition-all ${
                        copiedIndex === idx 
                          ? 'bg-green-100 text-green-700' 
                          : 'hover:bg-purple-100'
                      }`}
                    >
                      {copiedIndex === idx ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-1" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-gray-700 font-medium">&ldquo;{reply.text}&rdquo;</p>
                </div>
              ))}

              {/* CTA After Demo */}
              <div className="pt-4 text-center space-y-3 border-t-2 border-gray-200">
                <p className="text-sm font-semibold text-gray-700">
                  Like what you see? Get unlimited replies! 🚀
                </p>
                <Button
                  asChild
                  size="lg"
                  className="w-full h-12 font-bold rounded-xl bg-white text-purple-700 border-2 border-purple-300 hover:bg-purple-50 shadow-lg"
                >
                  <a href="/app">Start Free - No Card Required →</a>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
