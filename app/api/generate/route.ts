import { NextRequest, NextResponse } from 'next/server';
import { generateReplies, generateRepliesWithAgent } from '@/lib/openai';
import { supabase } from '@/lib/supabase';

const FREE_USAGE_LIMIT = parseInt(process.env.FREE_USAGE_LIMIT || '5');

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // IP-based rate limiting for free tier
    // TODO: Add user authentication for personalized limits
    const ip = request.headers.get('x-forwarded-for') || 'anonymous';
    
    // Check usage count if Supabase is configured
    if (supabase) {
      const today = new Date().toISOString().split('T')[0];
      const { data: usageLogs, error: fetchError } = await supabase
        .from('usage_logs')
        .select('*')
        .eq('user_ip', ip)
        .gte('created_at', today);

      if (fetchError) {
        console.error('Supabase error:', fetchError);
      }

      // Check if free tier limit reached
      if (usageLogs && usageLogs.length >= FREE_USAGE_LIMIT) {
        return NextResponse.json(
          { 
            error: 'Usage limit reached',
            message: `You've reached your daily limit of ${FREE_USAGE_LIMIT} free replies. Upgrade to continue!`,
          },
          { status: 429 }
        );
      }
    }

    // Generate replies using OpenAI
    const replies = process.env.TEXT_WINGMAN_AGENT_ID
      ? await generateRepliesWithAgent(message)
      : await generateReplies(message);

    return NextResponse.json({ replies });
  } catch (error) {
    console.error('Error in generate API:', error);
    return NextResponse.json(
      { error: 'Failed to generate replies' },
      { status: 500 }
    );
  }
}
