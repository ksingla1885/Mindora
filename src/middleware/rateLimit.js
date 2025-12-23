import { NextResponse } from 'next/server';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import redisClient from '@/lib/redis';

// Rate limiting configuration
const rateLimiterConfig = {
  // General API endpoints (100 requests per 15 minutes)
  api: {
    points: 100,
    duration: 15 * 60, // 15 minutes
    blockDuration: 60 * 60, // Block for 1 hour if limit exceeded
  },
  // Authentication endpoints (5 requests per minute)
  auth: {
    points: 5,
    duration: 60, // 1 minute
    blockDuration: 5 * 60, // Block for 5 minutes if limit exceeded
  },
  // File uploads (10 per hour)
  upload: {
    points: 10,
    duration: 60 * 60, // 1 hour
    blockDuration: 2 * 60 * 60, // Block for 2 hours if limit exceeded
  },
};

// Create rate limiters
const rateLimiters = {
  api: null,
  auth: null,
  upload: null,
};

// Initialize rate limiters with Redis
Object.keys(rateLimiterConfig).forEach((key) => {
  rateLimiters[key] = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: `rate_limit:${key}`,
    ...rateLimiterConfig[key],
  });
});

/**
 * Rate limiting middleware for Next.js
 * @param {Request} request - Next.js request object
 * @returns {Promise<Response>} Next.js response
 */
export async function rateLimitMiddleware(request) {
  // Skip rate limiting in development
  if (process.env.NODE_ENV === 'development') {
    return NextResponse.next();
  }

  // Get client IP
  const ip = request.headers.get('x-real-ip') || 
             request.headers.get('x-forwarded-for')?.split(',').shift().trim() ||
             'unknown';
  
  // Determine rate limiter based on path
  let rateLimiter;
  if (request.nextUrl.pathname.startsWith('/api/auth')) {
    rateLimiter = rateLimiters.auth;
  } else if (request.nextUrl.pathname.startsWith('/api/upload')) {
    rateLimiter = rateLimiters.upload;
  } else if (request.nextUrl.pathname.startsWith('/api')) {
    rateLimiter = rateLimiters.api;
  } else {
    // For non-API routes, use default rate limiting
    rateLimiter = rateLimiters.api;
  }

  try {
    // Consume a point
    const rateLimitRes = await rateLimiter.consume(ip);
    
    // Set rate limit headers
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', rateLimiter.points.toString());
    response.headers.set('X-RateLimit-Remaining', rateLimitRes.remainingPoints.toString());
    response.headers.set('X-RateLimit-Reset', Math.ceil((Date.now() + rateLimitRes.msBeforeNext) / 1000).toString());
    
    return response;
    
  } catch (error) {
    // Rate limit exceeded
    const response = new NextResponse(
      JSON.stringify({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': Math.ceil(error.msBeforeNext / 1000) || 1,
          'X-RateLimit-Limit': rateLimiter.points,
          'X-RateLimit-Remaining': 0,
          'X-RateLimit-Reset': Math.ceil((Date.now() + error.msBeforeNext) / 1000),
        },
      }
    );
    
    return response;
  }
}
