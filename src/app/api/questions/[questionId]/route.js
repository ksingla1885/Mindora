import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/auth';

const prisma = new PrismaClient();

// GET /api/questions/[questionId] - Get a single question
export async function GET(request, { params }) {
  const { questionId } = params;

  try {
    const question = await prisma.question.findUnique({
      where: { id: questionId },
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

    if (!question) {
      return NextResponse.json(
        { success: false, error: 'Question not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: question,
    });
  } catch (error) {
    console.error('Error fetching question:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch question' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PATCH /api/questions/[questionId] - Update a question
export async function PATCH(request, { params }) {
  const { questionId } = params;
  const session = await auth();

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();

    // If updating options for MCQ, validate
    if (body.options && Array.isArray(body.options)) {
      if (body.options.length < 2) {
        return NextResponse.json(
          { success: false, error: 'At least 2 options are required for MCQs' },
          { status: 400 }
        );
      }

      // Convert options array to JSON string for storage
      body.options = JSON.stringify(body.options);
    }

    // Update the question
    const updatedQuestion = await prisma.question.update({
      where: { id: questionId },
      data: {
        text: body.text,
        type: body.type,
        options: body.options !== undefined ? body.options : undefined,
        correctAnswer: body.correctAnswer !== undefined ? body.correctAnswer.toString() : undefined,
        explanation: body.explanation,
        difficulty: body.difficulty,
        marks: body.marks,
        topicId: body.topicId,
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
      data: updatedQuestion,
    });
  } catch (error) {
    console.error('Error updating question:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Question not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update question' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE /api/questions/[questionId] - Delete a question
export async function DELETE(request, { params }) {
  const { questionId } = params;
  const session = await auth();

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Check if question exists and is not used in any tests
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        testQuestions: {
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!question) {
      return NextResponse.json(
        { success: false, error: 'Question not found' },
        { status: 404 }
      );
    }

    if (question.testQuestions.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete question that is used in tests. Remove it from tests first.'
        },
        { status: 400 }
      );
    }

    // Delete the question
    await prisma.question.delete({
      where: { id: questionId },
    });

    return NextResponse.json({
      success: true,
      message: 'Question deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting question:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Question not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to delete question' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
