export type ChangelogEntry = {
  version: string;
  date: string;
  title: string;
  description: string;
  type: 'feature' | 'improvement' | 'fix' | 'milestone';
  highlights: string[];
};

// Add new entries at the TOP of this array (newest first)
export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '2.4.0',
    date: '2026-02-12',
    title: 'Screenshot Upload — Full Conversation Extraction',
    description: 'Upload a screenshot of any conversation and our AI reads the entire thread. No more copy-pasting between apps.',
    type: 'feature',
    highlights: [
      'Upload screenshots from iMessage, WhatsApp, Instagram, Tinder & more',
      'AI extracts the full conversation thread with Them/You labels',
      'Detects who said what and identifies the last received message',
      'One-tap from screenshot to generated replies',
    ],
  },
  {
    version: '2.3.1',
    date: '2026-02-12',
    title: 'Mobile UX Overhaul',
    description: 'Major responsiveness pass across every page — optimized for thumb-friendly mobile use.',
    type: 'improvement',
    highlights: [
      'Context grid now 2 columns on small screens',
      'Removed janky hover effects on reply cards for touch devices',
      'Banners stack properly on mobile',
      'Safe bottom padding on all pages',
    ],
  },
  {
    version: '2.3.0',
    date: '2026-02-11',
    title: 'Homepage Refresh',
    description: 'Cleaned up the homepage with honest copy, dynamic copyright, and removed placeholder content.',
    type: 'improvement',
    highlights: [
      'Removed placeholder testimonials',
      'Fixed pricing card contradictions',
      'Dynamic copyright year',
      'New "Screenshot It. We\'ll Read It." feature showcase section',
    ],
  },
  {
    version: '2.2.0',
    date: '2026-02-10',
    title: 'Dashboard Glow-Up',
    description: 'Redesigned dashboard with better stats, recent wins, and a cleaner layout.',
    type: 'improvement',
    highlights: [
      'Total Replies stat card',
      'Recent Wins section with quick view',
      'Renewal CTA near subscription countdown',
      'Compact quick-action CTA',
    ],
  },
  {
    version: '2.1.0',
    date: '2026-02-05',
    title: 'Security Hardening & Admin Dashboard',
    description: 'Deep security audit plus a full admin panel for managing users, billing, and experiments.',
    type: 'milestone',
    highlights: [
      'Fixed critical RLS policies on entitlements table',
      'Server-side auth on all API routes',
      'Full admin dashboard with 7 sections',
      'Feature flags system for gradual rollouts',
    ],
  },
  {
    version: '2.0.0',
    date: '2026-01-20',
    title: 'V2 Launch — 3-Agent Verified Replies',
    description: 'The biggest update yet. Every reply now goes through a 3-agent pipeline: Draft → Rule-Check → Tone-Verify.',
    type: 'milestone',
    highlights: [
      '3-agent pipeline: Draft, Rule-Check, Tone-Verify',
      '≤18 words enforced, no emojis, no needy text',
      'Auto-revise up to 2x before showing results',
      'Confidence scoring on every reply',
    ],
  },
  {
    version: '1.0.0',
    date: '2025-12-01',
    title: 'Text Wingman Launch',
    description: 'The original release. Paste a message, pick a tone, get 3 reply options.',
    type: 'milestone',
    highlights: [
      '3 tone options: Shorter, Spicier, Softer',
      'Context selector for Dating, Friends, Work',
      'Copy to clipboard with one tap',
      'Free tier with daily limits',
    ],
  },
];

export const CURRENT_VERSION = CHANGELOG[0].version;
export const LATEST_UPDATE = CHANGELOG[0];

export const TYPE_CONFIG = {
  feature: { emoji: '🚀', label: 'New Feature', color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/30' },
  improvement: { emoji: '✨', label: 'Improvement', color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/30' },
  fix: { emoji: '🔧', label: 'Bug Fix', color: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/30' },
  milestone: { emoji: '🏆', label: 'Milestone', color: 'text-purple-400', bg: 'bg-purple-500/20', border: 'border-purple-500/30' },
};
