import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = new URL(request.url);

  // Unified auth entry point → CROWN login at root
  if (url.pathname === '/_auth' || url.pathname === '/_auth/') {
    return NextResponse.redirect(new URL('/login/', url.origin), 302);
  }

  // Auth callback → CROWN callback handler at root
  if (url.pathname === '/auth/callback' || url.pathname === '/auth/callback/') {
    return NextResponse.redirect(new URL('/callback_route/', url.origin), 302);
  }

  // Logomind legacy redirect
  if (url.pathname === '/logomind' || url.pathname === '/logomind/') {
    return NextResponse.redirect(new URL('/out/logomind/index.html', url.origin), 302);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/_auth', '/_auth/', '/auth/callback', '/auth/callback/', '/logomind', '/logomind/'],
};