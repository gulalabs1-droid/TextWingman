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

    // TODO: Add authentication and check user subscription status
    // For now, we'll use a simple IP-based rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'anonymous';
    
    // Check usage count (simplified - in production, use proper auth)
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

    // Generate replies using OpenAI
    const replies = process.env.TEXT_WINGMAN_AGENT_ID
      ? await generateRepliesWithAgent(message)
      : await generateReplies(message);

    // Log usage
    const { error: logError } = await supabase
      .from('usage_logs')
      .insert({
        user_ip: ip,
        message: message.substring(0, 500), // Limit stored message length
        created_at: new Date().toISOString(),
      });

    if (logError) {
      console.error('Failed to log usage:', logError);
    }

    return NextResponse.json({ replies });
  } catch (error) {
    console.error('Error in generate API:', error);
    return NextResponse.json(
      { error: 'Failed to generate replies' },
      { status: 500 }
    );
  }
}
