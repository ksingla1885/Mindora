import redis from '@/lib/redis';

// Test Session Manager — handles Redis-backed test state for socket rooms
class TestSessionManager {
  constructor(io) {
    this.io = io;
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`[Socket] Client connected: ${socket.id}`);

      // Join test room
      socket.on('join-test', async ({ testId, userId }) => {
        socket.join(`test:${testId}`);
        socket.join(`user:${userId}`);

        // Update active users (best-effort, non-blocking)
        await redis.addUserToTestSession(testId, userId);

        // Notify others
        socket.to(`test:${testId}`).emit('user-joined', { userId });
      });

      // Handle answer updates
      socket.on('update-answer', async ({ testId, questionId, answer, userId }) => {
        // Store answer in Redis (best-effort)
        await redis.saveAnswer(testId, userId, questionId, answer);

        // Broadcast to proctors/admins in the same room
        socket.to(`test:${testId}`).emit('test-update', {
          type: 'answer-update',
          userId,
          questionId,
          answer,
        });
      });

      // Handle disconnection
      socket.on('disconnect', async () => {
        console.log(`[Socket] Client disconnected: ${socket.id}`);
        // Clean up any open test sessions if needed
      });
    });
  }

  // Get test session data
  async getTestSession(testId, userId) {
    const [answers, timeSpent] = await Promise.all([
      redis.getAnswers(testId, userId),
      redis.getTimeSpent(testId, userId),
    ]);

    return { answers, timeSpent };
  }

  // Clean up test session
  async cleanupTestSession(testId, userId) {
    await redis.cleanupTestSession(testId, userId);
  }
}

let testSessionManager = null;

export function initTestSession(io) {
  if (!testSessionManager) {
    testSessionManager = new TestSessionManager(io);
  }
  return testSessionManager;
}

export function getTestSessionManager() {
  if (!testSessionManager) {
    throw new Error('TestSessionManager not initialized');
  }
  return testSessionManager;
}

