'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type PulseEvent = {
  type: 'them_replied' | 'you_sent' | 'strategy_update';
  timestamp: number;
};

type PowerPulseProps = {
  momentum: 'theirs' | 'yours' | 'balanced';
  healthScore: number;
  riskScore: number;
  themCount: number;
  youCount: number;
  threadLength: number;
  strategyMomentum?: string;
  strategyEnergy?: string;
  isLight?: boolean;
};

// Generate a smooth pulse path with variable amplitude and frequency
function generatePulsePath(
  width: number,
  height: number,
  amplitude: number,
  frequency: number,
  phase: number,
  spikes: { pos: number; height: number; decay: number }[]
): string {
  const midY = height / 2;
  const points: string[] = [];
  const steps = 120;

  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * width;
    const t = (i / steps) * Math.PI * 2 * frequency + phase;

    // Base heartbeat wave
    let y = midY;
    const beat = Math.sin(t);
    const sharpBeat = Math.pow(Math.abs(beat), 0.6) * Math.sign(beat);
    y -= sharpBeat * amplitude * 0.5;

    // Add secondary harmonic for ECG-like shape
    const harmonic = Math.sin(t * 2.5 + 0.8) * amplitude * 0.2;
    y -= harmonic;

    // Add spike events (golden bursts)
    for (const spike of spikes) {
      const dist = Math.abs(x / width - spike.pos);
      if (dist < 0.08) {
        const spikeAmt = spike.height * Math.exp(-dist * spike.decay) * (1 - dist / 0.08);
        y -= spikeAmt;
      }
    }

    y = Math.max(4, Math.min(height - 4, y));

    if (i === 0) {
      points.push(`M ${x.toFixed(1)} ${y.toFixed(1)}`);
    } else {
      points.push(`L ${x.toFixed(1)} ${y.toFixed(1)}`);
    }
  }

  return points.join(' ');
}

