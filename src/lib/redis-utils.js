import redis from './redis';

class RedisCache {
  constructor(prefix = '') {
    this.prefix = prefix;
  }

  async get(key) {
    const result = await redis.get(`${this.prefix}${key}`);
    if (result === null) return null;
    try {
      return JSON.parse(result);
    } catch (e) {
      return result;
    }
  }

  async set(key, value, ttl = null) {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    if (ttl) {
      return redis.setex(`${this.prefix}${key}`, ttl, stringValue);
    }
    return redis.set(`${this.prefix}${key}`, stringValue);
  }

  async del(key) {
    return redis.del(`${this.prefix}${key}`);
  }

  async clear() {
    const keys = await redis.keys(`${this.prefix}*`);
    if (keys.length > 0) {
      return redis.del(...keys);
    }
    return 0;
  }
}

// Export default cache instance
export const cache = new RedisCache(process.env.REDIS_PREFIX || 'mindora:');

// Export the class for custom cache instances
export default RedisCache;

