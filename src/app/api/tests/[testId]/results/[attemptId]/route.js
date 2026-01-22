import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function GET(request, { params }) {
  const session = await auth();

  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const { testId, attemptId } = params;
  const userId = session.user.id;

  try {
    // Get the test attempt with answers
    const attempt = await prisma.testAttempt.findUnique({
      where: {
        id: attemptId,
        testId,
        userId, // Ensure the attempt belongs to the current user
      },
      include: {
        test: {
          include: {
            questions: {
              include: {
                options: true
              },
              orderBy: { order: 'asc' },
            },
          },
        },
        answers: true,
      },
    });

    if (!attempt) {
      return NextResponse.json(
        { error: 'Test attempt not found' },
        { status: 404 }
      );
    }

    // Calculate results
    const totalQuestions = attempt.test.questions.length;
    let correctAnswers = 0;
    let score = 0;
    let maxScore = 0;
    let results = [];

    // Process each question
    attempt.test.questions.forEach(question => {
      const userAnswer = attempt.answers.find(a => a.questionId === question.id);
      const isCorrect = userAnswer && userAnswer.answer === question.correctAnswer;
      const points = isCorrect ? (question.points || 1) : 0;

      if (isCorrect) {
        correctAnswers++;
        score += points;
      }

      maxScore += (question.points || 1);

      results.push({
        questionId: question.id,
        questionText: question.text,
        questionType: question.type,
        userAnswer: userAnswer?.answer || null,
        correctAnswer: question.correctAnswer,
        isCorrect,
        points,
        maxPoints: question.points || 1,
        explanation: question.explanation,
      });
    });

    const percentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
    const passed = percentage >= (attempt.test.passingScore || 70);

    // Update the attempt with final score if not already submitted
    if (attempt.status === 'IN_PROGRESS') {
      await prisma.testAttempt.update({
        where: { id: attemptId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          score: percentage,
          passed,
          timeSpent: attempt.timeSpent,
        },
      });
    }

    // Prepare response
    const response = {
      attemptId: attempt.id,
      testId: attempt.testId,
      testTitle: attempt.test.title,
      startedAt: attempt.startedAt,
      completedAt: new Date(),
      timeSpent: attempt.timeSpent,
      totalQuestions,
      correctAnswers,
      score: percentage,
      maxScore: 100, // Percentage scale
      passed,
      passingScore: attempt.test.passingScore || 70,
      results,
      test: {
        id: attempt.test.id,
        title: attempt.test.title,
        description: attempt.test.description,
        durationMinutes: attempt.test.durationMinutes,
        passingScore: attempt.test.passingScore,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching test results:', error);
    return NextResponse.json(
      { error: 'Failed to fetch test results' },
      { status: 500 }
    );
  }
}
