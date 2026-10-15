import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ============ CONFIG ============
const ROLE_PREFIX: Record<string, string> = {
  admin: '/admin',
  registrar: '/registrar',
  'department-head': '/department-head',
};

const PROTECTED_PREFIXES = Object.values(ROLE_PREFIX);

const SESSION_COOKIE = 'auth-session';

interface SessionData {
  role: string;
  email: string;
  name: string;
}

// ============ PROXY FUNCTION ============
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get(SESSION_COOKIE);

  if (!sessionCookie?.value) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const session: SessionData = JSON.parse(
      decodeURIComponent(sessionCookie.value),
    );

    const expectedPrefix = ROLE_PREFIX[session.role];
    if (!expectedPrefix) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    if (!pathname.startsWith(expectedPrefix)) {
      return NextResponse.redirect(
        new URL(`${expectedPrefix}/dashboard`, request.url),
      );
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

// ============ MATCHER ============
export const config = {
  matcher: ['/admin/:path*', '/registrar/:path*', '/department-head/:path*'],
};