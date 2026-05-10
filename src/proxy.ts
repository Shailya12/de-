import { NextResponse, type NextRequest } from 'next/server'

// Middleware runs on the Edge — Firebase SDK can't run here.
// We use a simple cookie set by the client after successful login.
// The cookie is named `checkin_auth` and holds the user's role.
// The AuthContext sets/clears this cookie on login/logout.

const PUBLIC_PATHS = ['/login', '/privacy', '/terms', '/']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (PUBLIC_PATHS.includes(pathname)) return NextResponse.next()

  const authCookie = request.cookies.get('checkin_auth')

  if (!authCookie) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const role = authCookie.value // 'admin' | 'security'

  if (pathname.startsWith('/admin') && role !== 'admin') {
    return NextResponse.redirect(new URL('/checkin', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons).*)'],
}
