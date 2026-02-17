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
    version: '3.4.0',
    date: '2026-02-16',
    title: 'Vibe Check & Tone Translator',
    description: 'Two new AI tools: get real-time feedback on your draft before you send it, and instantly rewrite any message in a different energy.',
    type: 'feature',
    highlights: [
      'Vibe Check — as you type, AI analyzes your draft and shows energy level (🟢🟡🔴), a vibe label, score out of 10, and a one-line coaching tip',
      'Tone Translator — wrote your own message? Tap "Rewrite in a different tone" and pick Flirty, Chill, Bold, Witty, Warm, or Pro to instantly transform it',
      'Vibe Check auto-runs 1.5s after you stop typing (8+ characters) — no button needed',
      'Tone Translator preserves your intent and details while changing the energy',
    ],
  },
  {
    version: '3.3.2',
    date: '2026-02-16',
    title: 'V1/V2 Mode Toggle for Pro',
    description: 'Pro users can now switch between V2 Verified (strategy + 3-agent pipeline) and V1 Fast Mode for quicker replies when you just need something fast.',
    type: 'improvement',
    highlights: [
      'V1/V2 toggle — tap the mode badge to switch between V2 Verified and V1 Fast Mode',
      'V2 (default) — full strategy analysis, 3-agent pipeline, ≤18 words enforced, tone-verified',
      'V1 Fast Mode — quick single-call replies with no strategy overhead, ~2x faster',
      'Top status badge updates to reflect your current mode',
    ],
  },
  {
    version: '3.3.1',
    date: '2026-02-16',
    title: 'Custom Context, Smart Thread Update & Speed Boost',
    description: 'Tell the AI about your situation in your own words, update threads by just uploading a new screenshot, and enjoy noticeably faster screenshot processing.',
    type: 'feature',
    highlights: [
      'Custom Context — free-text field to describe your situation (e.g. "talking 2 weeks, she\'s a nurse, went on one date") passed to all AI endpoints',
      'Smart Thread Update — upload a new screenshot when you already have a thread and only new messages get added automatically',
      'Screenshot speed boost — switched to gpt-4o-mini for extraction, smaller image compression, ~2-3x faster uploads',
      'Custom context works across Reply, Revive, Decode, Opener, and Screenshot Briefing modes',
    ],
  },
  {
    version: '3.3.0',
    date: '2026-02-16',
    title: 'Edit + Polish, Regenerate & Smarter Context',
    description: 'Edit any reply inline, add your own ideas, and let AI polish it smooth. Regenerate replies when you want fresh options. Plus a major upgrade to how the AI reads conversation context.',
    type: 'feature',
    highlights: [
      'Edit + Polish — tap Edit on any reply, add your own ideas (like "let\'s grab food"), then hit Polish to have AI smooth it out while keeping your additions',
      'Regenerate Replies — "Generate different replies" button for fresh options without re-entering the conversation',
      'Smarter Context Analysis — AI now detects re-initiation (they came back to you), personal sharing, questions, and growing energy instead of misreading casual style as low effort',
      'Content Engagement — replies now reference specifics from their message instead of giving generic responses',
      'Thread input fix — "Add as their message" and "Add as my message" buttons always visible after deleting a thread message',
      'Use As Is option — save your raw edit without AI polish if you prefer your own wording',
    ],
  },
  {
    version: '3.2.0',
    date: '2026-02-15',
    title: 'Revive Mode, Screenshot Briefing & Energy Matching',
    description: 'New Revive mode for dead conversations, instant Screenshot Briefing with strategy coaching, smarter energy-matching replies, and expanded platform support.',
    type: 'feature',
    highlights: [
      'Revive Mode — re-engage dead/stale conversations with 3 strategic messages (smooth, bold, warm) plus AI analysis of why the convo died',
      'Screenshot Briefing — upload a screenshot in Reply mode and get instant strategy coaching + 3 replies without typing anything',
      'Energy Matching — replies now match the other person\'s effort level. Short messages get short replies, slang gets slang back',
      'Facebook Dating & Messenger support — screenshot extraction now recognizes FB Dating, Messenger, and Snapchat',
      'Screenshot upload in Opener mode — upload a profile screenshot for context before generating openers',
      'Low-effort detection — Strategy Mode now flags stalling conversations and auto-applies no-questions + keep-short constraints',
    ],
  },
  {
    version: '3.0.0',
    date: '2026-02-15',
    title: 'V3 — Conversational Intelligence',
    description: 'The biggest update yet. Text Wingman is no longer just a reply generator — it\'s a full conversational AI companion with strategy coaching.',
    type: 'milestone',
    highlights: [
      'Thread Mode — full back-and-forth conversation loop with "I sent this" and custom replies',
      'StrategyAgent — AI coaching card showing momentum, balance, and recommended move (Pro)',
      'Thread-Aware AI — every reply is generated with full conversation context, not just the last message',
      'Dark glass UI overhaul — adopted across dashboard and app page for a modern, premium feel',
      'Double-text support — add multiple messages from either side without forced alternation',
      'Auto-save threads — conversations sync in the background after 2+ messages',
    ],
  },
  {
    version: '2.5.0',
    date: '2026-02-13',
    title: 'Message Decoder, Opening Lines, Coach Tips & Saved Threads',
    description: 'Four new features: decode what they really mean, generate opening lines, get coaching tips, and save conversation threads.',
    type: 'feature',
    highlights: [
      '"What Do They Mean?" Decoder — analyzes subtext, intent, energy, and red/green flags',
      'Opening Line Generator — first-message mode for dating apps, Instagram DMs, cold texts & more',
      'Coach Tips — tactical advice on how to respond based on conversation dynamics',
      'Saved Threads — name and save conversations, come back for context-aware replies',
    ],
  },
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
