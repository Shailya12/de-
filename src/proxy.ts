import { NextResponse, type NextRequest } from 'next/server'

// Public paths — accessible without auth cookie
const PUBLIC_PATHS = ['/', '/login']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (PUBLIC_PATHS.includes(pathname)) return NextResponse.next()

  const authCookie = request.cookies.get('checkin_auth')

  if (!authCookie) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const role = authCookie.value

  if (pathname.startsWith('/admin') && role !== 'admin') {
    return NextResponse.redirect(new URL('/checkin', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons).*)'],
}
