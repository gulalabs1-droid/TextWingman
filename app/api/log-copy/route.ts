import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    const body = await req.json();
    const { tone, isV2 } = body;
    
    if (!tone) {
      return NextResponse.json({ error: 'Tone required' }, { status: 400 });
    }

    // Log the copy event
    const { error } = await supabase
      .from('copy_logs')
      .insert({
        user_id: user?.id || null,
        tone: tone,
        is_v2: isV2 || false,
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Copy log error:', error);
      // Don't fail the request - this is just analytics
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Log copy error:', error);
    return NextResponse.json({ success: true }); // Don't fail
  }
}
