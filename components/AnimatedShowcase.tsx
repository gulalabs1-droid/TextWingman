'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, Sparkles, Copy, CheckCircle } from 'lucide-react';

const SHOWCASE_EXAMPLES = [
  {
    title: "Dating Scenario",
    context: "Crush/Dating 💘",
    input: "Hey, what are you doing this weekend?",
    replies: [
      { tone: "Shorter", emoji: "⚡", text: "Not much! What about you?" },
      { tone: "Spicier", emoji: "🔥", text: "Depends... what did you have in mind? 😏" },
      { tone: "Softer", emoji: "💚", text: "I'm pretty free! Would love to hang if you're down 😊" }
    ]
  },
  {
    title: "Friend Scenario",
    context: "Friend 🤝",
    input: "Dude where have you been??",
    replies: [
      { tone: "Shorter", emoji: "⚡", text: "Been busy af, my bad!" },
      { tone: "Spicier", emoji: "🔥", text: "Bro I know, I suck at texting 😅" },
      { tone: "Softer", emoji: "💚", text: "I know I'm sorry! Let's catch up soon" }
    ]
  },
  {
    title: "Work Scenario",
    context: "Work 💼",
    input: "Can we push the meeting to 3pm?",
    replies: [
      { tone: "Shorter", emoji: "⚡", text: "That works for me" },
      { tone: "Spicier", emoji: "🔥", text: "3pm is better actually, thanks" },
      { tone: "Softer", emoji: "💚", text: "Absolutely, 3pm works great for me" }
    ]
  }
];

export function AnimatedShowcase() {
  const [currentExample, setCurrentExample] = useState(0);
  const [stage, setStage] = useState<'input' | 'generating' | 'results'>('input');

  useEffect(() => {
    const cycleExample = () => {
      // Reset to input stage
      setStage('input');
      
      // After 2s, show generating
      setTimeout(() => setStage('generating'), 2000);
      
      // After 3s total, show results
      setTimeout(() => setStage('results'), 3000);
      
      // After 7s total, move to next example
      setTimeout(() => {
        setCurrentExample((prev) => (prev + 1) % SHOWCASE_EXAMPLES.length);
        setStage('input');
      }, 7000);
    };

    cycleExample();
    const interval = setInterval(cycleExample, 7000);

    return () => clearInterval(interval);
  }, [currentExample]);

  const example = SHOWCASE_EXAMPLES[currentExample];

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Tab Indicators */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {SHOWCASE_EXAMPLES.map((ex, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentExample(idx)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              idx === currentExample
                ? 'bg-white text-purple-700 shadow-lg'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            {ex.title}
          </button>
        ))}
      </div>

      {/* Main Demo Card */}
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-6 md:p-8 border-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-purple-700 font-bold">
            <MessageCircle className="h-5 w-5" />
            <span>Text Wingman</span>
          </div>
          <div className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {example.context}
          </div>
        </div>

        {/* Input Message */}
        <div className="mb-6 animate-in fade-in duration-500">
          <label className="text-sm font-semibold text-gray-700 mb-2 block">
            They said:
          </label>
          <div className="bg-gray-100 rounded-2xl p-4 border-2 border-gray-200">
            <p className="text-gray-800 italic">&ldquo;{example.input}&rdquo;</p>
          </div>
        </div>

        {/* Generating State */}
        {stage === 'generating' && (
          <div className="flex items-center justify-center py-12 animate-in fade-in duration-300">
            <div className="text-center space-y-4">
              <Sparkles className="h-12 w-12 text-purple-600 mx-auto animate-pulse" />
              <p className="text-purple-700 font-semibold">Crafting perfect replies...</p>
            </div>
          </div>
        )}

        {/* Results */}
        {stage === 'results' && (
          <div className="space-y-4 animate-in slide-in-from-bottom duration-500">
            <label className="text-sm font-semibold text-gray-700 mb-2 block">
              Your options:
            </label>
            {example.replies.map((reply, idx) => (
              <div
                key={idx}
                style={{ animationDelay: `${idx * 150}ms` }}
                className="bg-gradient-to-br from-purple-50 to-white rounded-2xl p-4 border-2 border-purple-200 hover:border-purple-400 transition-all animate-in fade-in slide-in-from-bottom"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{reply.emoji}</span>
                    <span className="font-bold text-gray-900">{String.fromCharCode(65 + idx)}: {reply.tone}</span>
                  </div>
                  <Copy className="h-4 w-4 text-gray-400" />
                </div>
                <p className="text-gray-700 font-medium">&ldquo;{reply.text}&rdquo;</p>
              </div>
            ))}
          </div>
        )}

        {/* Success Badge */}
        {stage === 'results' && (
          <div className="mt-6 flex items-center justify-center gap-2 text-green-600 animate-in fade-in duration-700 delay-500">
            <CheckCircle className="h-5 w-5" />
            <span className="font-semibold">Generated in 3 seconds</span>
          </div>
        )}
      </div>

      {/* Progress Dots */}
      <div className="flex items-center justify-center gap-2 mt-6">
        {SHOWCASE_EXAMPLES.map((_, idx) => (
          <div
            key={idx}
            className={`h-2 rounded-full transition-all ${
              idx === currentExample ? 'w-8 bg-white' : 'w-2 bg-white/30'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
