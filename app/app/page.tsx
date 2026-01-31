'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, ArrowRight, Copy, Sparkles, Loader2, Check, Target, Crown, Heart, MessageCircle, Shield, Calendar, Share2 } from 'lucide-react';
import { Logo } from '@/components/Logo';

// Types
type GoalType = 'get_number' | 'set_date' | 'recover_fumble' | 'regain_frame' | 'build_tension' | 'close_tonight' | null;
type StyleType = 'hood_charisma' | 'smooth_ceo' | 'villain_calm' | 'lover_boy' | 'spanish_flirt' | null;

interface Boundaries {
  noDoubleText: boolean;
  noParagraphs: boolean;
  noGoodMorning: boolean;
  noOverCompliment: boolean;
  askNumberFast: boolean;
  assumePrize: boolean;
}

interface GeneratedReply {
  label: string;
  text: string;
  type: 'best' | 'playful' | 'direct' | 'escalation';
  rationale?: string;
}

// Configuration
const GOALS = [
  { value: 'get_number', label: 'Get her number', icon: MessageCircle, description: 'Move off the app' },
  { value: 'set_date', label: 'Set the date', icon: Calendar, description: 'Lock in plans' },
  { value: 'recover_fumble', label: 'Recover after a fumble', icon: Shield, description: 'Get back on track' },
  { value: 'regain_frame', label: 'Stop being needy', icon: Crown, description: 'Regain frame' },
  { value: 'build_tension', label: 'Flirt + build tension', icon: Heart, description: 'Keep it interesting' },
  { value: 'close_tonight', label: 'Close tonight', icon: Target, description: 'Direct + clean' },
] as const;

const STYLES = [
  { value: 'hood_charisma', label: 'Hood Charisma', description: 'Confident, smooth, street-smart', gradient: 'from-purple-600 to-pink-600' },
  { value: 'smooth_ceo', label: 'Smooth CEO', description: 'Professional charm, composed', gradient: 'from-slate-600 to-zinc-700' },
  { value: 'villain_calm', label: 'Villain Calm', description: 'Unbothered, mysterious', gradient: 'from-red-900 to-black' },
  { value: 'lover_boy', label: 'Lover Boy', description: 'Romantic but controlled', gradient: 'from-rose-500 to-red-600' },
  { value: 'spanish_flirt', label: 'Spanish Flirt', description: 'Bilingual charm', gradient: 'from-orange-500 to-yellow-500' },
] as const;

const BOUNDARY_OPTIONS = [
  { key: 'noDoubleText', label: 'No double texting', description: 'Never send two in a row' },
  { key: 'noParagraphs', label: 'No paragraphs', description: 'Keep it short' },
  { key: 'noGoodMorning', label: 'No good morning texts', description: 'Too early for that' },
  { key: 'noOverCompliment', label: "Don't over-compliment", description: 'Stay composed' },
  { key: 'askNumberFast', label: 'Ask for number fast', description: 'Move quickly' },
  { key: 'assumePrize', label: 'Assume you are the prize', description: 'Frame control' },
] as const;

const DEFAULT_BOUNDARIES: Boundaries = {
  noDoubleText: true,
  noParagraphs: true,
  noGoodMorning: true,
  noOverCompliment: true,
  askNumberFast: false,
  assumePrize: true,
};

