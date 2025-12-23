import { Server } from 'socket.io';
import { createClient } from 'redis';
import { RedisPubSub } from '@redis/pubsub';

class TestSessionManager {
  constructor(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL,
        methods: ['GET', 'POST'],
      },
    });
    
    this.redis = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });
    
    this.pubClient = this.redis.duplicate();
    this.subClient = this.redis.duplicate();
    this.pubsub = new RedisPubSub({
      publisher: this.pubClient,
      subscriber: this.subClient,
    });
    
    this.initialize();
  }
  
  async initialize() {
    await Promise.all([
      this.redis.connect(),
      this.pubClient.connect(),
      this.subClient.connect(),
    ]);
    
    this.setupEventHandlers();
    console.log('Test Session Manager initialized');
  }
  
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);
      
      // Join test room
      socket.on('join-test', async ({ testId, userId }) => {
        socket.join(`test:${testId}`);
        socket.join(`user:${userId}`);
        
        // Update active users in Redis
        await this.redis.sAdd(`test:${testId}:users`, userId);
        await this.redis.expire(`test:${testId}:users`, 60 * 60 * 24); // 24h TTL
        
        // Notify others
        socket.to(`test:${testId}`).emit('user-joined', { userId });
      });
      
      // Handle answer updates
      socket.on('update-answer', async ({ testId, questionId, answer, userId }) => {
        // Validate user has access to this test
        const hasAccess = await this.redis.sIsMember(`test:${testId}:users`, userId);
        if (!hasAccess) return;
        
        // Store answer in Redis
        await this.redis.hSet(
          `test:${testId}:${userId}:answers`,
          questionId,
          JSON.stringify({
            answer,
            timestamp: Date.now(),
          })
        );
        
        // Publish update
        await this.pubsub.publish(
          `test:${testId}:updates`,
          JSON.stringify({
            type: 'answer-update',
            userId,
            questionId,
            answer,
          })
        );
      });
      
      // Handle disconnection
      socket.on('disconnect', async () => {
        console.log(`Client disconnected: ${socket.id}`);
        // Clean up any test sessions if needed
      });
    });
    
    // Subscribe to Redis pub/sub
    this.pubsub.subscribe('test:*:updates', (message) => {
      try {
        const { testId } = message.match(/test:(.*):updates/);
        const data = JSON.parse(message);
        this.io.to(`test:${testId}`).emit('test-update', data);
      } catch (error) {
        console.error('Error processing pub/sub message:', error);
      }
    });
  }
  
  // Get test session data
  async getTestSession(testId, userId) {
    const [answers, timeSpent] = await Promise.all([
      this.redis.hGetAll(`test:${testId}:${userId}:answers`),
      this.redis.hGetAll(`test:${testId}:${userId}:time`),
    ]);
    
    return {
      answers: Object.entries(answers).reduce((acc, [key, value]) => ({
        ...acc,
        [key]: JSON.parse(value),
      }), {}),
      timeSpent: Object.entries(timeSpent).reduce((acc, [key, value]) => ({
        ...acc,
        [key]: parseInt(value, 10),
      }), {}),
    };
  }
  
  // Clean up test session
  async cleanupTestSession(testId, userId) {
    await Promise.all([
      this.redis.del(`test:${testId}:${userId}:answers`),
      this.redis.del(`test:${testId}:${userId}:time`),
      this.redis.sRem(`test:${testId}:users`, userId),
    ]);
  }
}

let testSessionManager = null;

export function initTestSession(server) {
  if (!testSessionManager) {
    testSessionManager = new TestSessionManager(server);
  }
  return testSessionManager;
}

export function getTestSessionManager() {
  if (!testSessionManager) {
    throw new Error('TestSessionManager not initialized');
  }
  return testSessionManager;
}
