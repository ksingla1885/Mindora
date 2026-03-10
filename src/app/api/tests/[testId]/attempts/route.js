import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// GET /api/tests/[testId]/attempts - Get user's attempts for a test
export async function GET(request, { params }) {
  const { testId } = await params;
  const session = await auth();

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
      attempts: attempts
    });
  } catch (error) {
    console.error('Error fetching test attempts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch test attempts' },
      { status: 500 }
    );
  }
}

// POST /api/tests/[testId]/attempts - Start a new test attempt
export async function POST(request, { params }) {
  const { testId } = await params;
  console.log(`[API] POST attempt for testId: ${testId}`);
  const session = await auth();

  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Check if test exists and is active
    const test = await prisma.test.findUnique({
      where: { id: testId }
    });

    if (!test) {
      return NextResponse.json(
        { success: false, error: 'Test not found' },
        { status: 404 }
      );
    }

    const now = new Date();

    // Check if user has already completed the test
    const completedAttempt = await prisma.testAttempt.findFirst({
      where: {
        testId,
        userId: session.user.id,
        status: 'submitted',
      }
    });

    if (completedAttempt && !test.allowMultipleAttempts) {
      return NextResponse.json(
        { success: false, error: 'Multiple attempts not allowed for this test.' },
        { status: 400 }
      );
    }

    // Check for existing in-progress attempt
    const inProgressAttempt = await prisma.testAttempt.findFirst({
      where: {
        testId,
        userId: session.user.id,
        status: { in: ['in-progress', 'in_progress'] },
        submittedAt: null,
      },
      include: {
        test: true
      }
    });

    if (inProgressAttempt) {
      // Calculate time remaining
      const startTime = new Date(inProgressAttempt.startedAt).getTime();
      const testDuration = inProgressAttempt.test?.durationMinutes || test.durationMinutes || 60;
      const durationMs = testDuration * 60 * 1000;
      const elapsedMs = Date.now() - startTime;
      const timeRemaining = Math.max(0, Math.floor((durationMs - elapsedMs) / 1000));

      return NextResponse.json({
        success: true,
        data: {
          ...inProgressAttempt,
          timeRemaining,
        },
        attempt: {
          ...inProgressAttempt,
          timeRemaining
        }
      });
    }

    // Get test questions for the initial details snapshot
    const testQuestions = await prisma.testQuestion.findMany({
      where: { testId },
      include: {
        question: true
      },
      orderBy: {
        sequence: 'asc',
      },
    });

    if (!testQuestions || testQuestions.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Test has no questions' },
        { status: 400 }
      );
    }

    // Filter out rows with missing question data
    const validQuestions = testQuestions.filter(tq => tq.question);
    
    if (validQuestions.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Test questions are missing content' },
        { status: 400 }
      );
    }

    // Create a new test attempt
    const attempt = await prisma.testAttempt.create({
      data: {
        testId,
        userId: session.user.id,
        startedAt: now,
        status: 'in_progress',
        answers: {},
        details: {
          questions: validQuestions.map((tq) => ({
            questionId: tq.questionId,
            text: tq.question.text,
            type: tq.question.type,
            options: tq.question.options,
            difficulty: tq.question.difficulty,
            marks: tq.marks || tq.question.marks || 1,
            answer: null,
          })),
          totalMarks: validQuestions.reduce(
            (sum, tq) => sum + (tq.marks || tq.question.marks || 1),
            0
          ),
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...attempt,
        timeRemaining: (test.durationMinutes || 60) * 60,
      },
      attempt: {
        ...attempt,
        timeRemaining: (test.durationMinutes || 60) * 60,
      }
    }, { status: 201 });

  } catch (error) {
    console.error(`[API] Error starting test attempt for test ${testId}:`, error);
    return NextResponse.json(
      { 
        success: false, 
        error: `Failed to start test attempt: ${error.message}`,
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
