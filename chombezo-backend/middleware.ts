import { NextRequest, NextResponse } from 'next/server';

function normalizeOrigin(value?: string | null) {
  if (!value) return '';
  return value.trim().replace(/\/$/, '');
}

const allowedOrigins = [
  normalizeOrigin(process.env.FRONTEND_URL),
  'http://localhost:8080',
  'http://localhost:3000',
  'http://127.0.0.1:8080',
  'http://127.0.0.1:3000',
].filter(Boolean);

export function middleware(request: NextRequest) {
  const origin = normalizeOrigin(request.headers.get('origin'));
  const isAllowedOrigin = !!origin && allowedOrigins.includes(origin);

  console.log('CORS origin:', origin);
  console.log('Allowed origins:', allowedOrigins);
  console.log('Method:', request.method);
  console.log('Path:', request.nextUrl.pathname);

  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 });

    if (isAllowedOrigin) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    }

    response.headers.set(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, PATCH, DELETE, OPTIONS'
    );
    response.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization'
    );
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Vary', 'Origin');

    return response;
  }

  const response = NextResponse.next();

  if (isAllowedOrigin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }

  response.headers.set(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, PATCH, DELETE, OPTIONS'
  );
  response.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization'
  );
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Vary', 'Origin');

  return response;
}

export const config = {
  matcher: '/api/:path*',
};