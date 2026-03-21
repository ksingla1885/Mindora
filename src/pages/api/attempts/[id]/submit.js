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
  const { answers, timeSpent, flaggedQuestions, connectionStatus } = req.body;

  try {
    // Get the test attempt
    const attempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId },
      include: { test: true },
    });

    if (!attempt) {
      return res.status(404).json({ message: 'Test attempt not found' });
    }

    // Verify ownership
    if (attempt.userId !== session.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Calculate score
    const questions = await prisma.question.findMany({
      where: { testId: attempt.testId },
    });

    let correctAnswers = 0;
    const results = questions.map(question => {
      const isCorrect = answers[question.id] === question.correctAnswer;
      if (isCorrect) correctAnswers++;

      return {
        questionId: question.id,
        selectedAnswer: answers[question.id],
        correctAnswer: question.correctAnswer,
        isCorrect,
        timeSpent: timeSpent[question.id] || 0,
        isFlagged: !!flaggedQuestions[question.id],
      };
    });

    const score = questions.length > 0 ? Math.round((correctAnswers / questions.length) * 100) : 0;

    // Update the test attempt
    const updatedAttempt = await prisma.testAttempt.update({
      where: { id: attemptId },
      data: {
        status: 'COMPLETED',
        score,
        completedAt: new Date(),
        answers: answers,
        timeSpent: timeSpent,
        metadata: {
          ...(attempt.metadata || {}),
          connectionStatus,
          flaggedQuestions,
        },
      },
    });

    // Clean up Redis data (best-effort, non-blocking)
    await redis.cleanupTestSession(attempt.testId, session.user.id);

    return res.status(200).json({
      success: true,
      attemptId: updatedAttempt.id,
      score,
      correctAnswers,
      totalQuestions: questions.length,
      results,
      completedAt: updatedAttempt.completedAt,
    });

  } catch (error) {
    console.error('Test submission error:', error);
    return res.status(500).json({
      message: 'Internal server error',
      error: error.message,
    });
  }
}
