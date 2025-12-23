import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { trackEvent as trackEventService } from '@/lib/analytics';

export async function POST(request) {
  try {
    const session = await getServerSession();
    const data = await request.json();
    
    // Validate required fields
    if (!data.eventType) {
      return NextResponse.json(
        { error: 'eventType is required' },
        { status: 400 }
      );
    }

    // If user is logged in, ensure the userId matches the session
    if (session?.user?.id && data.userId && session.user.id !== data.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // If no userId is provided but user is logged in, use the session user
    if (!data.userId && session?.user?.id) {
      data.userId = session.user.id;
    }

    // Add IP address and user agent for additional context
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Prepare the event data
    const eventData = {
      eventType: data.eventType,
      userId: data.userId || null,
      metadata: {
        ...(data.metadata || {}),
        ip,
        userAgent,
        timestamp: new Date(),
      },
    };

    // Track the event
    const event = await trackEventService(eventData);

    return NextResponse.json({ success: true, event });
  } catch (error) {
    console.error('Error tracking event:', error);
    return NextResponse.json(
      { error: 'Failed to track event' },
      { status: 500 }
    );
  }
}
