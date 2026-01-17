import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const subjects = await prisma.subject.findMany({
      include: {
        _count: {
          select: { topics: true }
        },
        topics: {
          select: {
            id: true,
            name: true,
            difficulty: true,
            _count: {
              select: { contentItems: true, questions: true }
            }
          },
          orderBy: { name: 'asc' }
        }
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({ success: true, data: subjects });
  } catch (error) {
    console.error('Error fetching subjects:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch subjects' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request) {
  try {
    const { name, description } = await request.json();
    
    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    }

    const subject = await prisma.subject.create({
      data: {
        name,
        description: description || null
      }
    });

    return NextResponse.json({ success: true, data: subject });
  } catch (error) {
    console.error('Error creating subject:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create subject' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
