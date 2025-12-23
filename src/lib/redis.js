import Redis from 'ioredis';
import { redisConfig } from '@/config/redis';

class RedisManager {
  constructor() {
    this.client = null;
    this.pubClient = null;
    this.subClient = null;
    this.isConnected = false;
    this.initialize();
  }

  initialize() {
    // Create main client
    this.client = new Redis({
      host: redisConfig.host,
      port: redisConfig.port,
      password: redisConfig.password,
      db: redisConfig.db,
      keyPrefix: redisConfig.keyPrefix,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    // Create pub/sub clients
    this.pubClient = this.client.duplicate();
    this.subClient = this.client.duplicate();

    // Set up event handlers
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    // Connection events
    this.client.on('connect', () => {
      console.log('Redis client connected');
      this.isConnected = true;
    });

    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
      this.isConnected = false;
    });

    // Error handling for pub/sub clients
    this.pubClient.on('error', (err) => {
      console.error('Redis Pub Client Error:', err);
    });

    this.subClient.on('error', (err) => {
      console.error('Redis Sub Client Error:', err);
    });
  }

  // Test session methods
  async saveAnswer(testId, userId, questionId, answer) {
    const key = `test:${testId}:${userId}:answers`;
    return this.client.hset(key, questionId, JSON.stringify({
      answer,
      timestamp: Date.now(),
    }));
  }

  async getAnswers(testId, userId) {
    const key = `test:${testId}:${userId}:answers`;
    const answers = await this.client.hgetall(key);
    
    return Object.entries(answers).reduce((acc, [qId, data]) => ({
      ...acc,
      [qId]: JSON.parse(data),
    }), {});
  }

  async updateTimeSpent(testId, userId, questionId, seconds) {
    const key = `test:${testId}:${userId}:time`;
    return this.client.hincrby(key, questionId, seconds);
  }

  async getTimeSpent(testId, userId) {
    const key = `test:${testId}:${userId}:time`;
    const timeSpent = await this.client.hgetall(key);
    
    return Object.entries(timeSpent).reduce((acc, [qId, seconds]) => ({
      ...acc,
      [qId]: parseInt(seconds, 10),
    }), {});
  }

  async addUserToTestSession(testId, userId) {
    const key = `test:${testId}:users`;
    await this.client.sadd(key, userId);
    return this.client.expire(key, 60 * 60 * 24); // 24h TTL
  }

  async removeUserFromTestSession(testId, userId) {
    const key = `test:${testId}:users`;
    return this.client.srem(key, userId);
  }

  async getTestSessionUsers(testId) {
    const key = `test:${testId}:users`;
    return this.client.smembers(key);
  }

  async cleanupTestSession(testId, userId) {
    await Promise.all([
      this.client.del(`test:${testId}:${userId}:answers`),
      this.client.del(`test:${testId}:${userId}:time`),
      this.client.srem(`test:${testId}:users`, userId),
    ]);
  }

  // Pub/sub methods
  async publish(channel, message) {
    return this.pubClient.publish(channel, JSON.stringify(message));
  }

  async subscribe(channel, callback) {
    await this.subClient.subscribe(channel);
    
    const messageHandler = (ch, message) => {
      if (ch === channel) {
        try {
          callback(JSON.parse(message));
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      }
    };
    
    this.subClient.on('message', messageHandler);
    
    // Return unsubscribe function
    return async () => {
      this.subClient.off('message', messageHandler);
      await this.subClient.unsubscribe(channel);
    };
  }
}

// Create and export a singleton instance
const redis = new RedisManager();

export default redis;
