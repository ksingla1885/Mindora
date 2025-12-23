import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = params;

    // Find the DPP assignment
    const assignment = await prisma.dPPAssignment.findUnique({
      where: { 
        id,
        userId: session.user.id,
      },
      include: {
        question: {
          include: {
            topic: true,
            subject: true,
          },
        },
        answer: true,
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // Format the response
    const response = {
      id: assignment.id,
      text: assignment.question.text,
      type: assignment.question.type,
      difficulty: assignment.question.difficulty,
      subject: assignment.question.subject?.name || 'General',
      topic: assignment.question.topic?.name || 'General',
      tags: assignment.question.tags || [],
      options: assignment.question.options,
      explanation: assignment.question.explanation,
      solutionImageUrl: assignment.question.solutionImageUrl,
      imageUrl: assignment.question.imageUrl,
      userAnswer: assignment.answer?.userAnswer,
      isCorrect: assignment.answer?.isCorrect,
      feedback: assignment.answer?.feedback,
      completed: assignment.completed,
      assignedAt: assignment.assignedAt,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching DPP question:', error);
    return NextResponse.json(
      { error: 'Failed to fetch question' },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function HEAD() {
  return new NextResponse(null, { status: 405 });
}

export async function POST() {
  return new NextResponse(null, { status: 405 });
}

export async function PUT() {
  return new NextResponse(null, { status: 405 });
}

export async function DELETE() {
  return new NextResponse(null, { status: 405 });
}

export async function PATCH() {
  return new NextResponse(null, { status: 405 });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 405 });
}
