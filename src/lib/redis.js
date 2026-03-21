import Redis from 'ioredis';
import { redisConfig } from '@/config/redis';

// Only initialize Redis if credentials are configured
const hasRedisConfig = () =>
  process.env.REDIS_URL || process.env.REDIS_HOST;

let _client = null;

function getRedisClient() {
  if (!hasRedisConfig()) return null;

  if (_client) return _client;

  if (process.env.REDIS_URL) {
    _client = new Redis(process.env.REDIS_URL, {
      retryStrategy: (times) => {
        if (times > 3) return null; // Stop retrying after 3 attempts
        return Math.min(times * 100, 3000);
      },
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      lazyConnect: true,
    });
  } else {
    _client = new Redis({
      host: redisConfig.host,
      port: redisConfig.port,
      password: redisConfig.password || undefined,
      db: redisConfig.db,
      keyPrefix: redisConfig.keyPrefix,
      retryStrategy: (times) => {
        if (times > 3) return null;
        return Math.min(times * 100, 3000);
      },
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      lazyConnect: true,
    });
  }

  _client.on('error', (err) => {
    // Log but don't crash — Redis is optional
    console.warn('[Redis] Connection error (non-fatal):', err.message);
  });

  return _client;
}

class RedisManager {
  get client() {
    return getRedisClient();
  }

  get isConnected() {
    return this.client?.status === 'ready';
  }

  // Test session methods
  async saveAnswer(testId, userId, questionId, answer) {
    const client = getRedisClient();
    if (!client) return null;
    try {
      const key = `test:${testId}:${userId}:answers`;
      return client.hset(key, questionId, JSON.stringify({ answer, timestamp: Date.now() }));
    } catch (e) { console.warn('[Redis] saveAnswer error:', e.message); return null; }
  }

  async getAnswers(testId, userId) {
    const client = getRedisClient();
    if (!client) return {};
    try {
      const key = `test:${testId}:${userId}:answers`;
      const answers = await client.hgetall(key);
      if (!answers) return {};
      return Object.entries(answers).reduce((acc, [qId, data]) => ({
        ...acc,
        [qId]: JSON.parse(data),
      }), {});
    } catch (e) { console.warn('[Redis] getAnswers error:', e.message); return {}; }
  }

  async updateTimeSpent(testId, userId, questionId, seconds) {
    const client = getRedisClient();
    if (!client) return null;
    try {
      const key = `test:${testId}:${userId}:time`;
      return client.hincrby(key, questionId, seconds);
    } catch (e) { console.warn('[Redis] updateTimeSpent error:', e.message); return null; }
  }

  async getTimeSpent(testId, userId) {
    const client = getRedisClient();
    if (!client) return {};
    try {
      const key = `test:${testId}:${userId}:time`;
      const timeSpent = await client.hgetall(key);
      if (!timeSpent) return {};
      return Object.entries(timeSpent).reduce((acc, [qId, secs]) => ({
        ...acc,
        [qId]: parseInt(secs, 10),
      }), {});
    } catch (e) { console.warn('[Redis] getTimeSpent error:', e.message); return {}; }
  }

  async addUserToTestSession(testId, userId) {
    const client = getRedisClient();
    if (!client) return null;
    try {
      const key = `test:${testId}:users`;
      await client.sadd(key, userId);
      return client.expire(key, 60 * 60 * 24);
    } catch (e) { console.warn('[Redis] addUserToTestSession error:', e.message); return null; }
  }

  async removeUserFromTestSession(testId, userId) {
    const client = getRedisClient();
    if (!client) return null;
    try {
      return client.srem(`test:${testId}:users`, userId);
    } catch (e) { console.warn('[Redis] removeUserFromTestSession error:', e.message); return null; }
  }

  async getTestSessionUsers(testId) {
    const client = getRedisClient();
    if (!client) return [];
    try {
      return client.smembers(`test:${testId}:users`);
    } catch (e) { console.warn('[Redis] getTestSessionUsers error:', e.message); return []; }
  }

  async cleanupTestSession(testId, userId) {
    const client = getRedisClient();
    if (!client) return;
    try {
      await Promise.all([
        client.del(`test:${testId}:${userId}:answers`),
        client.del(`test:${testId}:${userId}:time`),
        client.srem(`test:${testId}:users`, userId),
      ]);
    } catch (e) { console.warn('[Redis] cleanupTestSession error:', e.message); }
  }

  // Generic cache methods
  async get(key) {
    const client = getRedisClient();
    if (!client) return null;
    try { return client.get(key); }
    catch (e) { console.warn('[Redis] get error:', e.message); return null; }
  }

  async set(key, value) {
    const client = getRedisClient();
    if (!client) return null;
    try { return client.set(key, value); }
    catch (e) { console.warn('[Redis] set error:', e.message); return null; }
  }

  async setex(key, seconds, value) {
    const client = getRedisClient();
    if (!client) return null;
    try { return client.setex(key, seconds, value); }
    catch (e) { console.warn('[Redis] setex error:', e.message); return null; }
  }

  async del(...keys) {
    const client = getRedisClient();
    if (!client) return null;
    try { return client.del(...keys); }
    catch (e) { console.warn('[Redis] del error:', e.message); return null; }
  }

  async keys(pattern) {
    const client = getRedisClient();
    if (!client) return [];
    try { return client.keys(pattern); }
    catch (e) { console.warn('[Redis] keys error:', e.message); return []; }
  }

  // Pub/sub methods
  async publish(channel, message) {
    const client = getRedisClient();
    if (!client) return null;
    try { return client.publish(channel, JSON.stringify(message)); }
    catch (e) { console.warn('[Redis] publish error:', e.message); return null; }
  }

  async subscribe(channel, callback) {
    const client = getRedisClient();
    if (!client) return () => {};
    try {
      const subClient = client.duplicate();
      await subClient.subscribe(channel);
      const messageHandler = (ch, message) => {
        if (ch === channel) {
          try { callback(JSON.parse(message)); }
          catch (error) { console.error('[Redis] Error parsing message:', error); }
        }
      };
      subClient.on('message', messageHandler);
      return async () => {
        subClient.off('message', messageHandler);
        await subClient.unsubscribe(channel);
        subClient.disconnect();
      };
    } catch (e) { console.warn('[Redis] subscribe error:', e.message); return () => {}; }
  }
}

// Export a lazy singleton instance
const redis = new RedisManager();
export { redis };
export default redis;

