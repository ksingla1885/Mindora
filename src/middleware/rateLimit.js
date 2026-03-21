import { NextResponse } from 'next/server';
import redis from '@/lib/redis';

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

// Simple in-memory rate limiter fallback (for when Redis is unavailable)
const memoryStore = new Map();

async function checkRateLimit(ip, type) {
  const config = rateLimiterConfig[type] || rateLimiterConfig.api;
  const key = `rate_limit:${type}:${ip}`;
  const now = Date.now();
  const windowMs = config.duration * 1000;

  // Try Redis first
  try {
    const redisKey = `mindora:${key}`;
    const [count] = await Promise.all([
      redis.get(redisKey),
    ]);

    const currentCount = count ? parseInt(count, 10) : 0;

    if (currentCount >= config.points) {
      return { allowed: false, remaining: 0, limit: config.points };
    }

    // Increment and set TTL (fire and forget)
    if (redis.client) {
      redis.client.incr(redisKey).catch(() => {});
      if (currentCount === 0) {
        redis.client.expire(redisKey, config.duration).catch(() => {});
      }
    }

    return { allowed: true, remaining: config.points - currentCount - 1, limit: config.points };
  } catch {
    // Fall back to in-memory store
  }

  // In-memory fallback
  const entry = memoryStore.get(key) || { count: 0, resetAt: now + windowMs };
  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + windowMs;
  }
  entry.count++;
  memoryStore.set(key, entry);

  if (entry.count > config.points) {
    return { allowed: false, remaining: 0, limit: config.points };
  }
  return { allowed: true, remaining: config.points - entry.count, limit: config.points };
}

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
  let type = 'api';
  if (request.nextUrl.pathname.startsWith('/api/auth')) {
    type = 'auth';
  } else if (request.nextUrl.pathname.startsWith('/api/upload')) {
    type = 'upload';
  }

  try {
    const result = await checkRateLimit(ip, type);
    const config = rateLimiterConfig[type];

    if (!result.allowed) {
      return new NextResponse(
        JSON.stringify({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Please try again later.',
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': String(result.limit),
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }

    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', String(result.limit));
    response.headers.set('X-RateLimit-Remaining', String(result.remaining));
    return response;

  } catch (error) {
    // If rate limiting itself fails, allow the request through
    console.warn('[RateLimit] Rate limiting check failed, allowing request:', error.message);
    return NextResponse.next();
  }
}

