import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Lewati static assets, api, login page, dan root page
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/login' ||
    pathname === '/' ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Periksa cookie untuk demo role
  const demoRoleCookie = request.cookies.get('demo_role')?.value;
  
  // Periksa cookie Supabase (biasanya berformat sb-xxxx-auth-token)
  const hasSupabaseSession = request.cookies.getAll().some(cookie => 
    cookie.name.includes('-auth-token')
  );

  const isLoggedIn = !!demoRoleCookie || hasSupabaseSession;

  // Jika tidak login, alihkan ke /login
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Jika login, lakukan proteksi berbasis Role (RBAC)
  const userRole = demoRoleCookie; // fallback atau peran utama untuk demo

  if (userRole) {
    // 1. Kasir hanya boleh mengakses /pos dan /dashboard
    if (userRole === 'cashier') {
      if (pathname.startsWith('/inventory') || pathname.startsWith('/reports') || pathname.startsWith('/controlled-logs') || pathname.startsWith('/discounts')) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
    
    // 2. Apoteker tidak boleh mengakses halaman /reports (keuangan/analitik)
    if (userRole === 'pharmacist') {
      if (pathname.startsWith('/reports')) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
