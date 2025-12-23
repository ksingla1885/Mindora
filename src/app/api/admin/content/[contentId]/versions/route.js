import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const prisma = new PrismaClient();

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { contentId: id } = params;

    const versions = await prisma.contentItem.findMany({
      where: {
        OR: [
          { id },
          { parentId: id }
        ]
      },
      orderBy: {
        version: 'desc'
      },
      include: {
        topic: {
          select: {
            name: true,
            subject: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json(versions);
  } catch (error) {
    console.error('Error fetching content versions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content versions' },
      { status: 500 }
    );
  }
}

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { contentId: id } = params;
    const { title, description, type, url, provider, changeLog, scheduledFor } = await request.json();

    // Get the current version
    const currentVersion = await prisma.contentItem.findUnique({
      where: { id }
    });

    if (!currentVersion) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      );
    }

    // Mark current version as not current
    await prisma.contentItem.update({
      where: { id },
      data: { isCurrent: false }
    });

    // Create new version
    const newVersion = await prisma.contentItem.create({
      data: {
        ...currentVersion,
        id: undefined, // Let Prisma generate new ID
        parentId: currentVersion.parentId || currentVersion.id, // Set parent to original content
        version: currentVersion.version + 1,
        title,
        description,
        type,
        url,
        provider,
        changeLog,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        status: scheduledFor ? 'scheduled' : 'draft',
        isCurrent: true,
        createdAt: undefined, // Let Prisma set the creation date
        updatedAt: undefined
      }
    });

    return NextResponse.json(newVersion, { status: 201 });
  } catch (error) {
    console.error('Error creating content version:', error);
    return NextResponse.json(
      { error: 'Failed to create content version' },
      { status: 500 }
    );
  }
}
