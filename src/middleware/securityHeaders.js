import { NextResponse } from 'next/server';

// Security headers middleware
const securityHeaders = [
  // Prevent clickjacking
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  // Enable XSS filtering
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  // Prevent MIME type sniffing
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  // Strict Transport Security
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  // Referrer Policy
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  // Permissions Policy
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  // Content Security Policy
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.razorpay.com https://www.googletagmanager.com https://www.google-analytics.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https: blob:",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://*.razorpay.com https://*.sentry.io https://www.google-analytics.com",
      "frame-src 'self' https://*.razorpay.com https://www.youtube.com https://player.vimeo.com",
      "media-src 'self' blob: https://*.cloudfront.net",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "block-all-mixed-content",
      "upgrade-insecure-requests"
    ].join('; ')
  }
];

/**
 * Middleware to add security headers to all responses
 * @param {import('next/server').NextRequest} request - The incoming request
 * @returns {Promise<NextResponse>} The response with security headers
 */
export async function securityHeadersMiddleware(request) {
  const response = NextResponse.next();

  // Add security headers to the response
  securityHeaders.forEach(({ key, value }) => {
    response.headers.set(key, value);
  });

  // Add additional security headers for API routes
  if (request.nextUrl.pathname.startsWith('/api')) {
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-DNS-Prefetch-Control', 'off');
    
    // Disable caching for sensitive API routes
    if (request.nextUrl.pathname.startsWith('/api/auth') || 
        request.nextUrl.pathname.startsWith('/api/admin')) {
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      response.headers.set('Surrogate-Control', 'no-store');
    }
  }

  return response;
}

export default securityHeadersMiddleware;
