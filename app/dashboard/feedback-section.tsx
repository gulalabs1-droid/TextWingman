'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, MessageCircle } from 'lucide-react';

interface FeedbackSectionProps {
  userEmail: string;
  planType: string;
}

export default function FeedbackSection({ userEmail, planType }: FeedbackSectionProps) {
  const [suggestion, setSuggestion] = useState('');
  const [suggestionSubmitting, setSuggestionSubmitting] = useState(false);
  const [suggestionSubmitted, setSuggestionSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSuggestionSubmit = async () => {
    if (!suggestion.trim()) return;
    setSuggestionSubmitting(true);
    try {
      const res = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suggestion: suggestion.trim() }),
      });
      if (res.ok) {
        setSuggestionSubmitted(true);
        setSuggestion('');
        toast({
          title: 'Thanks for sharing!',
          description: 'Your feedback helps shape what we build next.',
        });
      }
    } catch (error) {
      console.error('Failed to submit suggestion:', error);
    } finally {
      setSuggestionSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 pt-6 border-t border-white/10">
      {/* Help Shape What's Next */}
      <div className="text-center">
        <h3 className="text-white font-medium mb-1">Help shape what&apos;s next</h3>
        <p className="text-white/50 text-xs mb-3">You&apos;re early — your input matters</p>
        {suggestionSubmitted ? (
          <p className="text-green-400 text-sm">✓ Thanks! We read every suggestion.</p>
        ) : (
          <div className="flex gap-2 max-w-md mx-auto">
            <Input
              value={suggestion}
              onChange={(e) => setSuggestion(e.target.value)}
              placeholder="What would make this better?"
              className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-xl"
              maxLength={500}
            />
            <Button
              onClick={handleSuggestionSubmit}
              disabled={suggestionSubmitting || !suggestion.trim()}
              className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-4"
            >
              {suggestionSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send'}
            </Button>
          </div>
        )}
      </div>

      {/* Report an Issue */}
      <div className="text-center pt-4">
        <p className="text-white/40 text-xs mb-2">
          Something feel off? Tell us — we read everything.
        </p>
        <a
          href={`mailto:gulalabs1@gmail.com?subject=Text Wingman Feedback&body=${encodeURIComponent(
            `\n\n---\nUser: ${userEmail}\nPlan: ${planType}\nBrowser: `
          )}`}
          className="inline-flex items-center gap-2 text-purple-300 hover:text-white text-sm transition-colors"
        >
          <MessageCircle className="h-4 w-4" />
          Report an issue
        </a>
      </div>
    </div>
  );
}
