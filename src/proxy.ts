import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // This is a basic proxy for request handling in Next.js 16.
  // Role-based logic is currently handled client-side for immediate feedback.
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/checkin/:path*'],
};