export default function AppPage() {
  // Onboarding state
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState<GoalType>(null);
  const [style, setStyle] = useState<StyleType>('hood_charisma');
  const [noSimpMode, setNoSimpMode] = useState(true);
  const [boundaries, setBoundaries] = useState<Boundaries>(DEFAULT_BOUNDARIES);
  
  // Conversation state
  const [message, setMessage] = useState('');
  const [herVibe, setHerVibe] = useState('');
  const [yourSchedule, setYourSchedule] = useState('');
  
  // Results state
  const [replies, setReplies] = useState<GeneratedReply[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  
  // Usage state - persisted in localStorage with 24-hour reset
  const [usageCount, setUsageCount] = useState(0);
  const [showPaywall, setShowPaywall] = useState(false);
  const FREE_LIMIT = 5;

  // Load usage from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('textwingman_usage');
    if (stored) {
      const { count, timestamp } = JSON.parse(stored);
      const now = Date.now();
      const hoursSinceReset = (now - timestamp) / (1000 * 60 * 60);
      
      if (hoursSinceReset >= 24) {
        // Reset after 24 hours
        localStorage.setItem('textwingman_usage', JSON.stringify({ count: 0, timestamp: now }));
        setUsageCount(0);
      } else {
        setUsageCount(count);
      }
    } else {
      // First visit
      localStorage.setItem('textwingman_usage', JSON.stringify({ count: 0, timestamp: Date.now() }));
    }
  }, []);

  // Save usage to localStorage whenever it changes
  const incrementUsage = () => {
    const newCount = usageCount + 1;
    setUsageCount(newCount);
    const stored = localStorage.getItem('textwingman_usage');
    const timestamp = stored ? JSON.parse(stored).timestamp : Date.now();
    localStorage.setItem('textwingman_usage', JSON.stringify({ count: newCount, timestamp }));
  };

  const getRemainingReplies = () => Math.max(0, FREE_LIMIT - usageCount);

  const getHoursUntilReset = () => {
    const stored = localStorage.getItem('textwingman_usage');
    if (stored) {
      const { timestamp } = JSON.parse(stored);
      const hoursSinceReset = (Date.now() - timestamp) / (1000 * 60 * 60);
      return Math.max(0, Math.ceil(24 - hoursSinceReset));
    }
    return 24;
  };
  
  const { toast } = useToast();

  const canProceed = () => {
    switch (step) {
      case 1: return goal !== null;
      case 2: return style !== null;
      case 3: return true;
      case 4: return message.trim().length > 0;
      default: return true;
    }
  };

  const handleNext = () => {
    if (step < 4 && canProceed()) {
      setStep(step + 1);
    } else if (step === 4 && canProceed()) {
      handleGenerate();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleGenerate = async () => {
    if (!message.trim()) return;
    
    // Check if user has reached free limit
    if (usageCount >= FREE_LIMIT) {
      setShowPaywall(true);
      return;
    }

    setLoading(true);
    setStep(5);
    
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message.trim(),
          goal,
          style,
          noSimpMode,
          boundaries,
          herVibe: herVibe.trim() || undefined,
          yourSchedule: yourSchedule.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate replies');
      }
      
      // Transform API response to new format
      if (Array.isArray(data.replies) && data.replies.length > 0) {
        const transformedReplies: GeneratedReply[] = [
          { label: 'Best Option', text: data.replies[0]?.text || '', type: 'best', rationale: 'Most likely to get a response' },
          { label: 'More Playful', text: data.replies[1]?.text || '', type: 'playful', rationale: 'Keeps it light and fun' },
          { label: 'More Direct', text: data.replies[2]?.text || '', type: 'direct', rationale: 'Cuts to the chase' },
          { label: 'Escalation Move', text: getEscalationText(), type: 'escalation', rationale: 'Push for the number or date' },
        ];
        setReplies(transformedReplies);
        incrementUsage();
      }

      toast({
        title: "Replies generated",
        description: "Pick your move",
      });
    } catch (error) {
      console.error('Generation error:', error);
      toast({
        title: "Something went wrong",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
      setStep(4);
    } finally {
      setLoading(false);
    }
  };

  const getEscalationText = () => {
    switch (goal) {
      case 'get_number': return "Let me get your number so we can actually plan something";
      case 'set_date': return "What's your schedule looking like this week?";
      case 'close_tonight': return "Come through. I'll send you the address";
      default: return "Send me a voice note, I wanna hear your voice";
    }
  };

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      toast({ title: "Copied", description: "Paste it in your chat" });
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  };

  const handleShare = async (reply: GeneratedReply) => {
    const shareData = { theirMessage: message.substring(0, 100), myReply: reply.text, type: reply.type };
    const encoded = btoa(JSON.stringify(shareData));
    const shareUrl = `${window.location.origin}/share/${encoded}`;
    await navigator.clipboard.writeText(shareUrl);
    toast({ title: "Share link copied", description: "Paste it anywhere" });
  };

  const handleStartOver = () => {
    setStep(1);
    setGoal(null);
    setMessage('');
    setHerVibe('');
    setYourSchedule('');
    setReplies([]);
  };

  const toggleBoundary = (key: keyof Boundaries) => {
    setBoundaries(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Progress indicator
  const ProgressBar = () => (
    <div className="flex items-center justify-center gap-2 mb-8">
      {[1, 2, 3, 4].map((s) => (
        <div key={s} className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
            s < step ? 'bg-green-500 text-white' :
            s === step ? 'bg-white text-purple-700' :
            'bg-white/20 text-white/50'
          }`}>
            {s < step ? <Check className="h-4 w-4" /> : s}
          </div>
          {s < 4 && <div className={`w-8 h-0.5 ${s < step ? 'bg-green-500' : 'bg-white/20'}`} />}
        </div>
      ))}
    </div>
  );

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
              <h2 className="text-2xl font-bold text-gray-900 mb-2">You've used all 5 free replies</h2>
              <p className="text-gray-600">Unlock unlimited replies + full style control</p>
              <p className="text-sm text-gray-400 mt-2">Free replies reset in {getHoursUntilReset()} hours</p>
            </div>
            <div className="space-y-3">
              <Link href="/#pricing" className="block">
                <Button className="w-full h-14 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg rounded-2xl">
                  Unlock Pro - $9.99/mo
                </Button>
              </Link>
              <p className="text-xs text-gray-500">Cancel anytime. Best value: $79/year</p>
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
      <div className="container mx-auto px-4 max-w-lg py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-white/90 hover:text-white hover:bg-white/10 rounded-xl"
            onClick={step === 1 ? undefined : handleBack}
            asChild={step === 1}
          >
            {step === 1 ? (
              <Link href="/"><ArrowLeft className="h-4 w-4 mr-2" />Back</Link>
            ) : (
              <><ArrowLeft className="h-4 w-4 mr-2" />Back</>
            )}
          </Button>
          <Logo size="sm" showText={false} />
          <div className="w-16" />
        </div>

        {step < 5 && <ProgressBar />}

        {/* Step 1: Goal Picker */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white mb-2">What are you trying to do?</h1>
              <p className="text-purple-200 text-sm">This helps us craft the perfect response</p>
            </div>
            <div className="grid gap-3">
              {GOALS.map((g) => {
                const Icon = g.icon;
                return (
                  <button
                    key={g.value}
                    onClick={() => setGoal(g.value)}
                    className={`p-4 rounded-2xl border-2 transition-all text-left flex items-center gap-4 ${
                      goal === g.value
                        ? 'border-white bg-white/20 shadow-lg'
                        : 'border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/40'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      goal === g.value ? 'bg-white text-purple-700' : 'bg-white/10 text-white'
                    }`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-bold text-white">{g.label}</p>
                      <p className="text-sm text-white/60">{g.description}</p>
                    </div>
                    {goal === g.value && <Check className="h-5 w-5 text-green-400 ml-auto" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Style Picker */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white mb-2">Pick your voice</h1>
              <p className="text-purple-200 text-sm">How do you want to come across?</p>
            </div>
            <div className="grid gap-3">
              {STYLES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setStyle(s.value)}
                  className={`p-4 rounded-2xl border-2 transition-all text-left ${
                    style === s.value
                      ? 'border-white bg-white/20 shadow-lg'
                      : 'border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white">{s.label}</p>
                      <p className="text-sm text-white/60">{s.description}</p>
                    </div>
                    {style === s.value && <Check className="h-5 w-5 text-green-400" />}
                  </div>
                </button>
              ))}
            </div>
            
            {/* No Simp Mode Toggle */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-red-900/50 to-black/50 border border-red-500/30">
              <button
                onClick={() => setNoSimpMode(!noSimpMode)}
                className="w-full flex items-center justify-between"
              >
                <div>
                  <p className="font-bold text-white">No Simp Mode</p>
                  <p className="text-sm text-white/60">Never sound desperate or needy</p>
                </div>
                <div className={`w-12 h-7 rounded-full transition-all ${noSimpMode ? 'bg-red-500' : 'bg-white/20'}`}>
                  <div className={`w-5 h-5 rounded-full bg-white mt-1 transition-all ${noSimpMode ? 'ml-6' : 'ml-1'}`} />
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Boundaries */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white mb-2">Your boundaries</h1>
              <p className="text-purple-200 text-sm">Set your texting rules</p>
            </div>
            <div className="grid gap-3">
              {BOUNDARY_OPTIONS.map((b) => (
                <button
                  key={b.key}
                  onClick={() => toggleBoundary(b.key as keyof Boundaries)}
                  className={`p-4 rounded-2xl border-2 transition-all text-left flex items-center justify-between ${
                    boundaries[b.key as keyof Boundaries]
                      ? 'border-green-500/50 bg-green-500/10'
                      : 'border-white/20 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div>
                    <p className="font-bold text-white">{b.label}</p>
                    <p className="text-sm text-white/60">{b.description}</p>
                  </div>
                  <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center ${
                    boundaries[b.key as keyof Boundaries] ? 'bg-green-500 border-green-500' : 'border-white/40'
                  }`}>
                    {boundaries[b.key as keyof Boundaries] && <Check className="h-4 w-4 text-white" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Paste Convo */}
        {step === 4 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white mb-2">Paste the convo</h1>
              <p className="text-purple-200 text-sm">Drop her last message</p>
            </div>
            <Card className="bg-white/95 backdrop-blur rounded-3xl overflow-hidden">
              <CardContent className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-2">Her message</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Paste what she said..."
                    className="w-full min-h-[120px] p-4 rounded-xl border-2 border-gray-200 bg-white text-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-300"
                    maxLength={500}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-2">
                    Her vibe <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    value={herVibe}
                    onChange={(e) => setHerVibe(e.target.value)}
                    placeholder="e.g. artsy, gym girl, introverted..."
                    className="w-full p-3 rounded-xl border-2 border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                {(goal === 'set_date' || goal === 'close_tonight') && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-2">
                      Your schedule <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <input
                      value={yourSchedule}
                      onChange={(e) => setYourSchedule(e.target.value)}
                      placeholder="e.g. Free Thursday night, busy weekends..."
                      className="w-full p-3 rounded-xl border-2 border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 5: Results */}
        {step === 5 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {loading ? (
              <div className="text-center py-16">
                <Loader2 className="h-12 w-12 text-white animate-spin mx-auto mb-4" />
                <p className="text-white font-medium">Crafting your moves...</p>
              </div>
            ) : (
              <>
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-white mb-2">Your moves</h1>
                  <p className="text-purple-200 text-sm">Pick the one that fits</p>
                </div>
                <div className="space-y-4">
                  {replies.map((reply, idx) => (
                    <Card key={idx} className={`bg-white/95 backdrop-blur rounded-2xl overflow-hidden ${
                      reply.type === 'best' ? 'ring-2 ring-green-500' : ''
                    }`}>
                      <CardContent className="p-5 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                            reply.type === 'best' ? 'bg-green-100 text-green-700' :
                            reply.type === 'playful' ? 'bg-purple-100 text-purple-700' :
                            reply.type === 'direct' ? 'bg-blue-100 text-blue-700' :
                            'bg-orange-100 text-orange-700'
                          }`}>
                            {reply.label}
                          </span>
                          {reply.type === 'best' && (
                            <span className="text-xs text-green-600 font-medium">Recommended</span>
                          )}
                        </div>
                        <p className="text-gray-900 text-lg leading-relaxed">{reply.text}</p>
                        {reply.rationale && (
                          <p className="text-xs text-gray-500 italic">Why: {reply.rationale}</p>
                        )}
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleCopy(reply.text, reply.label)}
                            className={`flex-1 h-12 rounded-xl font-bold ${
                              copied === reply.label
                                ? 'bg-green-500 text-white'
                                : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                            }`}
                          >
                            {copied === reply.label ? (
                              <><Check className="h-4 w-4 mr-2" />Copied</>
                            ) : (
                              <><Copy className="h-4 w-4 mr-2" />Copy</>
                            )}
                          </Button>
                          <Button
                            onClick={() => handleShare(reply)}
                            variant="outline"
                            className="h-12 px-4 rounded-xl border-2"
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <Button
                  onClick={handleStartOver}
                  variant="outline"
                  className="w-full h-12 bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-xl font-bold"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Try Another Message
                </Button>
              </>
            )}
          </div>
        )}

        {/* Navigation Button */}
        {step < 5 && (
          <div className="mt-8">
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="w-full h-14 bg-white text-purple-700 hover:bg-gray-100 font-bold text-lg rounded-2xl shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {step === 4 ? (
                <>Generate Replies <Sparkles className="h-5 w-5 ml-2" /></>
              ) : (
                <>Continue <ArrowRight className="h-5 w-5 ml-2" /></>
              )}
            </Button>
            {step === 4 && (
              <p className="text-center text-xs text-purple-200 mt-3">
                {getRemainingReplies()} free {getRemainingReplies() === 1 ? 'reply' : 'replies'} left today · Pro: unlimited
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
