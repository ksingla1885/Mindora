import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/auth';

const prisma = new PrismaClient();

// GET /api/tests/[testId] - Get a single test with questions
export async function GET(request, { params }) {
  const { testId } = await params;
  const session = await auth();

  try {
    // Configure query include
    const includeConfig = {
      olympiad: {
        select: {
          id: true,
          name: true,
        },
      },
      testQuestions: {
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
      },
      _count: {
        select: {
          attempts: true,
        },
      },
    };

    if (session?.user?.id) {
      includeConfig.attempts = {
        where: {
          userId: session.user.id
        },
        select: {
          id: true,
          status: true,
          submittedAt: true
        }
      };
    }

    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: includeConfig,
    });

    if (!test) {
      return NextResponse.json(
        { success: false, error: 'Test not found' },
        { status: 404 }
      );
    }

    let isPurchased = false;
    if (session && session.user) {
      if (!test.isPaid || test.price === 0) {
        isPurchased = true;
      } else {
        const payment = await prisma.payment.findFirst({
          where: {
            userId: session.user.id,
            testId: testId,
            status: 'CAPTURED',
          },
        });
        if (payment) {
          isPurchased = true;
        }
      }
    }

    // Determine user status
    let userStatus = 'NOT_STARTED';
    if (session?.user?.id && test.attempts && test.attempts.length > 0) {
      const hasSubmitted = test.attempts.some(a => a.status === 'submitted');
      const hasInProgress = test.attempts.some(a => a.status === 'in_progress');

      if (hasSubmitted) {
        userStatus = 'COMPLETED';
      } else if (hasInProgress) {
        userStatus = 'IN_PROGRESS';
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...test,
        isPurchased,
        userStatus,
      },
    });
  } catch (error) {
    console.error('Error fetching test:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch test' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PATCH /api/tests/[testId] - Update a test
export async function PATCH(request, { params }) {
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

    // Check if test exists and is not yet started
    const existingTest = await prisma.test.findUnique({
      where: { id: testId },
      include: {
        _count: {
          select: { attempts: true },
        },
      },
    });

    if (!existingTest) {
      return NextResponse.json(
        { success: false, error: 'Test not found' },
        { status: 404 }
      );
    }

    // Prevent updating if test has attempts
    if (existingTest._count.attempts > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot update a test that has attempts' },
        { status: 400 }
      );
    }

    // Build update data
    const updateData = { ...body };

    // Handle date conversions
    if (body.startTime) updateData.startTime = new Date(body.startTime);
    if (body.endTime) updateData.endTime = new Date(body.endTime);

    // Validate dates if both are provided
    if (updateData.startTime && updateData.endTime && updateData.startTime >= updateData.endTime) {
      return NextResponse.json(
        { success: false, error: 'End time must be after start time' },
        { status: 400 }
      );
    }

    // Validate price for paid tests
    if (body.isPaid && (!body.price || body.price <= 0)) {
      return NextResponse.json(
        { success: false, error: 'Price is required for paid tests' },
        { status: 400 }
      );
    }

    // Update the test
    const updatedTest = await prisma.test.update({
      where: { id: testId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: updatedTest,
    });
  } catch (error) {
    console.error('Error updating test:', error);

    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'A test with similar details already exists' },
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
      { success: false, error: 'Failed to update test' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE /api/tests/[testId] - Delete a test
export async function DELETE(request, { params }) {
  const { testId } = await params;
  const session = await auth();

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Check if test has attempts
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

    // Delete all attempts associated with the test
    await prisma.testAttempt.deleteMany({
      where: { testId },
    });

    // Delete test questions first (due to foreign key constraint)
    await prisma.testQuestion.deleteMany({
      where: { testId },
    });

    // Then delete the test
    await prisma.test.delete({
      where: { id: testId },
    });

    return NextResponse.json({
      success: true,
      message: 'Test deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting test:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Test not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to delete test' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
