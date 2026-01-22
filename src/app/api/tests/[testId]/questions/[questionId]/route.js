import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/auth';

const prisma = new PrismaClient();

// DELETE /api/tests/[testId]/questions/[questionId] - Remove a question from a test
export async function DELETE(request, { params }) {
  const { testId, questionId } = params;
  const session = await auth();

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Check if test exists and has no attempts
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

    if (test._count.attempts > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot modify a test that has attempts' },
        { status: 400 }
      );
    }

    // Delete the test question
    await prisma.testQuestion.delete({
      where: {
        testId_questionId: {
          testId,
          questionId,
        },
      },
    });

    // Update test's question count
    await prisma.test.update({
      where: { id: testId },
      data: {
        _count: {
          testQuestions: {
            decrement: 1,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Question removed from test',
    });
  } catch (error) {
    console.error('Error removing question from test:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Question not found in test' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to remove question from test' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PATCH /api/tests/[testId]/questions/[questionId] - Update question sequence or marks
export async function PATCH(request, { params }) {
  const { testId, questionId } = params;
  const session = await auth();

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { sequence, marks } = await request.json();

    if (sequence === undefined && marks === undefined) {
      return NextResponse.json(
        { success: false, error: 'Sequence or marks are required' },
        { status: 400 }
      );
    }

    // Check if test exists and has no attempts
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

    if (test._count.attempts > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot modify a test that has attempts' },
        { status: 400 }
      );
    }

    // Get the current test question
    const currentTestQuestion = await prisma.testQuestion.findUnique({
      where: {
        testId_questionId: {
          testId,
          questionId,
        },
      },
    });

    if (!currentTestQuestion) {
      return NextResponse.json(
        { success: false, error: 'Question not found in test' },
        { status: 404 }
      );
    }

    // CASE 1: Only updating marks (or sequence matches current)
    if (sequence === undefined || sequence === currentTestQuestion.sequence) {
      if (marks !== undefined) {
        const updatedTestQuestion = await prisma.testQuestion.update({
          where: { testId_questionId: { testId, questionId } },
          data: { marks: parseInt(marks) },
          include: { question: { include: { topic: { select: { id: true, name: true, subject: { select: { id: true, name: true } } } } } } },
        });
        return NextResponse.json({ success: true, data: updatedTestQuestion });
      }
      return NextResponse.json({ success: true, data: currentTestQuestion });
    }

    // CASE 2: Sequence update (and optionally marks)
    const updateData = { sequence };
    if (marks !== undefined) {
      updateData.marks = parseInt(marks);
    }

    await prisma.$transaction([
      // Update the sequence of other questions
      ...(sequence > currentTestQuestion.sequence
        ? [
          prisma.testQuestion.updateMany({
            where: {
              testId,
              sequence: {
                gt: currentTestQuestion.sequence,
                lte: sequence,
              },
            },
            data: {
              sequence: { decrement: 1 },
            },
          }),
        ]
        : [
          prisma.testQuestion.updateMany({
            where: {
              testId,
              sequence: {
                gte: sequence,
                lt: currentTestQuestion.sequence,
              },
            },
            data: {
              sequence: { increment: 1 },
            },
          }),
        ]),
      // Update the current question
      prisma.testQuestion.update({
        where: {
          testId_questionId: {
            testId,
            questionId,
          },
        },
        data: updateData,
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
      }),
    ]);

    // Get the final result
    const updatedTestQuestion = await prisma.testQuestion.findUnique({
      where: {
        testId_questionId: {
          testId,
          questionId,
        },
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
    });

    return NextResponse.json({
      success: true,
      data: updatedTestQuestion,
    });
  } catch (error) {
    console.error('Error updating test question:', error);
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'Sequence number clash' },
        { status: 400 }
      );
    }
    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Question not found in test' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to update test question' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
