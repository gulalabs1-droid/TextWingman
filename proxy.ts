import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/onboarding', '/admin/:path*', '/admin2/:path*', '/api/admin2/:path*', '/api/track', '/app/:path*'],
}
