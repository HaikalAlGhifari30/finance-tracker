import { NextResponse } from 'next/server';

export function middleware(request: any) {
  // Routing is handled client-side via SplashScreen in page.tsx.
  // No redirect needed here.
  return NextResponse.next();
}

export const config = {
  matcher: [], // No paths intercepted
};
