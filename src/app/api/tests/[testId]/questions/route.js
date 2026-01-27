import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/auth';

const prisma = new PrismaClient();

// GET /api/tests/[testId]/questions - Get all questions for a test
export async function GET(request, { params }) {
  const { testId } = await params;

  try {
    const testQuestions = await prisma.testQuestion.findMany({
      where: { testId },
      include: {
        question: {
          include: {
            topic: {
              select: {
                id: true,
                name: true,
                subject: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        sequence: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      data: testQuestions,
    });
  } catch (error) {
    console.error('Error fetching test questions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch test questions' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST /api/tests/[testId]/questions - Add questions to a test
export async function POST(request, { params }) {
  const { testId } = await params;
  const session = await auth();

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    console.log(`[API] Adding questions to test ${testId}. Body:`, JSON.stringify(body));
    const { questionIds } = body;

    if (!Array.isArray(questionIds) || questionIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one question ID is required' },
        { status: 400 }
      );
    }

    // Check if test exists and is not yet started
    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: {
        _count: {
          select: { attempts: true },
        },
      },
    });

    if (!test) {
      return NextResponse.json(
        { success: false, error: 'Test not found' },
        { status: 404 }
      );
    }

    // Restriction removed to allow admins to add questions to active tests if needed.
    /*
    if (test._count.attempts > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot modify a test that has attempts' },
        { status: 400 }
      );
    }
    */

    // Get current max sequence to append new questions
    const lastQuestion = await prisma.testQuestion.findFirst({
      where: { testId },
      orderBy: { sequence: 'desc' },
      select: { sequence: true },
    });

    let nextSequence = lastQuestion ? lastQuestion.sequence + 1 : 1;

    // Check if questions exist and are not already in the test
    const existingQuestions = await prisma.testQuestion.findMany({
      where: {
        testId,
        questionId: { in: questionIds },
      },
      select: {
        questionId: true,
      },
    });

    const existingQuestionIds = new Set(existingQuestions.map(q => q.questionId));
    const newQuestionIds = questionIds.filter(id => !existingQuestionIds.has(id));

    if (newQuestionIds.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All questions already exist in the test',
        data: [],
      });
    }

    // Add new questions to the test
    const testQuestions = await prisma.$transaction(
      newQuestionIds.map((questionId, index) =>
        prisma.testQuestion.create({
          data: {
            testId,
            questionId,
            sequence: nextSequence + index,
          },
          include: {
            question: {
              include: {
                topic: {
                  select: {
                    id: true,
                    name: true,
                    subject: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        })
      )
    );

    // No need to manually update _count, it is computed dynamically by Prisma
    /*
    await prisma.test.update({
      where: { id: testId },
      data: {
        _count: {
          testQuestions: {
            increment: testQuestions.length,
          },
        },
      },
    });
    */

    return NextResponse.json({
      success: true,
      data: testQuestions,
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding questions to test:', error);

    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'One or more questions already exist in the test' },
        { status: 400 }
      );
    }

    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'One or more questions not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to add questions to test' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
