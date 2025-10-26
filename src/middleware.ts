import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const locales = ['en', 'fr'];

async function getLocale(request: NextRequest): Promise<string> {
  // First check if user has a language preference in their session
  const token = await getToken({ req: request as any });
  if (token?.language) {
    // Convert database language format (EN/FR) to locale format (en/fr)
    return token.language.toLowerCase();
  }
  
  // Fallback to browser language detection
  const acceptLanguage = request.headers.get('accept-language') || '';
  const languages = acceptLanguage.split(',');
  
  for (const lang of languages) {
    const locale = lang.split('-')[0].trim();
    if (locales.includes(locale)) {
      return locale;
    }
  }
  
  return 'en';
}

export default withAuth(
  async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;
    const pathnameHasLocale = locales.some(
      (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
    );

    // If no locale in path, add the user's preferred locale
    if (!pathnameHasLocale) {
      const preferredLocale = await getLocale(request);
      const newUrl = new URL(`/${preferredLocale}${pathname}`, request.url);
      return NextResponse.redirect(newUrl);
    }

    // If user has explicitly navigated to a locale URL, respect their choice
    // Don't force redirect to their saved preference - this allows manual language switching
    
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;
        
        // Public routes
        if (
          pathname.includes('/auth/') ||
          pathname === '/' ||
          pathname.match(/^\/[a-z]{2}$/) ||
          pathname.match(/^\/[a-z]{2}\/auth/) ||
          pathname.match(/^\/[a-z]{2}\/pdf\//)
        ) {
          return true;
        }

        // Protected routes
        if (!token) {
          return false;
        }

        // Admin routes
        if (pathname.includes('/admin')) {
          return token.role === 'SUPER_ADMIN' || token.role === 'SUPERVISOR';
        }

        return true;
      },
    },
  }
);

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};