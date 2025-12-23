import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const subjectId = searchParams.get('subjectId');
  const search = searchParams.get('search') || '';
  const difficulty = searchParams.get('difficulty');
  
  try {
    const topics = await prisma.topic.findMany({
      where: {
        ...(subjectId && { subjectId }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { summary: { contains: search, mode: 'insensitive' } }
          ]
        }),
        ...(difficulty && { difficulty })
      },
      include: {
        subject: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: { 
            contentItems: true,
            questions: true 
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({ success: true, data: topics });
  } catch (error) {
    console.error('Error fetching topics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch topics' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request) {
  try {
    const { 
      name, 
      subjectId, 
      summary, 
      formulaSheet, 
      difficulty = 'beginner' 
    } = await request.json();
    
    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    }

    if (!subjectId) {
      return NextResponse.json(
        { success: false, error: 'Subject ID is required' },
        { status: 400 }
      );
    }

    // Check if subject exists
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId }
    });

    if (!subject) {
      return NextResponse.json(
        { success: false, error: 'Subject not found' },
        { status: 404 }
      );
    }

    const topic = await prisma.topic.create({
      data: {
        name,
        subjectId,
        summary: summary || null,
        formulaSheet: formulaSheet || null,
        difficulty
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

    return NextResponse.json({ 
      success: true, 
      data: topic 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating topic:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'A topic with this name already exists in this subject' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to create topic' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
