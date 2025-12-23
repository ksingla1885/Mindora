/**
 * CORS configuration middleware
 * Implements strict CORS policies for security
 */

// Allowed origins (in production, this should be your frontend domains)
const allowedOrigins = [
  'http://localhost:3000',
  'https://mindora.vercel.app',
  'https://www.mindora.in',
  'https://mindora.in',
];

// Allowed methods for CORS requests
const allowedMethods = [
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'OPTIONS',
];

// Allowed headers for CORS requests
const allowedHeaders = [
  'Content-Type',
  'Authorization',
  'X-Requested-With',
  'Accept',
  'Origin',
  'X-Auth-Token',
  'X-CSRF-Token',
  'X-API-Version',
];

// Exposed headers in CORS responses
const exposedHeaders = [
  'Content-Length',
  'Content-Range',
  'X-Total-Count',
  'X-RateLimit-Limit',
  'X-RateLimit-Remaining',
  'X-RateLimit-Reset',
  'Retry-After',
];

/**
 * CORS middleware with security best practices
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const cors = (req, res, next) => {
  try {
    const origin = req.headers.origin;
    
    // Check if the request origin is allowed
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      res.setHeader('Access-Control-Allow-Origin', origin || '*');
      
      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        // Cache preflight response for 2 hours (Chromium max)
        res.setHeader('Access-Control-Max-Age', '7200');
        
        // Set allowed methods and headers
        res.setHeader('Access-Control-Allow-Methods', allowedMethods.join(','));
        res.setHeader('Access-Control-Allow-Headers', allowedHeaders.join(','));
        res.setHeader('Access-Control-Expose-Headers', exposedHeaders.join(','));
        
        // Allow credentials if needed (cookies, authorization headers)
        if (req.headers['access-control-request-headers']?.includes('authorization')) {
          res.setHeader('Access-Control-Allow-Credentials', 'true');
        }
        
        // End preflight request
        return res.status(204).end();
      }
      
      // Set CORS headers for actual requests
      res.setHeader('Access-Control-Allow-Methods', allowedMethods.join(','));
      res.setHeader('Access-Control-Allow-Headers', allowedHeaders.join(','));
      res.setHeader('Access-Control-Expose-Headers', exposedHeaders.join(','));
      
      // Security headers
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      
      // Content Security Policy
      const csp = [
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
      ];
      
      res.setHeader('Content-Security-Policy', csp.join('; ') + ';');
      
      // Feature Policy
      res.setHeader('Feature-Policy', "geolocation 'none'; microphone 'none'; camera 'none'");
      
      // Referrer Policy
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      
      // Permissions Policy
      res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
      
      // HSTS (in production)
      if (process.env.NODE_ENV === 'production') {
        res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
      }
    } else {
      // Origin not allowed
      res.setHeader('Access-Control-Allow-Origin', 'null');
      if (req.method === 'OPTIONS') {
        return res.status(204).end();
      }
    }
    
    next();
  } catch (error) {
    console.error('CORS error:', error);
    next(error);
  }
};

export default cors;
