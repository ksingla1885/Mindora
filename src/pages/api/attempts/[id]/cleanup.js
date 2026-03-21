import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import redis from '@/lib/redis';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const session = await auth(req, res);

  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { id: attemptId } = req.query;

  try {
    const attempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId },
    });

    if (!attempt) {
      return res.status(404).json({ message: 'Test attempt not found' });
    }

    if (attempt.userId !== session.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Clean up Redis data (best-effort via our safe singleton)
    await redis.cleanupTestSession(attempt.testId, session.user.id);

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
