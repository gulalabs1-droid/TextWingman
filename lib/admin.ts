import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { isAdminEmail } from '@/lib/isAdmin';

export function getAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function requireAdmin() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !isAdminEmail(user.email)) {
    return { user: null, isAdmin: false };
  }

  return { user, isAdmin: true };
}

export function logAdminEvent(
  adminUserId: string,
  eventType: string,
  targetUserId?: string,
  payload?: Record<string, unknown>
) {
  const db = getAdminSupabase();
  const event = {
    admin_user_id: adminUserId,
    action: eventType,
    target_user_id: targetUserId || null,
    metadata: payload || {},
  };

  // Older installs used event_type/payload. Prefer the canonical schema, but
  // keep admin auditing alive while an existing database is being migrated.
  return db.from('admin_events').insert(event).then(result => {
    if (!result.error) return result;
    return db.from('admin_events').insert({
      admin_user_id: adminUserId,
      event_type: eventType,
      target_user_id: targetUserId || null,
      payload: payload || {},
    });
  });
}
