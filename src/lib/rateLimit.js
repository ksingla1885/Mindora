/**
 * Upstash Redis-backed sliding window rate limiter.
 *
 * Safe for Vercel Edge Runtime — uses fetch() only (no ioredis / Node.js APIs).
 * Works across all edge nodes and persists across cold starts.
 *
 * Route-tier rate limits (requests per minute):
 *   - AUTH      : 10  (login, register, forgot-password, reset, OTP)
 *   - AI        : 20  (OpenAI-backed endpoints — cost protection)
 *   - PAYMENT   : 15  (Razorpay checkout / order creation)
 *   - WEBHOOK   : 60  (incoming webhooks)
 *   - API       : 120 (all other /api/* routes)
 *   - PAGE      : 300 (non-API pages)
 */

// ─── Limit tiers ───────────────────────────────────────────────────────────
const RATE_LIMITS = {
  AUTH:    { max: 10,  window: 60  },  // 10 req / 1 min
  AI:      { max: 20,  window: 60  },  // 20 req / 1 min
  PAYMENT: { max: 15,  window: 60  },  // 15 req / 1 min
  WEBHOOK: { max: 60,  window: 60  },  // 60 req / 1 min
  API:     { max: 120, window: 60  },  // 120 req / 1 min
  PAGE:    { max: 300, window: 60  },  // 300 req / 1 min
};

/**
 * Determine which rate-limit tier applies to a pathname.
 */
export function getTier(pathname) {
  if (
    pathname.startsWith('/api/auth/login') ||
    pathname.startsWith('/api/auth/register') ||
    pathname.startsWith('/api/auth/forgot-password') ||
    pathname.startsWith('/api/auth/reset-password') ||
    pathname.startsWith('/api/auth/verify-email') ||
    pathname.startsWith('/api/auth/verify-otp')
  ) return 'AUTH';

  if (pathname.startsWith('/api/ai/'))      return 'AI';
  if (pathname.startsWith('/api/payments/') ||
      pathname.startsWith('/api/checkout/') ||
      pathname.startsWith('/api/orders/'))   return 'PAYMENT';
  if (pathname.startsWith('/api/webhooks/')) return 'WEBHOOK';
  if (pathname.startsWith('/api/'))          return 'API';

  return 'PAGE';
}

/**
 * Check rate limit for a given IP and pathname using Upstash Redis.
 *
 * Uses INCR + EXPIRE pipeline for atomicity on the edge.
 *
 * @param {string} ip        - Client IP address
 * @param {string} pathname  - Request pathname
 * @returns {{ allowed: boolean, limit: number, remaining: number, reset: number }}
 */
export async function checkRateLimit(ip, pathname) {
  const redisUrl   = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  // If Redis is not configured, fail open (don't block legitimate traffic)
  if (!redisUrl || !redisToken) {
    return { allowed: true, limit: 0, remaining: 0, reset: 0 };
  }

  const tier = getTier(pathname);
  const { max, window: windowSecs } = RATE_LIMITS[tier];

  // Sanitize IP for use as a Redis key (strip IPv6 brackets etc.)
  const safeIp = (ip || 'unknown').replace(/[^a-zA-Z0-9.:_-]/g, '_');
  const key    = `ddos:rl:${tier.toLowerCase()}:${safeIp}`;

  try {
    // Atomic INCR + EXPIRE pipeline via Upstash REST API
    const response = await fetch(`${redisUrl}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${redisToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        ['INCR',   key],
        ['EXPIRE', key, windowSecs],
      ]),
      // Skip Next.js data cache — we need real-time counts
      cache: 'no-store',
    });

    if (!response.ok) {
      // Redis error — fail open to avoid blocking legitimate users
      console.warn('[RateLimit] Upstash pipeline failed:', response.status);
      return { allowed: true, limit: max, remaining: max, reset: 0 };
    }

    const data  = await response.json();
    const count = data?.[0]?.result ?? 0;
    const reset = Math.ceil(Date.now() / 1000) + windowSecs;

    return {
      allowed:   count <= max,
      limit:     max,
      remaining: Math.max(0, max - count),
      reset,
      tier,
      count,
    };
  } catch (err) {
    // Network error — fail open
    console.warn('[RateLimit] Upstash fetch error:', err?.message);
    return { allowed: true, limit: max, remaining: max, reset: 0 };
  }
}

/**
 * Build rate-limit response headers.
 */
export function rateLimitHeaders(info) {
  return {
    'X-RateLimit-Limit':     String(info.limit),
    'X-RateLimit-Remaining': String(info.remaining),
    'X-RateLimit-Reset':     String(info.reset),
    'X-RateLimit-Tier':      info.tier || 'UNKNOWN',
  };
}
