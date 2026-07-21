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

    // Perform atomic deletion scoped to the logged-in user
    const result = await prisma.aIDoubtSession.deleteMany({
      where: {
        id: sessionId,
        userId: session.user.id,
      },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: 'Session not found or already deleted' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Session deleted successfully' });
  } catch (error) {
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Session not found or already deleted' }, { status: 404 });
    }
    console.error('Error deleting doubt session:', error);
    return NextResponse.json({ error: 'Failed to delete doubt session' }, { status: 500 });
  }
}
