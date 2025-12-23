import helmet from 'helmet';
import rateLimit from './rateLimit';
import cors from './cors';
import { schemas, validate } from './validate';
import secureUpload from './fileUpload';

// Security middleware configuration
const securityMiddleware = (app) => {
  // 1. Set security-related HTTP headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'", 
          "'unsafe-inline'", 
          "'unsafe-eval'",
          'https://*.razorpay.com',
          'https://www.googletagmanager.com',
          'https://www.google-analytics.com'
        ],
        styleSrc: [
          "'self'", 
          "'unsafe-inline'", 
          'https://fonts.googleapis.com'
        ],
        imgSrc: [
          "'self'", 
          'data:', 
          'https:', 
          'blob:',
          'https://*.razorpay.com',
          'https://www.google-analytics.com'
        ],
        fontSrc: [
          "'self'", 
          'https://fonts.gstatic.com',
          'data:'
        ],
        connectSrc: [
          "'self'",
          'https://*.razorpay.com',
          'https://*.sentry.io',
          'https://www.google-analytics.com'
        ],
        frameSrc: [
          "'self'",
          'https://*.razorpay.com',
          'https://www.youtube.com',
          'https://player.vimeo.com'
        ],
        mediaSrc: [
          "'self'",
          'blob:',
          'https://*.cloudfront.net'
        ],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: []
      }
    },
    hsts: {
      maxAge: 63072000, // 2 years in seconds
      includeSubDomains: true,
      preload: true
    },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    frameguard: { action: 'deny' },
    noSniff: true,
    xssFilter: true,
    hidePoweredBy: true,
    ieNoOpen: true,
    noCache: false
  }));

  // 2. Enable CORS with security best practices
  app.use(cors);

  // 3. Apply rate limiting to all routes
  app.use(rateLimit);

  // 4. Security middleware for parsing JSON and URL-encoded data
  app.use((req, res, next) => {
    // Parse JSON bodies
    if (req.is('application/json')) {
      express.json({
        limit: '10kb',
        strict: true,
        type: 'application/json'
      })(req, res, next);
    } 
    // Parse URL-encoded bodies
    else if (req.is('application/x-www-form-urlencoded')) {
      express.urlencoded({
        extended: true,
        limit: '10kb',
        parameterLimit: 10
      })(req, res, next);
    } else {
      next();
    }
  });

  // 5. Add security headers to responses
  app.use((req, res, next) => {
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');
    
    // Enable XSS filtering
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Disable caching for sensitive routes
    if (req.path.startsWith('/api/auth') || req.path.startsWith('/api/admin')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Surrogate-Control', 'no-store');
    }
    
    next();
  });

  // 6. Request validation middleware
  app.use((req, res, next) => {
    // Skip validation for GET and HEAD requests
    if (['GET', 'HEAD'].includes(req.method)) {
      return next();
    }

    // Add validation for common endpoints
    if (req.path === '/api/auth/register') {
      return validate(schemas.auth.register)(req, res, next);
    }
    
    if (req.path === '/api/auth/login') {
      return validate(schemas.auth.login)(req, res, next);
    }
    
    // Add more route validations as needed
    
    next();
  });

  // 7. File upload validation
  app.use('/api/upload', secureUpload({
    fieldName: 'file',
    maxCount: 5,
    allowedTypes: Object.keys(ALLOWED_FILE_TYPES),
    maxSize: 10 * 1024 * 1024 // 10MB
  }));

  // 8. Error handling for security-related issues
  app.use((err, req, res, next) => {
    // Handle security-related errors
    if (err.name === 'UnauthorizedError') {
      return res.status(401).json({ error: 'Invalid or missing token' });
    }
    
    if (err.name === 'RateLimitExceeded') {
      return res.status(429).json({ 
        error: 'Too many requests',
        retryAfter: err.retryAfter 
      });
    }
    
    // Hide sensitive error details in production
    const errorResponse = {
      error: 'An error occurred',
      ...(process.env.NODE_ENV === 'development' && { 
        message: err.message,
        stack: err.stack 
      })
    };
    
    res.status(err.status || 500).json(errorResponse);
  });
};

export default securityMiddleware;
