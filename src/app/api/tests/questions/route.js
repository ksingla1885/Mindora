import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const prisma = new PrismaClient();

// GET /api/tests/questions - Get questions for a test
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const testId = searchParams.get('testId');

    if (!testId) {
      return NextResponse.json(
        { error: 'Test ID is required' },
        { status: 400 }
      );
    }

    const questions = await prisma.question.findMany({
      where: { testId },
      orderBy: { order: 'asc' },
      include: {
        options: {
          orderBy: { order: 'asc' },
        },
      },
    });

    return NextResponse.json(questions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST /api/tests/questions - Create or update questions for a test
export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { testId, questions } = await request.json();

    if (!testId || !Array.isArray(questions)) {
      return NextResponse.json(
        { error: 'Test ID and questions array are required' },
        { status: 400 }
      );
    }

    // Verify user has permission to edit this test
    const test = await prisma.test.findUnique({
      where: { id: testId },
      select: { authorId: true },
    });

    if (!test) {
      return NextResponse.json(
        { error: 'Test not found' },
        { status: 404 }
      );
    }

    if (test.authorId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized to edit this test' },
        { status: 403 }
      );
    }

    // Start a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Delete existing questions and options
      await tx.option.deleteMany({
        where: { question: { testId } },
      });
      await tx.question.deleteMany({
        where: { testId },
      });

      // Create new questions with options
      const createdQuestions = [];
      for (let i = 0; i < questions.length; i++) {
        const { options, ...questionData } = questions[i];
        
        const question = await tx.question.create({
          data: {
            ...questionData,
            testId,
            order: i + 1,
            options: {
              create: options?.map((option, idx) => ({
                ...option,
                order: idx + 1,
              })),
            },
          },
          include: {
            options: true,
          },
        });
        
        createdQuestions.push(question);
      }

      return createdQuestions;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error saving questions:', error);
    return NextResponse.json(
      { error: 'Failed to save questions' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
