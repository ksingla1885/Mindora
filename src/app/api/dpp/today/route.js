import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get user's class level from profile
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { classLevel: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check for existing DPP assignment for today
    let dppAssignment = await prisma.dPPAssignment.findFirst({
      where: {
        userId: session.user.id,
        scheduledFor: {
          gte: today,
          lt: tomorrow
        },
        completedAt: null
      },
      include: {
        question: {
          include: {
            topic: true,
            subject: true
          }
        }
      }
    });

    // If no assignment exists for today, create a new one
    if (!dppAssignment) {
      // Get active DPP configuration for user's class
      const activeConfig = await prisma.dPPConfig.findFirst({
        where: {
          isActive: true,
          startDate: { lte: today },
          endDate: { gte: today },
          classLevels: {
            has: user.classLevel
          }
        },
        include: {
          schedules: {
            where: {
              dayOfWeek: today.getDay(),
              classLevel: user.classLevel
            },
            include: {
              subject: true
            }
          }
        }
      });

      if (!activeConfig || activeConfig.schedules.length === 0) {
        return NextResponse.json(
          { message: 'No DPP scheduled for today' },
          { status: 200 }
        );
      }

      // For simplicity, we'll take the first schedule for today
      // In a real app, you might want to handle multiple schedules
      const schedule = activeConfig.schedules[0];
      
      // Find an appropriate question based on the schedule
      const questions = await prisma.question.findMany({
        where: {
          subjectId: schedule.subjectId,
          difficulty: schedule.difficulty,
          topicId: schedule.topics ? { in: schedule.topics } : undefined,
          classLevel: user.classLevel,
          isActive: true
        },
        take: 10, // Get 10 potential questions
        orderBy: {
          // Prioritize questions not recently seen by the user
          userAttempts: {
            _count: 'asc'
          }
        },
        include: {
          topic: true,
          subject: true
        }
      });

      if (questions.length === 0) {
        return NextResponse.json(
          { message: 'No questions available for today\'s DPP' },
          { status: 200 }
        );
      }

      // Select a random question from the available ones
      const selectedQuestion = questions[Math.floor(Math.random() * questions.length)];

      // Create the assignment
      dppAssignment = await prisma.dPPAssignment.create({
        data: {
          userId: session.user.id,
          questionId: selectedQuestion.id,
          scheduledFor: today,
          updatedAt: new Date()
        },
        include: {
          question: {
            include: {
              topic: true,
              subject: true
            }
          }
        }
      });
    }

    // Format the response
    const response = {
      id: dppAssignment.id,
      question: {
        id: dppAssignment.question.id,
        text: dppAssignment.question.text,
        type: dppAssignment.question.type,
        options: dppAssignment.question.options,
        difficulty: dppAssignment.question.difficulty,
        subject: {
          id: dppAssignment.question.subject.id,
          name: dppAssignment.question.subject.name
        },
        topic: dppAssignment.question.topic ? {
          id: dppAssignment.question.topic.id,
          name: dppAssignment.question.topic.name
        } : null,
        explanation: null // Don't reveal the answer yet
      },
      scheduledFor: dppAssignment.scheduledFor,
      isCompleted: !!dppAssignment.completedAt
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching today\'s DPP:', error);
    return NextResponse.json(
      { error: 'Failed to fetch daily practice problem' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
