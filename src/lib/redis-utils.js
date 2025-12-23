import { redisClient } from './redis';

class RedisCache {
  constructor(prefix = '') {
    this.prefix = prefix;
  }

  async get(key) {
    const result = await redisClient.get(`${this.prefix}${key}`);
    try {
      return JSON.parse(result);
    } catch (e) {
      return result;
    }
  }

  async set(key, value, ttl = null) {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    if (ttl) {
      return redisClient.set(`${this.prefix}${key}`, stringValue, 'EX', ttl);
    }
    return redisClient.set(`${this.prefix}${key}`, stringValue);
  }

  async del(key) {
    return redisClient.del(`${this.prefix}${key}`);
  }

  async clear() {
    const keys = await redisClient.keys(`${this.prefix}*`);
    if (keys.length > 0) {
      return redisClient.del(keys);
    }
    return 0;
  }
}

// Export default cache instance
export const cache = new RedisCache(process.env.REDIS_PREFIX || 'mindora:');

// Export the class for custom cache instances
export default RedisCache;
