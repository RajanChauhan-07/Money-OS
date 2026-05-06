import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Refresh the session — important for keeping auth alive
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Protected app routes — require authentication
  const protectedPrefixes = [
    '/dashboard',
    '/plan',
    '/tax',
    '/invest',
    '/tracker',
    '/history',
    '/reports',
    '/notifications',
    '/settings',
    '/support',
  ]

  const isProtectedRoute = protectedPrefixes.some((prefix) =>
    pathname.startsWith(prefix)
  )

  // Auth routes — redirect to dashboard if already logged in
  const authRoutes = ['/signup', '/login', '/otp', '/welcome']
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))

  // Bypass authentication checks for now
  // if (isProtectedRoute && !user) {
  //   return NextResponse.redirect(new URL('/signup', request.url))
  // }

  // if (isAuthRoute && user) {
  //   return NextResponse.redirect(new URL('/dashboard', request.url))
  // }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/auth/otp (OTP endpoints — must be public)
     * - Public assets
     */
    '/((?!_next/static|_next/image|favicon.ico|api/auth/otp|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
