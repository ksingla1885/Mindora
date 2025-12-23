import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request, { params }) {
  const { topicId } = params;
  
  try {
    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      include: {
        subject: {
          select: {
            id: true,
            name: true
          }
        },
        contentItems: {
          select: {
            id: true,
            title: true,
            description: true,
            type: true,
            url: true,
            provider: true,
            updatedAt: true
          },
          orderBy: { updatedAt: 'desc' }
        },
        questions: {
          select: {
            id: true,
            text: true,
            type: true,
            options: true,
            correctAnswer: true,
            explanation: true,
            difficulty: true,
            updatedAt: true
          },
          orderBy: { updatedAt: 'desc' }
        },
        _count: {
          select: {
            contentItems: true,
            questions: true
          }
        }
      }
    });

    if (!topic) {
      return NextResponse.json(
        { success: false, error: 'Topic not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: topic });
  } catch (error) {
    console.error('Error fetching topic:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch topic' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(request, { params }) {
  const { topicId } = params;
  const { name, summary, formulaSheet, difficulty } = await request.json();
  
  try {
    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    }

    const updatedTopic = await prisma.topic.update({
      where: { id: topicId },
      data: {
        name,
        summary: summary || null,
        formulaSheet: formulaSheet || null,
        difficulty: difficulty || 'beginner'
      },
      include: {
        subject: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json({ success: true, data: updatedTopic });
  } catch (error) {
    console.error('Error updating topic:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'A topic with this name already exists in this subject' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to update topic' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function DELETE(request, { params }) {
  const { topicId } = params;
  
  try {
    // Check if topic has content items or questions
    const [contentCount, questionCount] = await Promise.all([
      prisma.contentItem.count({ where: { topicId } }),
      prisma.question.count({ where: { topicId } })
    ]);

    if (contentCount > 0 || questionCount > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cannot delete topic with existing content items or questions. Please delete them first.' 
        },
        { status: 400 }
      );
    }

    await prisma.topic.delete({
      where: { id: topicId }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Topic deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting topic:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete topic' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
