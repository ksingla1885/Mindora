import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

// GET /api/ai/doubt/sessions/[sessionId] - Get session details and its messages
export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = await params;

    const doubtSession = await prisma.aIDoubtSession.findFirst({
      where: {
        id: sessionId,
        userId: session.user.id,
      },
      include: {
        topic: {
          select: {
            id: true,
            name: true,
          },
        },
        messages: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!doubtSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: doubtSession });
  } catch (error) {
    console.error('Error fetching doubt session details:', error);
    return NextResponse.json({ error: 'Failed to fetch doubt session details' }, { status: 500 });
  }
}

// DELETE /api/ai/doubt/sessions/[sessionId] - Delete a doubt session
export async function DELETE(request, { params }) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = await params;

    // Verify ownership before deleting
    const existingSession = await prisma.aIDoubtSession.findFirst({
      where: {
        id: sessionId,
        userId: session.user.id,
      },
    });

    if (!existingSession) {
      return NextResponse.json({ error: 'Session not found or unauthorized' }, { status: 404 });
    }

    await prisma.aIDoubtSession.delete({
      where: {
        id: sessionId,
      },
    });

    return NextResponse.json({ success: true, message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Error deleting doubt session:', error);
    return NextResponse.json({ error: 'Failed to delete doubt session' }, { status: 500 });
  }
}
