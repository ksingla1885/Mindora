import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const prisma = new PrismaClient();

export async function POST(request, { params }) {
  const { testId } = params;
  
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { action } = await request.json();
    const userId = session.user.id;

    // Check if user has already started an attempt
    const existingAttempt = await prisma.testAttempt.findFirst({
      where: {
        testId,
        userId,
        status: 'IN_PROGRESS'
      },
      orderBy: {
        startedAt: 'desc'
      }
    });

    // Resume existing attempt if available and not expired
    if (existingAttempt) {
      const test = await prisma.test.findUnique({
        where: { id: testId },
        select: { duration: true }
      });

      if (!test) {
        return NextResponse.json(
          { error: 'Test not found' },
          { status: 404 }
        );
      }

      // Check if attempt is expired
      const endTime = new Date(existingAttempt.startedAt.getTime() + test.duration * 60 * 1000);
      if (new Date() > endTime) {
        // Auto-submit expired attempt
        await prisma.testAttempt.update({
          where: { id: existingAttempt.id },
          data: {
            status: 'COMPLETED',
            submittedAt: new Date(),
            // Calculate score here if needed
          }
        });
      } else {
        // Return existing attempt
        return NextResponse.json(existingAttempt);
      }
    }

    // Create new attempt if no valid existing attempt
    if (action === 'start') {
      // Check if test exists and is active
      const test = await prisma.test.findUnique({
        where: { 
          id: testId,
          isActive: true
        },
        select: { 
          id: true,
          duration: true,
          startTime: true,
          endTime: true
        }
      });

      if (!test) {
        return NextResponse.json(
          { error: 'Test not found or not active' },
          { status: 404 }
        );
      }

      // Check if test is available for the user's class
      // Add your class-based access logic here if needed

      // Check if test is within allowed time window
      const now = new Date();
      if (test.startTime && now < test.startTime) {
        return NextResponse.json(
          { error: 'Test has not started yet' },
          { status: 403 }
        );
      }
      
      if (test.endTime && now > test.endTime) {
        return NextResponse.json(
          { error: 'Test has ended' },
          { status: 403 }
        );
      }

      // Check if user has already completed max attempts
      const attemptCount = await prisma.testAttempt.count({
        where: {
          testId,
          userId,
          status: 'COMPLETED'
        }
      });

      // Get test configuration for max attempts
      const testConfig = await prisma.testConfiguration.findUnique({
        where: { testId }
      });

      const maxAttempts = testConfig?.maxAttempts || 1;
      
      if (attemptCount >= maxAttempts) {
        return NextResponse.json(
          { error: 'Maximum attempts reached for this test' },
          { status: 403 }
        );
      }

      // Create new attempt
      const newAttempt = await prisma.testAttempt.create({
        data: {
          testId,
          userId,
          status: 'IN_PROGRESS',
          startedAt: new Date(),
          // Set expiry time for the attempt
          expiresAt: new Date(now.getTime() + test.duration * 60 * 1000)
        }
      });

      return NextResponse.json(newAttempt);
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error in test attempt:', error);
    return NextResponse.json(
      { error: 'Failed to process test attempt' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET(request, { params }) {
  const { testId } = params;
  
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Get the latest attempt for this test and user
    const attempt = await prisma.testAttempt.findFirst({
      where: {
        testId,
        userId
      },
      orderBy: {
        startedAt: 'desc'
      },
      include: {
        test: {
          select: {
            title: true,
            duration: true,
            startTime: true,
            endTime: true
          }
        }
      }
    });

    if (!attempt) {
      return NextResponse.json(
        { error: 'No attempt found' },
        { status: 404 }
      );
    }

    // Check if attempt is expired
    if (attempt.status === 'IN_PROGRESS') {
      const now = new Date();
      const endTime = new Date(attempt.startedAt.getTime() + attempt.test.duration * 60 * 1000);
      
      if (now > endTime) {
        // Auto-submit expired attempt
        const updatedAttempt = await prisma.testAttempt.update({
          where: { id: attempt.id },
          data: {
            status: 'COMPLETED',
            submittedAt: now,
            // Calculate score here if needed
          },
          include: {
            test: {
              select: {
                title: true,
                duration: true
              }
            }
          }
        });
        
        return NextResponse.json({
          ...updatedAttempt,
          isExpired: true
        });
      }
    }

    return NextResponse.json(attempt);

  } catch (error) {
    console.error('Error fetching test attempt:', error);
    return NextResponse.json(
      { error: 'Failed to fetch test attempt' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
