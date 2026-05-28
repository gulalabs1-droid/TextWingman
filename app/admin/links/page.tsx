'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link2, Copy, Check, Plus, Trash2, Download, RotateCcw } from 'lucide-react';

// Platform presets — each sets utm_source + a sensible utm_medium.
const PLATFORMS = [
  { id: 'tiktok', label: 'TikTok', emoji: '🎵', medium: 'social' },
  { id: 'instagram', label: 'Instagram', emoji: '📸', medium: 'social' },
  { id: 'youtube', label: 'YouTube', emoji: '▶️', medium: 'social' },
  { id: 'reddit', label: 'Reddit', emoji: '👽', medium: 'social' },
  { id: 'x', label: 'X / Twitter', emoji: '✖️', medium: 'social' },
  { id: 'snapchat', label: 'Snapchat', emoji: '👻', medium: 'social' },
] as const;

// Destination pages — /tiktok is the optimized social landing flow.
const DESTINATIONS = [
  { path: '/tiktok', label: '/tiktok — social landing (recommended)' },
  { path: '/app', label: '/app — straight into the Coach' },
  { path: '/', label: '/ — home page' },
];

type BatchLink = { id: string; url: string; label: string };

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);

export default function LinkGeneratorPage() {
  const [baseUrl, setBaseUrl] = useState('');
  const [platform, setPlatform] = useState<string>('tiktok');
  const [destination, setDestination] = useState('/tiktok');
  const [campaign, setCampaign] = useState('');
  const [hook, setHook] = useState('');
  const [videoNum, setVideoNum] = useState(1);
  const [copied, setCopied] = useState(false);
  const [batch, setBatch] = useState<BatchLink[]>([]);

  // Derive default base URL from env (production) or current origin.
  useEffect(() => {
    const fromEnv = process.env.NEXT_PUBLIC_APP_URL;
    setBaseUrl((fromEnv && !fromEnv.includes('localhost') ? fromEnv : window.location.origin).replace(/\/$/, ''));
    try {
      const savedNum = localStorage.getItem('tw_link_video_num');
      if (savedNum) setVideoNum(parseInt(savedNum, 10) || 1);
      const savedBatch = localStorage.getItem('tw_link_batch');
      if (savedBatch) setBatch(JSON.parse(savedBatch));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    try { localStorage.setItem('tw_link_video_num', String(videoNum)); } catch { /* ignore */ }
  }, [videoNum]);
  useEffect(() => {
    try { localStorage.setItem('tw_link_batch', JSON.stringify(batch)); } catch { /* ignore */ }
  }, [batch]);

  const plat = PLATFORMS.find(p => p.id === platform)!;
  const videoId = `${plat.id}-${String(videoNum).padStart(3, '0')}`;

  const generatedUrl = useMemo(() => {
    if (!baseUrl) return '';
    const params = new URLSearchParams();
    params.set('utm_source', plat.id);
    params.set('utm_medium', plat.medium);
    if (campaign.trim()) params.set('utm_campaign', slugify(campaign));
    if (hook.trim()) params.set('utm_content', slugify(hook));
    params.set('video_id', videoId);
    return `${baseUrl}${destination}?${params.toString()}`;
  }, [baseUrl, plat, campaign, hook, videoId, destination]);

  const copy = async (text: string, markGlobal = false) => {
    await navigator.clipboard.writeText(text);
    if (markGlobal) { setCopied(true); setTimeout(() => setCopied(false), 1500); }
  };

  const addToBatch = () => {
    if (!generatedUrl) return;
    setBatch(prev => [{ id: crypto.randomUUID(), url: generatedUrl, label: videoId }, ...prev]);
    setVideoNum(n => n + 1); // auto-increment for the next clip
  };

  const exportCsv = () => {
    const rows = [['label', 'url'], ...batch.map(b => [b.label, b.url])];
    const csv = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `utm_links_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Link2 className="h-6 w-6 text-purple-400" />
          Campaign Link Generator
        </h1>
        <p className="text-sm text-white/50">
          Tag every video so your Funnel &amp; Live dashboards show exactly which clip drove the visit.
        </p>
      </div>

      <Card className="border border-white/[0.08] bg-white/[0.03]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-white/70">Build a link</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Platform */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-white/40 mb-2 block">Platform</label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map(p => (
                <button
                  key={p.id}
                  onClick={() => setPlatform(p.id)}
                  className={`px-3 py-2 rounded-xl text-sm font-semibold border transition-all active:scale-95 ${
                    platform === p.id
                      ? 'bg-purple-500/20 border-purple-500/40 text-purple-200'
                      : 'bg-white/[0.04] border-white/[0.08] text-white/50 hover:bg-white/[0.08]'
                  }`}
                >
                  <span className="mr-1.5">{p.emoji}</span>{p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Destination */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-white/40 mb-2 block">Destination</label>
            <select
              value={destination}
              onChange={e => setDestination(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/[0.10] text-white text-sm focus:outline-none focus:border-purple-500/40"
            >
              {DESTINATIONS.map(d => (
                <option key={d.path} value={d.path} className="bg-[#0d0d15]">{d.label}</option>
              ))}
            </select>
          </div>

          {/* Campaign + Hook */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-white/40 mb-2 block">
                Campaign <span className="text-white/25 normal-case font-normal">(theme)</span>
              </label>
              <input
                value={campaign}
                onChange={e => setCampaign(e.target.value)}
                placeholder="e.g. left-on-read"
                className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/[0.10] text-white text-sm placeholder-white/25 focus:outline-none focus:border-purple-500/40"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-white/40 mb-2 block">
                Hook variant <span className="text-white/25 normal-case font-normal">(optional)</span>
              </label>
              <input
                value={hook}
                onChange={e => setHook(e.target.value)}
                placeholder="e.g. desperate-text"
                className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/[0.10] text-white text-sm placeholder-white/25 focus:outline-none focus:border-purple-500/40"
              />
            </div>
          </div>

          {/* Video number */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-white/40 mb-2 block">
              Video number <span className="text-white/25 normal-case font-normal">→ video_id: <span className="font-mono text-purple-300/70">{videoId}</span></span>
            </label>
            <div className="flex items-center gap-2">
              <button onClick={() => setVideoNum(n => Math.max(1, n - 1))} className="w-9 h-9 rounded-lg bg-white/[0.05] border border-white/[0.10] text-white/60 hover:bg-white/[0.10]">−</button>
              <input
                type="number"
                min={1}
                value={videoNum}
                onChange={e => setVideoNum(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-20 px-3 py-2 rounded-xl bg-white/[0.05] border border-white/[0.10] text-white text-sm text-center focus:outline-none focus:border-purple-500/40"
              />
              <button onClick={() => setVideoNum(n => n + 1)} className="w-9 h-9 rounded-lg bg-white/[0.05] border border-white/[0.10] text-white/60 hover:bg-white/[0.10]">+</button>
            </div>
          </div>

          {/* Base URL (editable, defaults to prod) */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-white/40 mb-2 block">Base URL</label>
            <input
              value={baseUrl}
              onChange={e => setBaseUrl(e.target.value.replace(/\/$/, ''))}
              className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/[0.10] text-white/70 text-sm font-mono focus:outline-none focus:border-purple-500/40"
            />
          </div>

          {/* Preview */}
          <div className="p-4 rounded-2xl bg-purple-500/[0.06] border border-purple-500/20">
            <p className="text-[10px] font-bold uppercase tracking-wider text-purple-300/60 mb-2">Generated link</p>
            <p className="text-sm text-white/90 font-mono break-all leading-relaxed">{generatedUrl || '—'}</p>
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={() => copy(generatedUrl, true)} className="bg-purple-500/20 border border-purple-500/30 text-purple-200 hover:bg-purple-500/30">
                {copied ? <><Check className="h-3.5 w-3.5 mr-1.5" />Copied</> : <><Copy className="h-3.5 w-3.5 mr-1.5" />Copy</>}
              </Button>
              <Button size="sm" variant="outline" onClick={addToBatch}>
                <Plus className="h-3.5 w-3.5 mr-1.5" />Add &amp; next clip
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Batch */}
      <Card className="border border-white/[0.08] bg-white/[0.03]">
        <CardHeader className="pb-2 flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold text-white/70">
            Batch <span className="text-white/30 font-normal">({batch.length})</span>
          </CardTitle>
          {batch.length > 0 && (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={exportCsv}>
                <Download className="h-3.5 w-3.5 mr-1.5" />CSV
              </Button>
              <Button size="sm" variant="outline" onClick={() => setBatch([])}>
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />Clear
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {batch.length === 0 ? (
            <p className="text-white/30 text-sm text-center py-6">
              No links yet. Build one above and hit <span className="text-white/50 font-medium">Add &amp; next clip</span> to queue a batch before a posting session.
            </p>
          ) : (
            <div className="space-y-1.5">
              {batch.map(b => (
                <div key={b.id} className="flex items-center gap-2 p-2.5 bg-white/[0.04] rounded-lg text-xs">
                  <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded font-mono shrink-0">{b.label}</span>
                  <span className="text-white/50 font-mono truncate flex-1">{b.url}</span>
                  <button onClick={() => copy(b.url)} className="text-white/40 hover:text-white/80 shrink-0" title="Copy"><Copy className="h-3.5 w-3.5" /></button>
                  <button onClick={() => setBatch(prev => prev.filter(x => x.id !== b.id))} className="text-white/30 hover:text-red-400 shrink-0" title="Remove"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
