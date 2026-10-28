import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { sessionRedirect } from '@/lib/session-redirect'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  function redirectWithSession(path: string) {
    return sessionRedirect(request.url, path, supabaseResponse)
  }

  const { pathname: earlyPath } = request.nextUrl

  // Fast-path: /app and /api/track don't need any auth gating in middleware.
  // Client-side and API routes handle their own auth. Skipping the Supabase
  // roundtrip here prevents MIDDLEWARE_INVOCATION_TIMEOUT (504) when Supabase
  // auth is momentarily slow.
  if (earlyPath.startsWith('/app') || earlyPath === '/api/track') {
    return supabaseResponse
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Guard against Supabase hangs — never let auth block the request > 4s.
  // If it times out, we treat the user as logged out (safe default) and let
  // the destination page/API do its own auth check.
  const authPromise = supabase.auth.getUser().then((r) => r.data.user).catch(() => null)
  const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000))
  const user = await Promise.race([authPromise, timeoutPromise])

  const { pathname } = request.nextUrl

  // If not logged in and trying to access protected routes, redirect to /login
  if (!user && (pathname.startsWith('/dashboard') || pathname === '/onboarding')) {
    return redirectWithSession('/login')
  }

  // If logged in, check onboarding status — but ONLY on routes that branch on it.
  // Skipping this avoids an extra profiles DB roundtrip on every /app load and
  // every /api/track beacon, which the session-refresh matcher also covers.
  const needsOnboardingCheck =
    pathname === '/login' ||
    pathname === '/onboarding' ||
    pathname.startsWith('/dashboard')

  if (user && needsOnboardingCheck) {
    // Fetch profile to check onboarding status (timeout-guarded)
    type ProfileRow = { onboarding_completed: boolean } | null
    const profilePromise: Promise<ProfileRow> = (async () => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', user.id)
          .single()
        return data as ProfileRow
      } catch {
        return null
      }
    })()
    const profileTimeout = new Promise<ProfileRow>((resolve) => setTimeout(() => resolve(null), 3000))
    const profile = await Promise.race([profilePromise, profileTimeout])

    // If on login page, redirect based on onboarding status
    // BUT preserve redirect/plan query params (for checkout flow)
    if (pathname === '/login') {
      const redirectParam = request.nextUrl.searchParams.get('redirect')
      if (redirectParam) {
        // User came from pricing/checkout — send them where they wanted to go
        return redirectWithSession(redirectParam)
      }
      return redirectWithSession(profile?.onboarding_completed ? '/dashboard' : '/onboarding')
    }

    // If trying to access dashboard but onboarding not complete, redirect to onboarding
    if (pathname.startsWith('/dashboard') && !profile?.onboarding_completed) {
      return redirectWithSession('/onboarding')
    }

    // If on onboarding but already completed, redirect to dashboard
    if (pathname === '/onboarding' && profile?.onboarding_completed) {
      return redirectWithSession('/dashboard')
    }
  }

  return supabaseResponse
}
