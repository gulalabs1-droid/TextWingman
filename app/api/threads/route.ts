import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createClient as createServerClient } from '@/lib/supabase/server';

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getUser() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// GET: List saved threads for current user
export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await adminSupabase
      .from('saved_threads')
      .select('id, name, context, platform, updated_at, messages')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    // Return threads with message count (don't send full messages in list)
    const threads = (data || []).map(t => ({
      id: t.id,
      name: t.name,
      context: t.context,
      platform: t.platform,
      updated_at: t.updated_at,
      message_count: Array.isArray(t.messages) ? t.messages.length : 0,
      last_message: Array.isArray(t.messages) && t.messages.length > 0 
        ? t.messages[t.messages.length - 1] 
        : null,
    }));

    return NextResponse.json({ threads });
  } catch (error) {
    console.error('Get threads error:', error);
    return NextResponse.json({ error: 'Failed to fetch threads' }, { status: 500 });
  }
}

// POST: Create or update a saved thread
export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, name, messages, context, platform } = await request.json();

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Thread name is required' }, { status: 400 });
    }

    // Update existing thread
    if (id) {
      const { data, error } = await adminSupabase
        .from('saved_threads')
        .update({
          name,
          messages: messages || [],
          context: context || null,
          platform: platform || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ thread: data });
    }

    // Create new thread
    const { data, error } = await adminSupabase
      .from('saved_threads')
      .insert({
        user_id: user.id,
        name,
        messages: messages || [],
        context: context || null,
        platform: platform || null,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ thread: data });
  } catch (error) {
    console.error('Save thread error:', error);
    return NextResponse.json({ error: 'Failed to save thread' }, { status: 500 });
  }
}

// DELETE: Delete a saved thread
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Thread ID is required' }, { status: 400 });
    }

    const { error } = await adminSupabase
      .from('saved_threads')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete thread error:', error);
    return NextResponse.json({ error: 'Failed to delete thread' }, { status: 500 });
  }
}
