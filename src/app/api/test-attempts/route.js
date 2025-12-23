import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function POST(request) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { testId } = await request.json();
    const userId = session.user.id;

    // Verify test exists and is published
    const test = await prisma.test.findUnique({
      where: { 
        id: testId,
        isPublished: true,
      },
      include: {
        testQuestions: {
          include: {
            question: true,
          },
          orderBy: {
            sequence: 'asc',
          },
        },
      },
    });

    if (!test) {
      return NextResponse.json(
        { error: 'Test not found or not published' },
        { status: 404 }
      );
    }

    // Check if test has started
    const now = new Date();
    if (test.startTime && new Date(test.startTime) > now) {
      return NextResponse.json(
        { error: 'Test has not started yet' },
        { status: 400 }
      );
    }

    // Check if test has ended
    if (test.endTime && new Date(test.endTime) < now) {
      return NextResponse.json(
        { error: 'Test has ended' },
        { status: 400 }
      );
    }

    // Check if user already has an active attempt
    const existingAttempt = await prisma.testAttempt.findFirst({
      where: {
        testId,
        userId,
        submittedAt: null,
        finishedAt: null,
      },
      orderBy: {
        startedAt: 'desc',
      },
    });

    if (existingAttempt) {
      return NextResponse.json({
        attempt: existingAttempt,
        message: 'Resuming existing attempt',
      });
    }

    // Check if multiple attempts are allowed
    if (!test.allowMultipleAttempts) {
      const previousAttempt = await prisma.testAttempt.findFirst({
        where: {
          testId,
          userId,
          OR: [
            { submittedAt: { not: null } },
            { finishedAt: { not: null } },
          ],
        },
      });

      if (previousAttempt) {
        return NextResponse.json(
          { error: 'You have already taken this test and multiple attempts are not allowed' },
          { status: 400 }
        );
      }
    }

    // Check if test requires payment
    if (test.isPaid && test.price > 0) {
      const hasPaid = await prisma.payment.findFirst({
        where: {
          testId,
          userId,
          status: 'captured',
        },
      });

      if (!hasPaid) {
        return NextResponse.json(
          { error: 'Payment required to take this test' },
          { status: 402 }
        );
      }
    }

    // Create a new test attempt
    const attempt = await prisma.testAttempt.create({
      data: {
        testId,
        userId,
        startedAt: new Date(),
        status: 'started',
      },
    });

    return NextResponse.json({
      attempt,
      test: {
        id: test.id,
        title: test.title,
        description: test.description,
        durationMinutes: test.durationMinutes,
        instructions: test.instructions,
        autoSubmit: test.autoSubmit,
      },
      questions: test.testQuestions.map((tq) => ({
        id: tq.question.id,
        text: tq.question.text,
        type: tq.question.type,
        options: tq.question.options,
        marks: tq.marks,
        difficulty: tq.question.difficulty,
        imageUrl: tq.question.imageUrl,
      })),
    });
  } catch (error) {
    console.error('Error starting test attempt:', error);
    return NextResponse.json(
      { error: 'Failed to start test attempt' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const testId = searchParams.get('testId');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const skip = (page - 1) * limit;

    const where = {
      userId: session.user.id,
    };

    if (testId) {
      where.testId = testId;
    }

    if (status) {
      where.status = status;
    }

    const [attempts, total] = await Promise.all([
      prisma.testAttempt.findMany({
        where,
        include: {
          test: {
            select: {
              id: true,
              title: true,
              durationMinutes: true,
            },
          },
        },
        orderBy: {
          startedAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.testAttempt.count({ where }),
    ]);

    return NextResponse.json({
      attempts,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching test attempts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch test attempts' },
      { status: 500 }
    );
  }
}
