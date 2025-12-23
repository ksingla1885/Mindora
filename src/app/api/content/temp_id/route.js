import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/content/[contentId] - Get a single content item by ID
export async function GET(request, { params }) {
  const { contentId } = params;

  try {
    const content = await prisma.contentItem.findUnique({
      where: { id: contentId },
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

    if (!content) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(content);
  } catch (error) {
    console.error('Error fetching content:', error);
    return NextResponse.json(
      { error: 'Error fetching content' },
      { status: 500 }
    );
  }
}

// PATCH /api/content/[contentId] - Update a content item
export async function PATCH(request, { params }) {
  const { contentId } = params;
  const data = await request.json();

  try {
    const updatedContent = await prisma.contentItem.update({
      where: { id: contentId },
      data
    });

    return NextResponse.json(updatedContent);
  } catch (error) {
    console.error('Error updating content:', error);
    return NextResponse.json(
      { error: 'Error updating content' },
      { status: 500 }
    );
  }
}

// DELETE /api/content/[contentId] - Delete a content item
export async function DELETE(request, { params }) {
  const { contentId } = params;

  try {
    await prisma.contentItem.delete({
      where: { id: contentId }
    });

    return NextResponse.json(
      { message: 'Content deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting content:', error);
    return NextResponse.json(
      { error: 'Error deleting content' },
      { status: 500 }
    );
  }
}