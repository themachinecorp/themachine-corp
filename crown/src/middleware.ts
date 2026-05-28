import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = new URL(request.url);

  // Unified auth entry points — redirect to CROWN login
  // /_auth/ and /_auth → /crown/login/
  if (url.pathname === '/_auth' || url.pathname === '/_auth/') {
    return NextResponse.redirect(new URL('/crown/login/', url.origin), 302);
  }

  // Auth callback — redirect to CROWN callback handler
  if (url.pathname === '/auth/callback' || url.pathname === '/auth/callback/') {
    return NextResponse.redirect(new URL('/crown/callback_route/', url.origin), 302);
  }

  // Let the request continue for all other paths
  return NextResponse.next();
}

export const config = {
  matcher: ['/_auth', '/_auth/', '/auth/callback', '/auth/callback/'],
};