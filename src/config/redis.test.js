import { redisConfig } from './redis';

export const testRedisConfig = {
  ...redisConfig,
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  // Use a different database for tests
  db: 15,
  // Disable Redis commands that modify data in tests
  enableOfflineQueue: false,
  // Faster failover in tests
  retryStrategy: () => null,
} as const;
