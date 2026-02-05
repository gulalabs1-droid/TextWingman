import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

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
    const { data: copyLogs } = await supabase
      .from('copy_logs')
      .select('tone')
      .eq('user_id', user.id);

    // Get reply history for word count calculation
    const { data: replyHistory } = await supabase
      .from('reply_history')
      .select('generated_replies')
      .eq('user_id', user.id)
      .limit(50);

    // Calculate favorite tone
    let favoriteTone = null;
    let totalCopies = 0;
    if (copyLogs && copyLogs.length > 0) {
      totalCopies = copyLogs.length;
      const toneCounts: Record<string, number> = {};
      copyLogs.forEach(log => {
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

    // Calculate average word count from copied replies
    let avgWordCount = 0;
    if (replyHistory && replyHistory.length > 0) {
      let totalWords = 0;
      let replyCount = 0;
      
      replyHistory.forEach(entry => {
        try {
          const replies = typeof entry.generated_replies === 'string' 
            ? JSON.parse(entry.generated_replies) 
            : entry.generated_replies;
          
          if (Array.isArray(replies)) {
            replies.forEach((reply: { text?: string }) => {
              if (reply.text) {
                totalWords += reply.text.split(/\s+/).filter(Boolean).length;
                replyCount++;
              }
            });
          }
        } catch {
          // Skip malformed entries
        }
      });
      
      if (replyCount > 0) {
        avgWordCount = Math.round(totalWords / replyCount);
      }
    }

    // Format the tone name nicely
    const toneLabels: Record<string, string> = {
      shorter: 'Shorter',
      spicier: 'Spicier',
      softer: 'Softer',
    };

    return NextResponse.json({
      favoriteTone: favoriteTone ? toneLabels[favoriteTone] || favoriteTone : null,
      avgWordCount,
      totalCopies,
      hasData: totalCopies >= 3, // Only show if user has enough data
    });
  } catch (error) {
    console.error('Style stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
