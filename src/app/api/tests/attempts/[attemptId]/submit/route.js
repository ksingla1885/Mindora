import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const prisma = new PrismaClient();

// POST /api/tests/attempts/[id]/submit - Submit a test attempt
export async function POST(request, { params }) {
  const { id } = params;
  
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { answers, submittedAt } = await request.json();

    // Get the attempt with test details
    const attempt = await prisma.testAttempt.findUnique({
      where: { 
        id,
        userId: session.user.id, // Ensure user can only submit their own attempts
        status: 'in_progress', // Only allow submitting in-progress attempts
      },
      include: {
        test: {
          include: {
            testQuestions: {
              include: {
                question: true,
              },
            },
          },
        },
      },
    });

    if (!attempt) {
      return NextResponse.json(
        { error: 'Attempt not found or already submitted' },
        { status: 404 }
      );
    }

    // Calculate score
    let score = 0;
    let totalMarks = 0;
    const results = [];

    attempt.test.testQuestions.forEach(tq => {
      const question = tq.question;
      const userAnswer = answers[question.id];
      let isCorrect = false;
      let marksObtained = 0;

      if (question.type === 'mcq' && userAnswer !== undefined) {
        isCorrect = question.correctAnswer === userAnswer;
        marksObtained = isCorrect ? question.marks : 0;
      } else if (question.type === 'subjective') {
        // For subjective questions, we'll need manual grading
        marksObtained = 0; // Default to 0, to be updated by teacher
      }

      score += marksObtained;
      totalMarks += question.marks;

      results.push({
        questionId: question.id,
        questionText: question.text,
        correctAnswer: question.type === 'mcq' ? question.correctAnswer : null,
        userAnswer,
        isCorrect,
        marks: question.marks,
        marksObtained,
        feedback: isCorrect ? 'Correct!' : 'Incorrect',
      });
    });

    const percentage = totalMarks > 0 ? (score / totalMarks) * 100 : 0;
    const isPassed = attempt.test.passingScore ? percentage >= attempt.test.passingScore : null;

    // Update the attempt with submission details
    const updatedAttempt = await prisma.testAttempt.update({
      where: { id },
      data: {
        answers,
        results,
        score,
        percentage,
        isPassed,
        status: 'submitted',
        submittedAt: submittedAt || new Date(),
        finishedAt: new Date(),
        timeSpentSeconds: Math.floor((new Date() - new Date(attempt.startedAt)) / 1000),
        metadata: {
          ...(attempt.metadata || {}),
          submittedAt: new Date().toISOString(),
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
        },
      },
    });

    // Update user's test history and stats
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        testAttemptsCount: { increment: 1 },
        ...(isPassed && { passedTestsCount: { increment: 1 } }),
      },
    });

    return NextResponse.json(updatedAttempt);
  } catch (error) {
    console.error('Error submitting test attempt:', error);
    return NextResponse.json(
      { error: 'Failed to submit test attempt' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
