import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

type StyleSignals = {
  word_count?: number;
  question_count?: number;
  exclamation_count?: number;
  emoji_count?: number;
  lowercase_ratio?: number;
};

type OutcomeRow = {
  event_type: string;
  tone: string | null;
  style_signals: StyleSignals | null;
};

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function GET() {
  try {
    const serverSupabase = await createServerClient();
    const { data: { user } } = await serverSupabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
    }

    // Get tone preferences from copy_logs
    const [{ data: copyLogs }, { data: outcomes }] = await Promise.all([
      supabase
        .from('copy_logs')
        .select('tone')
        .eq('user_id', user.id),
      supabase
        .from('reply_outcomes')
        .select('event_type, tone, style_signals')
        .eq('user_id', user.id)
        .in('event_type', ['copied', 'edited', 'sent_confirmed'])
        .order('created_at', { ascending: false })
        .limit(200),
    ]);

    const learningRows = (outcomes || []) as OutcomeRow[];

    // Calculate favorite tone
    let favoriteTone = null;
    let totalCopies = 0;
    if (learningRows.length > 0 || (copyLogs && copyLogs.length > 0)) {
      totalCopies = learningRows.length || copyLogs?.length || 0;
      const toneCounts: Record<string, number> = {};
      const toneRows = learningRows.length ? learningRows : (copyLogs || []).map(log => ({ tone: log.tone }));
      toneRows.forEach(log => {
        if (log.tone) {
          toneCounts[log.tone] = (toneCounts[log.tone] || 0) + 1;
        }
      });
      
      // Find the most common tone
      let maxCount = 0;
      for (const [tone, count] of Object.entries(toneCounts)) {
        if (count > maxCount) {
          maxCount = count;
          favoriteTone = tone;
        }
      }
    }

    // Only learn style from replies the user copied, edited, or confirmed sent.
    // Generated candidates are not evidence of the user's voice.
    const signals = learningRows
      .map(row => row.style_signals || {})
      .filter(row => typeof row.word_count === 'number');
    const signalCount = signals.length;
    const average = (key: keyof StyleSignals) => signalCount
      ? Math.round((signals.reduce((sum, row) => sum + Number(row[key] || 0), 0) / signalCount) * 10) / 10
      : 0;
    const rate = (predicate: (row: StyleSignals) => boolean) => signalCount
      ? Math.round((signals.filter(predicate).length / signalCount) * 100)
      : 0;

    // Format the tone name nicely
    const toneLabels: Record<string, string> = {
      shorter: 'Shorter',
      spicier: 'Spicier',
      softer: 'Softer',
    };

    return NextResponse.json({
      favoriteTone: favoriteTone ? toneLabels[favoriteTone] || favoriteTone : null,
      avgWordCount: average('word_count'),
      totalCopies,
      hasData: totalCopies >= 3,
      styleDna: {
        sampleCount: signalCount,
        confidence: Math.min(100, signalCount * 20),
        averageWordCount: average('word_count'),
        questionRate: rate(row => Number(row.question_count || 0) > 0),
        exclamationRate: rate(row => Number(row.exclamation_count || 0) > 0),
        emojiRate: rate(row => Number(row.emoji_count || 0) > 0),
        lowercaseRate: Math.round(average('lowercase_ratio') * 100),
      },
    });
  } catch (error) {
    console.error('Style stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
