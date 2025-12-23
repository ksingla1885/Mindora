import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/admin/content - Get all content (paginated)
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const total = await prisma.contentItem.count();
    
    // Get paginated content items
    const contentItems = await prisma.contentItem.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        topic: {
          select: { name: true, subject: { select: { name: true } } }
        },
        contentTags: {
          include: {
            tag: true
          }
        }
      }
    });

    // Transform the data for the frontend
    const transformedItems = contentItems.map(item => ({
      ...item,
      tags: item.contentTags.map(ct => ct.tag.name)
    }));

    return NextResponse.json({
      data: transformedItems,
      pagination: {
        total,
        page,
        totalPages: Math.ceil(total / limit),
        limit
      }
    });

  } catch (error) {
    console.error('Error fetching content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content' },
      { status: 500 }
    );
  }
}

// POST /api/admin/content - Create new content
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await request.json();
    const { title, description, type, url, topicId, isPublished, tags = [] } = data;

    // Validate required fields
    if (!title || !type || !topicId) {
      return NextResponse.json(
        { error: 'Title, type, and topic are required' },
        { status: 400 }
      );
    }

    // Create the content item
    const contentItem = await prisma.contentItem.create({
      data: {
        title,
        description,
        type,
        url,
        topicId,
        isPublished,
        createdBy: session.user.id,
        contentTags: {
          create: tags.map(tagName => ({
            tag: {
              connectOrCreate: {
                where: { name: tagName },
                create: { name: tagName }
              }
            },
            assignedBy: session.user.id
          }))
        }
      },
      include: {
        topic: {
          select: { name: true, subject: { select: { name: true } } }
        },
        contentTags: {
          include: {
            tag: true
          }
        }
      }
    });

    // Transform the response
    const transformedItem = {
      ...contentItem,
      tags: contentItem.contentTags.map(ct => ct.tag.name)
    };

    return NextResponse.json(transformedItem, { status: 201 });

  } catch (error) {
    console.error('Error creating content:', error);
    return NextResponse.json(
      { error: 'Failed to create content' },
      { status: 500 }
    );
  }
}
