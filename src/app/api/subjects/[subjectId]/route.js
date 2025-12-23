import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request, { params }) {
  const { subjectId } = params;
  
  try {
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      include: {
        topics: {
          select: {
            id: true,
            name: true,
            summary: true,
            difficulty: true,
            updatedAt: true,
            _count: {
              select: { 
                contentItems: true,
                questions: true 
              }
            }
          },
          orderBy: { name: 'asc' }
        }
      }
    });

    if (!subject) {
      return NextResponse.json(
        { success: false, error: 'Subject not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: subject });
  } catch (error) {
    console.error('Error fetching subject:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch subject' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(request, { params }) {
  const { subjectId } = params;
  const { name, description } = await request.json();
  
  try {
    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    }

    const updatedSubject = await prisma.subject.update({
      where: { id: subjectId },
      data: {
        name,
        description: description || null
      }
    });

    return NextResponse.json({ success: true, data: updatedSubject });
  } catch (error) {
    console.error('Error updating subject:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update subject' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function DELETE(request, { params }) {
  const { subjectId } = params;
  
  try {
    // Check if subject has topics
    const topicCount = await prisma.topic.count({
      where: { subjectId }
    });

    if (topicCount > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cannot delete subject with existing topics. Please delete the topics first.' 
        },
        { status: 400 }
      );
    }

    await prisma.subject.delete({
      where: { id: subjectId }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Subject deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting subject:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete subject' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
