// middleware.js
import { NextResponse } from 'next/server';

export function middleware(request) {
  // 1. Check if user has the special cookie
  const isLoggedIn = request.cookies.get('is_admin_logged_in');
  
  // 2. If trying to access the Login page, let them in
  if (request.nextUrl.pathname === '/login') {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // 3. For ALL other pages (Home, API), check login
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

// Protect everything EXCEPT static files (images, css)
export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
};
