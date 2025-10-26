import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  
  // URLs that don't need authentication
  const publicRoutes = ['/login', '/api/auth', '/_next', '/images', '/favicon.ico', '/api/holidays', '/api/admin', '/api/schedules', '/api/groups'];
  
  // Check if URL matches any public route
  const isPublicRoute = publicRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  );
  
  // Password reset API needs to be accessible to authenticated users
  if (request.nextUrl.pathname === '/api/user/reset-password' || 
      request.nextUrl.pathname === '/api/test-password-reset') {
    return NextResponse.next();
  }

  // If it's a public route, allow access
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // If user is not authenticated, redirect to login
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If user must reset password and they're not on the reset page, redirect them
  if (token.mustResetPassword && !request.nextUrl.pathname.startsWith('/reset-password')) {
    return NextResponse.redirect(new URL('/reset-password', request.url));
  }

  // If user is on reset-password page but doesn't need to reset, redirect to home
  if (!token.mustResetPassword && request.nextUrl.pathname.startsWith('/reset-password')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Allow all other requests to continue
  return NextResponse.next();
}