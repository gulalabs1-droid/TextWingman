import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

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

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // If not logged in and trying to access protected routes, redirect to /login
  if (!user && (pathname.startsWith('/dashboard') || pathname === '/onboarding')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // If logged in, check onboarding status
  if (user) {
    // Fetch profile to check onboarding status
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single()

    // If on login page, redirect based on onboarding status
    // BUT preserve redirect/plan query params (for checkout flow)
    if (pathname === '/login') {
      const redirectParam = request.nextUrl.searchParams.get('redirect')
      if (redirectParam) {
        // User came from pricing/checkout — send them where they wanted to go
        const url = request.nextUrl.clone()
        url.pathname = redirectParam
        url.search = '' // clear query params after consuming
        return NextResponse.redirect(url)
      }
      const url = request.nextUrl.clone()
      url.pathname = profile?.onboarding_completed ? '/dashboard' : '/onboarding'
      return NextResponse.redirect(url)
    }

    // If trying to access dashboard but onboarding not complete, redirect to onboarding
    if (pathname.startsWith('/dashboard') && !profile?.onboarding_completed) {
      const url = request.nextUrl.clone()
      url.pathname = '/onboarding'
      return NextResponse.redirect(url)
    }

    // If on onboarding but already completed, redirect to dashboard
    if (pathname === '/onboarding' && profile?.onboarding_completed) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
