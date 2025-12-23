import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

// List of paths that don't require authentication
const publicPaths = [
  "/",
  "/auth/signin",
  "/auth/signup",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/verify-email",
  "/api/auth",
  "/api/auth/register",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/verify-email",
  "/_next/static",
  "/_next/image",
  "/favicon.ico",
  "/terms",
  "/privacy"
];

// Paths that require authentication but no specific role
const authenticatedPaths = [
  "/dashboard",
  "/profile",
  "/settings"
];

// Paths that require admin role
const adminPaths = [
  "/admin"
];

// Paths that require teacher role
const teacherPaths = [
  "/teacher"
];

// Paths that require student role
const studentPaths = [
  "/tests",
  "/practice",
  "/courses"
];

// Rate limiting configuration
const rateLimit = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 100; // Max requests per window

export async function middleware(request) {
  const { pathname, origin } = request.nextUrl;
  const requestHeaders = new Headers(request.headers);

  // Add security headers to all responses
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  requestHeaders.set('X-Content-Type-Options', 'nosniff');
  requestHeaders.set('X-Frame-Options', 'DENY');
  requestHeaders.set('X-XSS-Protection', '1; mode=block');
  requestHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  requestHeaders.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  requestHeaders.set('Content-Security-Policy',
    `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com 'nonce-${nonce}'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com; frame-src 'self' https://www.youtube.com https://www.google.com;`
  );

  // Apply rate limiting to API routes
  if (pathname.startsWith('/api/')) {
    const ip = request.headers.get('x-forwarded-for') || request.ip;
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW;

    // Clean up old entries
    for (const [ip, { timestamp }] of rateLimit.entries()) {
      if (timestamp < windowStart) {
        rateLimit.delete(ip);
      }
    }

    // Check rate limit
    const rateLimitInfo = rateLimit.get(ip) || { count: 0, timestamp: now };

    if (now - rateLimitInfo.timestamp > RATE_LIMIT_WINDOW) {
      rateLimitInfo.count = 0;
      rateLimitInfo.timestamp = now;
    }

    rateLimitInfo.count++;
    rateLimit.set(ip, rateLimitInfo);

    // Set rate limit headers
    requestHeaders.set('X-RateLimit-Limit', RATE_LIMIT_MAX);
    requestHeaders.set('X-RateLimit-Remaining', Math.max(0, RATE_LIMIT_MAX - rateLimitInfo.count));
    requestHeaders.set('X-RateLimit-Reset', Math.ceil((rateLimitInfo.timestamp + RATE_LIMIT_WINDOW) / 1000));

    if (rateLimitInfo.count > RATE_LIMIT_MAX) {
      return new NextResponse(
        JSON.stringify({ message: 'Too many requests, please try again later.' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            ...Object.fromEntries(requestHeaders)
          }
        }
      );
    }
  }

  // Check if the current path is public
  const isPublicPath = publicPaths.some(path =>
    pathname === path || pathname.startsWith(`${path}/`)
  );

  // If it's a public path, continue with the request
  if (isPublicPath) {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // Get the session token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  });

  // Check if the path requires authentication
  const requiresAuth = authenticatedPaths.some(path =>
    pathname === path || pathname.startsWith(`${path}/`)
  );

  const isAdminPath = adminPaths.some(path =>
    pathname === path || pathname.startsWith(`${path}/`)
  );

  const isTeacherPath = teacherPaths.some(path =>
    pathname === path || pathname.startsWith(`${path}/`)
  );

  const isStudentPath = studentPaths.some(path =>
    pathname === path || pathname.startsWith(`${path}/`)
  );

  // If no token and the path requires auth, redirect to signin
  if ((requiresAuth || isAdminPath || isTeacherPath || isStudentPath) && !token) {
    const signInUrl = new URL('/auth/signin', origin);
    signInUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Check role-based access
  if (token) {
    // Admin has access to everything
    if (token.role === 'ADMIN') {
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }

    // Teacher access
    if (token.role === 'TEACHER' && (isTeacherPath || isStudentPath || requiresAuth)) {
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }

    // Student access
    if (token.role === 'STUDENT' && (isStudentPath || requiresAuth)) {
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }

    // If user doesn't have required role, show 403
    if (isAdminPath || isTeacherPath) {
      return new NextResponse(
        JSON.stringify({ message: 'You do not have permission to access this page' }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
            ...Object.fromEntries(requestHeaders)
          }
        }
      );
    }
  }

  // Add user role to request headers for API routes
  if (token) {
    requestHeaders.set('x-user-role', token.role || 'GUEST');
    requestHeaders.set('x-user-id', token.sub || '');
  }

  // For all other cases, continue with the request
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - public folder
     * - api/auth (auth routes)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
