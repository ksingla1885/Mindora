import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

// GET /api/ai/doubt/sessions - Get all doubt sessions for the logged-in user
export async function GET(request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const subject = searchParams.get('subject');

    const where = {
      userId: session.user.id,
    };

    if (subject && subject !== 'All Subjects') {
      where.subject = subject;
    }

    const doubtSessions = await prisma.aIDoubtSession.findMany({
      where,
      include: {
        topic: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return NextResponse.json({ success: true, data: doubtSessions });
  } catch (error) {
    console.error('Error fetching doubt sessions:', error);
    return NextResponse.json({ error: 'Failed to fetch doubt sessions' }, { status: 500 });
  }
}

// POST /api/ai/doubt/sessions - Create a new doubt session
export async function POST(request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, subject, topicId } = body;

    const newSession = await prisma.aIDoubtSession.create({
      data: {
        userId: session.user.id,
        title: title || 'New Doubt',
        subject: subject || null,
        topicId: topicId || null,
      },
      include: {
        topic: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: newSession });
  } catch (error) {
    console.error('Error creating doubt session:', error);
    return NextResponse.json({ error: 'Failed to create doubt session' }, { status: 500 });
  }
}
