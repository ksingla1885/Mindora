/**
 * Simple in-memory rate limiter.
 * Used by API routes that previously imported from the non-existent '@/lib/rate-limit'.
 *
 * For production, replace this with a Redis-backed solution (e.g. @upstash/ratelimit).
 */

const store = new Map();

/**
 * Create a rate limiter instance.
 * @param {Object} options
 * @param {number} options.interval - Window duration in ms
 * @param {number} [options.uniqueTokenPerInterval=500] - Max unique tokens per window
 */
export function rateLimit({ interval, uniqueTokenPerInterval = 500 }) {
  return {
    /**
     * Check if a token is within the allowed rate.
     * @param {number} limit - Max requests allowed in the window
     * @param {string} token - Unique identifier (user ID, IP, email, etc.)
     * @returns {{ success: boolean }}
     * @throws {Error} if rate limit exceeded (for backwards compatibility with `.check()` callers)
     */
    check(limit, token) {
      const now = Date.now();
      const key = `${token}`;
      const entry = store.get(key) || { count: 0, resetAt: now + interval };

      // Reset window if expired
      if (now > entry.resetAt) {
        entry.count = 0;
        entry.resetAt = now + interval;
      }

      entry.count++;
      store.set(key, entry);

      // Clean up oversized store
      if (store.size > uniqueTokenPerInterval) {
        const oldestKey = store.keys().next().value;
        store.delete(oldestKey);
      }

      const success = entry.count <= limit;

      if (!success) {
        const err = new Error('rate limit exceeded');
        err.statusCode = 429;
        throw err;
      }

      return { success };
    },
  };
}
