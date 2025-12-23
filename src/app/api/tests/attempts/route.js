import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const prisma = new PrismaClient();

// POST /api/tests/attempts - Start a new test attempt
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { testId, startTime } = await request.json();

    // Check if test exists and is published
    const test = await prisma.test.findUnique({
      where: { id: testId, isPublished: true },
      include: {
        testQuestions: {
          include: {
            question: true,
          },
          orderBy: { sequence: 'asc' },
        },
      },
    });

    if (!test) {
      return NextResponse.json({ error: 'Test not found or not published' }, { status: 404 });
    }

    // Check if test has started
    if (test.startTime && new Date(test.startTime) > new Date()) {
      return NextResponse.json(
        { error: 'Test has not started yet' },
        { status: 400 }
      );
    }

    // Check if test has ended
    if (test.endTime && new Date(test.endTime) < new Date()) {
      return NextResponse.json(
        { error: 'Test has already ended' },
        { status: 400 }
      );
    }

    // Check if payment is required
    if (test.requiresPayment) {
      const hasPaid = await prisma.payment.findFirst({
        where: {
          userId: session.user.id,
          testId: test.id,
          status: 'completed',
        },
      });

      if (!hasPaid) {
        return NextResponse.json(
          { error: 'Payment required to take this test' },
          { status: 402 }
        );
      }
    }

    // Check for existing attempts
    if (!test.allowMultipleAttempts) {
      const existingAttempt = await prisma.testAttempt.findFirst({
        where: {
          testId,
          userId: session.user.id,
          status: { in: ['in_progress', 'submitted'] },
        },
      });

      if (existingAttempt) {
        if (existingAttempt.status === 'submitted') {
          return NextResponse.json(
            { error: 'You have already taken this test' },
            { status: 400 }
          );
        } else {
          // Resume existing in-progress attempt
          const questions = test.testQuestions.map(tq => ({
            id: tq.question.id,
            text: tq.question.text,
            type: tq.question.type,
            options: tq.question.options,
            marks: tq.question.marks,
          }));

          return NextResponse.json({
            attempt: existingAttempt,
            test: {
              ...test,
              questions,
              testQuestions: undefined, // Remove the joined data
            },
          });
        }
      }
    }

    // Create a new test attempt
    const attempt = await prisma.testAttempt.create({
      data: {
        testId,
        userId: session.user.id,
        startedAt: startTime || new Date(),
        status: 'in_progress',
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    // Return test data with questions
    const questions = test.testQuestions.map(tq => ({
      id: tq.question.id,
      text: tq.question.text,
      type: tq.question.type,
      options: tq.question.options,
      marks: tq.question.marks,
    }));

    return NextResponse.json({
      attempt,
      test: {
        ...test,
        questions,
        testQuestions: undefined, // Remove the joined data
      },
    });
  } catch (error) {
    console.error('Error starting test attempt:', error);
    return NextResponse.json(
      { error: 'Failed to start test attempt' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PATCH /api/tests/attempts/[id] - Update test attempt (e.g., save progress)
export async function PATCH(request, { params }) {
  const { id } = params;
  
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { answers, timeSpentSeconds } = await request.json();

    // Update the attempt
    const updatedAttempt = await prisma.testAttempt.update({
      where: { 
        id,
        userId: session.user.id, // Ensure user can only update their own attempts
        status: 'in_progress', // Only allow updating in-progress attempts
      },
      data: {
        answers,
        timeSpentSeconds,
        metadata: {
          lastSaved: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json(updatedAttempt);
  } catch (error) {
    console.error('Error updating test attempt:', error);
    return NextResponse.json(
      { error: 'Failed to update test attempt' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
