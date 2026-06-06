import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Daftar prefix route yang wajib login
const protectedRoutes = ['/dashboard', '/pos', '/products', '/batches', '/stock-opname', '/returns', '/prescriptions', '/sales', '/hq', '/satusehat'];

export default function proxy(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // Cek apakah route saat ini adalah rute terproteksi
  const isProtected = protectedRoutes.some(route => pathname.startsWith(route));

  // Jika terproteksi dan tidak ada token, arahkan ke login
  if (isProtected && !token) {
    const url = new URL('/login', request.url);
    return NextResponse.redirect(url);
  }

  // Jika sudah login tapi mengakses halaman login atau root (yang otomatis redirect ke login), arahkan ke dashboard
  if (token && (pathname === '/login' || pathname === '/')) {
    const url = new URL('/dashboard', request.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
