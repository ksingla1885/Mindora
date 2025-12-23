import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';

const prisma = new PrismaClient();

// Initialize Redis client
const redis = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

// Connect to Redis
await redis.connect();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { id: attemptId } = req.query;

  try {
    // Get the test attempt
    const attempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId },
    });

    if (!attempt) {
      return res.status(404).json({ message: 'Test attempt not found' });
    }

    // Verify ownership
    if (attempt.userId !== session.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Clean up Redis data
    await redis.del(`test:${attempt.testId}:${session.user.id}:answers`);
    await redis.del(`test:${attempt.testId}:${session.user.id}:time`);
    await redis.sRem(`test:${attempt.testId}:users`, session.user.id);

    return res.status(200).json({
      success: true,
      message: 'Session data cleaned up successfully',
    });

  } catch (error) {
    console.error('Cleanup error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to clean up session data',
      error: error.message,
    });
  }
}
