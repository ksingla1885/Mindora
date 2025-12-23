import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const prisma = new PrismaClient();

// GET /api/tests/[testId]/attempts - Get user's attempts for a test
export async function GET(request, { params }) {
  const { testId } = params;
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const attempts = await prisma.testAttempt.findMany({
      where: {
        testId,
        userId: session.user.id,
      },
      orderBy: {
        startedAt: 'desc',
      },
      include: {
        test: {
          select: {
            title: true,
            durationMinutes: true,
            startTime: true,
            endTime: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: attempts,
    });
  } catch (error) {
    console.error('Error fetching test attempts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch test attempts' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST /api/tests/[testId]/attempts - Start a new test attempt
export async function POST(request, { params }) {
  const { testId } = params;
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Check if test exists and is active
    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: {
        _count: {
          select: {
            testQuestions: true,
          },
        },
      },
    });

    if (!test) {
      return NextResponse.json(
        { success: false, error: 'Test not found' },
        { status: 404 }
      );
    }

    const now = new Date();
    
    // Check if test is available
    if (test.startTime > now) {
      return NextResponse.json(
        { success: false, error: 'Test has not started yet' },
        { status: 400 }
      );
    }
    
    if (test.endTime < now) {
      return NextResponse.json(
        { success: false, error: 'Test has ended' },
        { status: 400 }
      );
    }

    // Check if user has already completed the test
    const existingAttempt = await prisma.testAttempt.findFirst({
      where: {
        testId,
        userId: session.user.id,
        finishedAt: { not: null },
      },
    });

    if (existingAttempt) {
      return NextResponse.json(
        { success: false, error: 'You have already completed this test' },
        { status: 400 }
      );
    }

    // Check for existing in-progress attempt
    const inProgressAttempt = await prisma.testAttempt.findFirst({
      where: {
        testId,
        userId: session.user.id,
        finishedAt: null,
      },
    });

    if (inProgressAttempt) {
      // Calculate time remaining
      const timeElapsed = Math.floor((now - inProgressAttempt.startedAt) / 1000 / 60); // in minutes
      const timeRemaining = Math.max(0, test.durationMinutes - timeElapsed);
      
      return NextResponse.json({
        success: true,
        data: {
          ...inProgressAttempt,
          timeRemaining,
        },
      });
    }

    // For paid tests, check if user has access
    if (test.isPaid) {
      const hasAccess = await prisma.payment.findFirst({
        where: {
          userId: session.user.id,
          testId,
          status: 'completed',
        },
      });

      if (!hasAccess) {
        return NextResponse.json(
          { success: false, error: 'Payment required to access this test' },
          { status: 402 } // Payment Required
        );
      }
    }

    // Get test questions
    const testQuestions = await prisma.testQuestion.findMany({
      where: { testId },
      include: {
        question: {
          select: {
            id: true,
            text: true,
            type: true,
            options: true,
            difficulty: true,
            marks: true,
          },
        },
      },
      orderBy: {
        sequence: 'asc',
      },
    });

    if (testQuestions.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Test has no questions' },
        { status: 400 }
      );
    }

    // Create a new test attempt
    const attempt = await prisma.testAttempt.create({
      data: {
        testId,
        userId: session.user.id,
        startedAt: now,
        details: {
          questions: testQuestions.map((tq) => ({
            questionId: tq.questionId,
            text: tq.question.text,
            type: tq.question.type,
            options: tq.question.options,
            difficulty: tq.question.difficulty,
            marks: tq.question.marks,
            answer: null,
            isCorrect: null,
            marksObtained: 0,
          })),
          totalMarks: testQuestions.reduce(
            (sum, tq) => sum + (tq.question.marks || 1),
            0
          ),
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...attempt,
        timeRemaining: test.durationMinutes,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error starting test attempt:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'You already have an active attempt' },
        { status: 400 }
      );
    }
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Test not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to start test attempt' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
