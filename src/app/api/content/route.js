import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const topicId = searchParams.get('topicId');
  const search = searchParams.get('search') || '';
  const type = searchParams.get('type');

  try {
    const contentItems = await prisma.contentItem.findMany({
      where: {
        ...(topicId && { topicId }),
        ...(type && { type }),
        ...(search && {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } }
          ]
        })
      },
      include: {
        topic: {
          select: {
            id: true,
            name: true,
            subject: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    return NextResponse.json({ success: true, data: contentItems });
  } catch (error) {
    console.error('Error fetching content items:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch content items' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request) {
  try {
    const {
      title,
      description,
      type,
      url,
      provider = 's3',
      topicId,
      metadata = {}
    } = await request.json();

    if (!title) {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      );
    }

    if (!type) {
      return NextResponse.json(
        { success: false, error: 'Content type is required' },
        { status: 400 }
      );
    }

    if (!url) {
      return NextResponse.json(
        { success: false, error: 'URL is required' },
        { status: 400 }
      );
    }

    if (!topicId) {
      return NextResponse.json(
        { success: false, error: 'Topic ID is required' },
        { status: 400 }
      );
    }

    // Check if topic exists
    const topic = await prisma.topic.findUnique({
      where: { id: topicId }
    });

    if (!topic) {
      return NextResponse.json(
        { success: false, error: 'Topic not found' },
        { status: 404 }
      );
    }

    const contentItem = await prisma.contentItem.create({
      data: {
        title,
        description: description || null,
        type,
        url,
        provider,
        metadata,
        topicId
      },
      include: {
        topic: {
          select: {
            id: true,
            name: true,
            subject: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: contentItem
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating content item:', error);

    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'A content item with this title already exists in this topic' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create content item' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
