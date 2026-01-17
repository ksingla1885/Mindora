import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/auth';

const prisma = new PrismaClient();

// GET /api/questions - List questions with optional filtering
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const topicId = searchParams.get('topicId');
    const type = searchParams.get('type');
    const difficulty = searchParams.get('difficulty');
    const limit = parseInt(searchParams.get('limit')) || 10;
    const page = parseInt(searchParams.get('page')) || 1;
    const skip = (page - 1) * limit;

    const where = {};

    if (topicId) {
      where.topicId = topicId;
    }

    if (type) {
      where.type = type;
    }

    if (difficulty) {
      where.difficulty = difficulty;
    }

    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        where,
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
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.question.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: questions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch questions' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST /api/questions - Create a new question
export async function POST(request) {
  const session = await auth();

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();

    // Validate required fields
    if (!body.text || !body.topicId || !body.type) {
      return NextResponse.json(
        { success: false, error: 'Text, topicId, and type are required' },
        { status: 400 }
      );
    }

    // For MCQs, validate options and correct answer
    if (body.type === 'mcq') {
      if (!body.options || !Array.isArray(body.options) || body.options.length < 2) {
        return NextResponse.json(
          { success: false, error: 'At least 2 options are required for MCQs' },
          { status: 400 }
        );
      }

      if (body.correctAnswer === undefined || body.correctAnswer === null) {
        return NextResponse.json(
          { success: false, error: 'Correct answer is required for MCQs' },
          { status: 400 }
        );
      }

      // Convert options array to JSON string for storage
      body.options = JSON.stringify(body.options);
    }

    // Create the question
    const question = await prisma.question.create({
      data: {
        text: body.text,
        type: body.type,
        options: body.options || null,
        correctAnswer: body.correctAnswer?.toString() || null,
        explanation: body.explanation || null,
        difficulty: body.difficulty || 'medium',
        marks: body.marks || 1,
        topic: {
          connect: { id: body.topicId },
        },
      },
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
    });

    return NextResponse.json({
      success: true,
      data: question,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating question:', error);

    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'A similar question already exists' },
        { status: 400 }
      );
    }

    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Topic not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create question' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
