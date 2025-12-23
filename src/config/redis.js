export const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || '',
  db: process.env.REDIS_DB || 0,
  keyPrefix: process.env.REDIS_PREFIX || 'mindora:',
  ttl: 60 * 60 * 24 * 30, // 30 days default TTL
};