export default function PowerPulse({
  momentum,
  healthScore,
  riskScore,
  themCount,
  youCount,
  threadLength,
  strategyMomentum,
  strategyEnergy,
  isLight = false,
}: PowerPulseProps) {
  const [phase, setPhase] = useState(0);
  const [events, setEvents] = useState<PulseEvent[]>([]);
  const [tooltip, setTooltip] = useState<string | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const prevThreadLength = useRef(threadLength);
  const animRef = useRef<number>(0);
  const lastFrameTime = useRef(Date.now());

  // Detect new messages and create spike events
  useEffect(() => {
    if (threadLength > prevThreadLength.current) {
      const diff = threadLength - prevThreadLength.current;
      // Determine if last message was from them or you
      const isThemReply = themCount > youCount;
      const newEvent: PulseEvent = {
        type: isThemReply ? 'them_replied' : 'you_sent',
        timestamp: Date.now(),
      };
      setEvents(prev => [...prev.slice(-8), newEvent]);

      // Tooltip
      const balanceShift = Math.abs(themCount - youCount) * 6;
      if (isThemReply) {
        setTooltip(`They replied — momentum shifted ${balanceShift}% in your favor`);
      } else {
        setTooltip(`You sent — ${healthScore > 70 ? 'strong position' : 'hold the frame'}`);
      }
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 3000);
    }
    prevThreadLength.current = threadLength;
  }, [threadLength, themCount, youCount, healthScore]);

  // Animation loop
  useEffect(() => {
    const animate = () => {
      const now = Date.now();
      const dt = (now - lastFrameTime.current) / 1000;
      lastFrameTime.current = now;

      // Speed based on volatility: higher risk = faster pulse
      const baseSpeed = 0.8;
      const riskMultiplier = 0.5 + (riskScore / 100) * 1.5;
      const speed = baseSpeed * riskMultiplier;

      setPhase(prev => prev + dt * speed * Math.PI * 2);
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [riskScore]);

  // Color based on conversation energy
  const colors = useMemo(() => {
    const energy = (strategyEnergy || '').toLowerCase();
    const mom = (strategyMomentum || momentum || '').toLowerCase();

    // Flirty/playful = hot pink-red
    if (energy.includes('flirt') || energy.includes('playful')) {
      return { stroke: '#f43f5e', glow: 'rgba(244,63,94,0.3)', gradient: ['#fb7185', '#f43f5e', '#e11d48'] };
    }
    // Pulling away / cold = cool blue
    if (energy.includes('pull') || energy.includes('cold') || energy.includes('distant')) {
      return { stroke: '#3b82f6', glow: 'rgba(59,130,246,0.3)', gradient: ['#93c5fd', '#3b82f6', '#1d4ed8'] };
    }
    // Rising momentum = emerald
    if (mom.includes('rising') || mom.includes('theirs')) {
      return { stroke: '#10b981', glow: 'rgba(16,185,129,0.3)', gradient: ['#6ee7b7', '#10b981', '#059669'] };
    }
    // Declining = amber-red
    if (mom.includes('declining') || mom.includes('stalling')) {
      return { stroke: '#f59e0b', glow: 'rgba(245,158,11,0.3)', gradient: ['#fcd34d', '#f59e0b', '#d97706'] };
    }
    // Balanced / neutral = violet
    return { stroke: '#8b5cf6', glow: 'rgba(139,92,246,0.3)', gradient: ['#c4b5fd', '#8b5cf6', '#7c3aed'] };
  }, [strategyEnergy, strategyMomentum, momentum]);

  // Amplitude based on health score (higher health = bigger amplitude)
  const amplitude = 8 + (healthScore / 100) * 22;

  // Frequency based on thread activity
  const frequency = 1.5 + Math.min(threadLength, 20) * 0.1;

  // Spikes from recent events
  const spikes = useMemo(() => {
    const now = Date.now();
    return events
      .filter(e => now - e.timestamp < 10000) // Only last 10 seconds
      .map((e, i) => {
        const age = (now - e.timestamp) / 10000; // 0-1 decay
        const isThem = e.type === 'them_replied';
        return {
          pos: 0.3 + (i * 0.1) + Math.random() * 0.2,
          height: (isThem ? 28 : 18) * (1 - age * 0.7),
          decay: 40 + age * 30,
        };
      });
  }, [events, phase]); // phase dependency keeps spikes animating

  const WIDTH = 600;
  const HEIGHT = 56;
  const path = generatePulsePath(WIDTH, HEIGHT, amplitude, frequency, phase, spikes);

  // Has there been a golden spike recently?
  const hasGoldenSpike = events.some(e => Date.now() - e.timestamp < 2000 && e.type === 'you_sent' && healthScore > 65);
  const hasExplosion = events.some(e => Date.now() - e.timestamp < 2000 && e.type === 'them_replied');

  const activeStroke = hasGoldenSpike ? '#fbbf24' : colors.stroke;
  const activeGlow = hasGoldenSpike ? 'rgba(251,191,36,0.5)' : hasExplosion ? 'rgba(16,185,129,0.5)' : colors.glow;

  if (threadLength === 0) return null;

  return (
    <div className="relative mb-4">
      <div className={`rounded-2xl overflow-hidden border backdrop-blur-sm ${
        isLight
          ? 'bg-white/60 border-gray-200/50'
          : 'bg-white/[0.03] border-white/[0.08]'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <div className="flex items-center gap-2">
            <motion.div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: activeStroke }}
              animate={{
                scale: [1, 1.4, 1],
                opacity: [0.8, 1, 0.8],
              }}
              transition={{
                duration: 1 + (1 - riskScore / 100),
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${isLight ? 'text-gray-400' : 'text-white/35'}`}>
              Power Pulse
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${
              momentum === 'theirs'
                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                : momentum === 'yours'
                ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                : 'text-violet-400 bg-violet-500/10 border-violet-500/20'
            }`}>
              {momentum === 'theirs' ? '↗ They\u2019re chasing' : momentum === 'yours' ? '↘ You\u2019re chasing' : '⟷ Balanced'}
            </span>
            <span className={`text-[10px] font-bold ${isLight ? 'text-gray-400' : 'text-white/30'}`}>
              {healthScore}/100
            </span>
          </div>
        </div>

        {/* SVG Pulse */}
        <div className="relative px-2 pb-2">
          <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            className="w-full"
            style={{ height: '56px' }}
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="pulseGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={colors.gradient[0]} stopOpacity="0.6" />
                <stop offset="50%" stopColor={colors.gradient[1]} stopOpacity="1" />
                <stop offset="100%" stopColor={colors.gradient[2]} stopOpacity="0.6" />
              </linearGradient>
              <filter id="pulseGlow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              {hasGoldenSpike && (
                <linearGradient id="goldenGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.6" />
                  <stop offset="50%" stopColor="#f59e0b" stopOpacity="1" />
                  <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.6" />
                </linearGradient>
              )}
            </defs>

            {/* Glow layer */}
            <path
              d={path}
              fill="none"
              stroke={activeGlow}
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.4"
              filter="url(#pulseGlow)"
            />

            {/* Main line */}
            <path
              d={path}
              fill="none"
              stroke={hasGoldenSpike ? 'url(#goldenGrad)' : 'url(#pulseGrad)'}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Dot at the leading edge */}
            <circle
              cx={WIDTH}
              cy={parseFloat(path.split(' ').slice(-1)[0]) || HEIGHT / 2}
              r="4"
              fill={activeStroke}
              opacity="0.9"
            >
              <animate attributeName="r" values="3;5;3" dur="1s" repeatCount="indefinite" />
            </circle>
          </svg>

          {/* Explosion particles for "them replied" */}
          <AnimatePresence>
            {hasExplosion && (
              <>
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={`particle-${i}`}
                    className="absolute w-1.5 h-1.5 rounded-full"
                    style={{
                      backgroundColor: colors.gradient[1],
                      left: '50%',
                      top: '50%',
                    }}
                    initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                    animate={{
                      scale: [0, 1.5, 0],
                      x: Math.cos((i / 6) * Math.PI * 2) * 30,
                      y: Math.sin((i / 6) * Math.PI * 2) * 20,
                      opacity: [1, 0.8, 0],
                    }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                ))}
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && tooltip && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className={`absolute -bottom-9 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap z-10 ${
              isLight
                ? 'bg-gray-800 text-white shadow-lg'
                : 'bg-white/10 text-white/80 border border-white/10 backdrop-blur-md'
            }`}
          >
            {tooltip}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
