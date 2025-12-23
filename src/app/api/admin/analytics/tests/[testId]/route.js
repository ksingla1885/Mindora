import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const prisma = new PrismaClient();

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { testId } = params;

    // Get basic test information
    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: {
        questions: {
          include: {
            question: true,
          },
          orderBy: { sequence: 'asc' },
        },
        attempts: {
          where: { status: 'COMPLETED' },
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    if (!test) {
      return NextResponse.json(
        { error: 'Test not found' },
        { status: 404 }
      );
    }

    // Calculate question statistics
    const questionStats = test.questions.map(q => {
      const attempts = test.attempts.filter(a => {
        const attempt = a.responses.find(r => r.questionId === q.questionId);
        return attempt && attempt.answer !== null;
      });

      const correctAttempts = attempts.filter(a => {
        const attempt = a.responses.find(r => r.questionId === q.questionId);
        return attempt.isCorrect;
      });

      const difficulty = q.question.difficulty || 'medium';
      const timeSpent = attempts.reduce((sum, a) => {
        const attempt = a.responses.find(r => r.questionId === q.questionId);
        return sum + (attempt?.timeSpent || 0);
      }, 0) / (attempts.length || 1);

      return {
        id: q.questionId,
        sequence: q.sequence,
        difficulty,
        totalAttempts: attempts.length,
        correctAttempts: correctAttempts.length,
        accuracy: attempts.length > 0 ? (correctAttempts.length / attempts.length) * 100 : 0,
        averageTimeSpent: Math.round(timeSpent * 100) / 100,
        commonWrongAnswers: getCommonWrongAnswers(test.attempts, q.questionId, q.question.correctAnswer)
      };
    });

    // Calculate overall test statistics
    const totalAttempts = test.attempts.length;
    const averageScore = totalAttempts > 0 
      ? test.attempts.reduce((sum, a) => sum + a.score, 0) / totalAttempts 
      : 0;
    
    const completionRate = test.attempts.length > 0 
      ? (test.attempts.filter(a => a.status === 'COMPLETED').length / test.attempts.length) * 100 
      : 0;

    // Calculate time statistics
    const timeStats = test.attempts
      .filter(a => a.timeSpent)
      .reduce((stats, a) => {
        stats.times.push(a.timeSpent);
        stats.totalTime += a.timeSpent;
        return stats;
      }, { times: [], totalTime: 0 });

    const averageTimeSpent = timeStats.times.length > 0 
      ? timeStats.totalTime / timeStats.times.length 
      : 0;

    // Calculate score distribution
    const scoreDistribution = Array(11).fill(0); // 0-10, 10-20, ..., 90-100
    test.attempts.forEach(attempt => {
      const bucket = Math.floor((attempt.score / test.totalMarks) * 10);
      const index = Math.min(bucket, 9); // Cap at 90-100%
      scoreDistribution[index]++;
    });

    // Calculate question difficulty analysis
    const difficultyStats = {
      easy: { total: 0, correct: 0 },
      medium: { total: 0, correct: 0 },
      hard: { total: 0, correct: 0 }
    };

    test.questions.forEach(q => {
      const difficulty = q.question.difficulty?.toLowerCase() || 'medium';
      if (difficultyStats[difficulty]) {
        const attempts = test.attempts.filter(a => {
          const attempt = a.responses.find(r => r.questionId === q.questionId);
          return attempt && attempt.answer !== null;
        });
        const correct = attempts.filter(a => {
          const attempt = a.responses.find(r => r.questionId === q.questionId);
          return attempt?.isCorrect;
        });
        difficultyStats[difficulty].total += attempts.length;
        difficultyStats[difficulty].correct += correct.length;
      }
    });

    // Prepare response
    const response = {
      test: {
        id: test.id,
        title: test.title,
        totalMarks: test.totalMarks,
        duration: test.durationMinutes,
        startTime: test.startTime,
        endTime: test.endTime,
        totalQuestions: test.questions.length,
        totalAttempts,
        averageScore: Math.round(averageScore * 100) / 100,
        completionRate: Math.round(completionRate * 100) / 100,
        averageTimeSpent: Math.round(averageTimeSpent * 100) / 100,
        questionStats,
        scoreDistribution,
        difficultyStats: Object.entries(difficultyStats).map(([difficulty, stats]) => ({
          difficulty,
          total: stats.total,
          correct: stats.correct,
          accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0
        })),
        recentAttempts: test.attempts
          .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
          .slice(0, 5)
          .map(a => ({
            id: a.id,
            userId: a.user.id,
            userName: a.user.name,
            userEmail: a.user.email,
            score: a.score,
            submittedAt: a.submittedAt,
            timeSpent: a.timeSpent
          }))
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching test analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch test analytics' },
      { status: 500 }
    );
  }
}

// Helper function to find common wrong answers
function getCommonWrongAnswers(attempts, questionId, correctAnswer) {
  const wrongAnswers = new Map();
  
  attempts.forEach(attempt => {
    const response = attempt.responses.find(r => r.questionId === questionId);
    if (response && !response.isCorrect && response.answer !== null) {
      const answer = String(response.answer);
      wrongAnswers.set(answer, (wrongAnswers.get(answer) || 0) + 1);
    }
  });

  return Array.from(wrongAnswers.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3) // Top 3 most common wrong answers
    .map(([answer, count]) => ({
      answer,
      count,
      isCorrect: answer === String(correctAnswer)
    }));
}
