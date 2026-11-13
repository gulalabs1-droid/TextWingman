'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Sparkles, MessageCircle, Clock, Trash2, Loader2, Search } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { createClient } from '@/lib/supabase/client';
import AppNav from '@/components/AppNav';

const supabase = createClient();

type SavedThread = {
  id: string;
  name: string;
  type: string;
  context: string | null;
  updated_at: string;
  message_count: number;
  last_message: any;
};

type HistoryItem = {
  id: string;
  their_message: string;
  generated_replies: { tone: string; text: string }[];
  created_at: string;
};

export default function HistoryPage() {
  const [threads, setThreads] = useState<SavedThread[]>([]);
  const [replyHistory, setReplyHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'sessions' | 'replies'>('all');
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    setError(false);
    try {
      const [threadsRes, userRes] = await Promise.all([
        fetch('/api/threads'),
        supabase.auth.getUser(),
      ]);

      if (threadsRes.ok) {
        const data = await threadsRes.json();
        setThreads(data.threads || []);
      } else {
        setError(true);
      }

      if (userRes.data.user) {
        const { data } = await supabase
          .from('reply_history')
          .select('*')
          .eq('user_id', userRes.data.user.id)
          .order('created_at', { ascending: false })
          .limit(50);
        setReplyHistory(data || []);
      }
    } catch {
      setError(true);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      const res = await fetch(`/api/threads?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setThreads(prev => prev.filter(t => t.id !== id));
        toast({ title: '✓ Deleted' });
      }
    } catch {
      toast({ title: 'Failed to delete', variant: 'destructive' });
    }
    setDeleting(null);
  };

  const filteredThreads = filter === 'replies' ? [] : threads;

  const showReplies = filter === 'all' || filter === 'replies';

  const searchLower = search.toLowerCase();
  const matches = (...values: unknown[]) => values.some(value => typeof value === 'string' && value.toLowerCase().includes(searchLower));
  const replyTexts = (item: HistoryItem): string[] => {
    try {
      const raw: unknown = item.generated_replies;
      const list = typeof raw === 'string' ? JSON.parse(raw) : raw;
      return Array.isArray(list) ? list.map(reply => reply?.text) : [];
    } catch {
      return [];
    }
  };
  const searchedThreads = searchLower
    ? filteredThreads.filter(t => matches(t.name, t.last_message?.content, t.last_message?.text))
    : filteredThreads;
  const searchedReplies = searchLower
    ? replyHistory.filter(r => matches(r.their_message, ...replyTexts(r)))
    : replyHistory;

  const copyReply = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: '✓ Copied' });
    } catch {
      toast({ title: 'Could not copy', variant: 'destructive' });
    }
  };

  const totalCount = threads.length + replyHistory.length;

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="max-w-lg mx-auto px-4 py-6 pb-24">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/app" aria-label="Back to Coach" className="w-11 h-11 rounded-2xl bg-white/[0.06] border border-white/[0.10] flex items-center justify-center text-white/60 hover:text-white/80 hover:bg-white/[0.10] transition-all active:scale-95">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white">History</h1>
            <p className="text-[11px] text-white/55">{totalCount} session{totalCount !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/50" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search names, messages and replies"
            type="search"
            enterKeyHint="search"
            aria-label="Search history"
            className="w-full h-12 pl-10 pr-4 rounded-xl bg-white/[0.05] border border-white/[0.10] text-white/85 placeholder-white/40 text-base md:text-sm focus:outline-none focus:border-violet-500/40 transition-all"
          />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1">
          {([
            { key: 'all' as const, label: 'All' },
            { key: 'sessions' as const, label: 'Sessions' },
            { key: 'replies' as const, label: 'Quick Replies' },
          ]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`min-h-10 px-4 rounded-xl text-[13px] font-bold transition-all shrink-0 active:scale-95 ${
                filter === tab.key
                  ? 'bg-violet-500/15 border border-violet-500/25 text-violet-300'
                  : 'bg-white/[0.04] border border-white/[0.08] text-white/60 hover:text-white/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-violet-400/50" />
          </div>
        ) : error ? (
          <div className="text-center py-16 space-y-4">
            <p className="text-white/50 text-sm font-semibold">Failed to load history</p>
            <button onClick={fetchAll} className="px-5 py-2.5 rounded-xl bg-white/[0.08] border border-white/[0.12] text-white/60 text-sm font-bold hover:bg-white/[0.14] transition-all">
              Retry
            </button>
          </div>
        ) : totalCount === 0 ? (
          <div className="text-center py-16 space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-white/[0.05] flex items-center justify-center">
              <MessageCircle className="h-7 w-7 text-white/40" />
            </div>
            <div>
              <p className="text-white/50 text-sm font-semibold">No history yet</p>
              <p className="text-white/50 text-xs mt-1">Start a coach session and it&apos;ll appear here</p>
            </div>
            <Link href="/app" className="inline-block px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-bold hover:opacity-90 transition-all">
              Start a session
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Saved sessions (coach + thread) */}
            {searchedThreads.map(t => {
              const isCoach = t.type === 'coach';
              const lastMsg = t.last_message;
              const preview = lastMsg?.content || lastMsg?.text || null;
              const timeAgo = getTimeAgo(t.updated_at);

              return (
                <div
                  key={t.id}
                  className="rounded-2xl border border-white/[0.08] hover:border-white/[0.14] bg-white/[0.03] hover:bg-white/[0.05] transition-all group"
                >
                  <button
                    onClick={() => router.push(`/app?load=${t.id}`)}
                    className="w-full text-left p-4 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 bg-violet-500/20">
                        <Sparkles className="h-3 w-3 text-violet-400" />
                      </div>
                      <span className="text-white/45 text-[11px] ml-auto flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {timeAgo}
                      </span>
                    </div>
                    <p className="text-white/80 text-sm font-semibold truncate">{t.name}</p>
                    {preview && <p className="text-white/60 text-xs truncate">{preview}</p>}
                    <p className="text-white/45 text-[11px]">{t.message_count} message{t.message_count !== 1 ? 's' : ''}</p>
                  </button>
                  <div className="flex items-center justify-end px-4 pb-3 -mt-1">
                    <button
                      onClick={() => handleDelete(t.id)}
                      disabled={deleting === t.id}
                      aria-label={`Delete ${t.name}`}
                      className="flex h-11 w-11 items-center justify-center rounded-xl hover:bg-red-500/15 text-white/50 hover:text-red-400 transition-all active:scale-95"
                    >
                      {deleting === t.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Quick reply history */}
            {showReplies && searchedReplies.length > 0 && (
              <>
                {searchedThreads.length > 0 && (
                  <p className="text-white/40 text-[10px] font-mono font-bold tracking-[0.3em] px-1 pt-3">QUICK REPLIES</p>
                )}
                {searchedReplies.map((item) => {
                  let parsedReplies: Array<{ tone: string; text: string }> = [];
                  try {
                    const r = item.generated_replies;
                    parsedReplies = typeof r === 'string' ? JSON.parse(r) : Array.isArray(r) ? r : [];
                  } catch { parsedReplies = []; }

                  return (
                    <div key={item.id} className="rounded-2xl border border-white/[0.08] p-4 space-y-2.5 bg-white/[0.03]">
                      <p className="text-white/50 text-xs font-medium bg-white/[0.05] px-3 py-2 rounded-xl truncate">
                        &quot;{item.their_message}&quot;
                      </p>
                      <div className="space-y-1.5">
                        {parsedReplies.slice(0, 3).map((reply, idx) => (
                          <button key={idx} onClick={() => void copyReply(reply.text)} aria-label={`Copy ${reply.tone} reply`} className="flex min-h-11 w-full items-center gap-2 rounded-lg px-1 py-2 text-left hover:bg-white/[0.05] active:scale-[0.99]">
                            <span className="text-[10px] font-black text-violet-400/70 uppercase shrink-0 w-12">{reply.tone}</span>
                            <p className="text-white/75 text-[13px] leading-relaxed">{reply.text}</p>
                          </button>
                        ))}
                      </div>
                      <p className="text-white/45 text-[11px] font-mono">{getTimeAgo(item.created_at)}</p>
                    </div>
                  );
                })}
              </>
            )}

            {searchedThreads.length === 0 && (!showReplies || searchedReplies.length === 0) && (
              <div className="text-center py-12">
                <p className="text-white/55 text-sm">No results for &quot;{search}&quot;</p>
              </div>
            )}
          </div>
        )}
      </div>
      <AppNav />
    </div>
  );
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}
