import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(req) {
  const res = NextResponse.next()
  const { pathname } = req.nextUrl

  console.log('🛡️ Middleware triggered for path:', pathname)

  // Public routes
  const publicRoutes = ['/login', '/signup']
  if (publicRoutes.includes(pathname)) {
    console.log('🔓 Public route, skipping auth check.')
    return res
  }

  // Create Supabase client
  const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    cookies: {
      get(name) {
        return req.cookies.get(name)?.value
      },
      set(name, value, options) {
        // Only set cookies on the response, not request
        res.cookies.set({ name, value, ...options })
      },
      remove(name, options) {
        res.cookies.set({ name, value: '', ...options })
      },
    },
  }
)


  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  console.log('🔐 User from Supabase:', user)
  console.log('⚠️ Auth error (if any):', error)

  const protectedRoutes = ['/dashboard', '/add-block']

  if (!user && protectedRoutes.includes(pathname)) {
    console.log('🚫 No user, redirecting to /login')
    return NextResponse.redirect(new URL('/login', req.url))
  }

  console.log('✅ Auth passed or not required')
  return res
}

// Run for all routes except static files
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
