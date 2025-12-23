import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Schema for event creation/update validation
const eventSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(1000),
  type: z.enum(['challenge', 'tournament', 'season', 'special']),
  category: z.enum(['featured', 'community', 'education', 'competitive']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  registrationEnd: z.string().datetime().optional().nullable(),
  image: z.string().url().optional().nullable(),
  maxParticipants: z.number().int().positive().optional().nullable(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional().default('medium'),
  rewards: z.array(
    z.object({
      type: z.enum(['xp', 'badge', 'premium']),
      amount: z.number().int().positive().optional(),
      id: z.string().optional(),
      name: z.string().optional(),
      description: z.string().optional(),
      days: z.number().int().positive().optional(),
    })
  ).optional().default([]),
  leaderboard: z.boolean().default(true),
  tags: z.array(z.string()).optional().default([]),
  rules: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

// GET /api/gamification/events - Get all events with optional filtering
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const type = searchParams.get('type');
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build filter object
    const where = {
      isActive: true,
      ...(category && category !== 'all' && { category }),
      ...(type && type !== 'all' && { type }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { tags: { hasSome: [search.toLowerCase()] } },
        ],
      }),
    };

    // Add status filter if provided
    if (status && status !== 'all') {
      const now = new Date();
      if (status === 'active') {
        where.startDate = { lte: now };
        where.endDate = { gte: now };
      } else if (status === 'upcoming') {
        where.startDate = { gt: now };
      } else if (status === 'completed') {
        where.endDate = { lt: now };
      }
    }

    // Get total count for pagination
    const total = await prisma.event.count({ where });

    // Get paginated events
    const events = await prisma.event.findMany({
      where,
      include: {
        participants: {
          select: {
            userId: true,
            joinedAt: true,
            progress: true,
            score: true,
          },
        },
      },
      orderBy: {
        startDate: 'desc',
      },
      skip,
      take: limit,
    });

    // Format response
    const formattedEvents = events.map(event => {
      const now = new Date();
      const startDate = new Date(event.startDate);
      const endDate = new Date(event.endDate);
      const registrationEnd = event.registrationEnd ? new Date(event.registrationEnd) : null;
      
      let eventStatus = 'upcoming';
      let statusLabel = '';
      let progress = 0;
      
      if (now < startDate) {
        eventStatus = 'upcoming';
        statusLabel = `Starts in ${Math.ceil((startDate - now) / (1000 * 60 * 60 * 24))} days`;
      } else if (now > endDate) {
        eventStatus = 'completed';
        statusLabel = 'Event ended';
        progress = 100;
      } else if (registrationEnd && now > registrationEnd) {
        eventStatus = 'registration_closed';
        statusLabel = 'Registration closed';
      } else {
        eventStatus = 'active';
        const totalDuration = endDate - startDate;
        const elapsed = now - startDate;
        progress = Math.min((elapsed / totalDuration) * 100, 100);
        statusLabel = `Ends in ${Math.ceil((endDate - now) / (1000 * 60 * 60 * 24))} days`;
      }
      
      return {
        ...event,
        participants: event.participants.length,
        status: {
          status: eventStatus,
          label: statusLabel,
          progress,
        },
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedEvents,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

// POST /api/gamification/events - Create a new event (admin only)
export async function POST(request) {
  try {
    // Check if user is authenticated and has admin role
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Check if user has admin role
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = eventSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid data', details: validation.error.issues },
        { status: 400 }
      );
    }

    const eventData = validation.data;

    // Create the event
    const event = await prisma.event.create({
      data: {
        ...eventData,
        createdBy: session.user.id,
        updatedBy: session.user.id,
      },
    });

    // Create rewards if any
    if (eventData.rewards && eventData.rewards.length > 0) {
      await prisma.reward.createMany({
        data: eventData.rewards.map(reward => ({
          eventId: event.id,
          type: reward.type,
          amount: reward.amount || null,
          badgeId: reward.type === 'badge' ? reward.id : null,
          name: reward.name || null,
          description: reward.description || null,
          days: reward.type === 'premium' ? reward.days : null,
          createdBy: session.user.id,
        })),
      });
    }

    return NextResponse.json({
      success: true,
      data: event,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create event' },
      { status: 500 }
    );
  }
}

// PUT /api/gamification/events - Update an existing event (admin only)
export async function PUT(request) {
  try {
    // Check if user is authenticated and has admin role
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Check if user has admin role
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const { id, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Event ID is required' },
        { status: 400 }
      );
    }

    const validation = eventSchema.partial().safeParse(updateData);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid data', details: validation.error.issues },
        { status: 400 }
      );
    }

    // Update the event
    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        ...updateData,
        updatedBy: session.user.id,
      },
    });

    // Update rewards if provided
    if (updateData.rewards) {
      // Delete existing rewards for this event
      await prisma.reward.deleteMany({
        where: { eventId: id },
      });

      // Create new rewards
      if (updateData.rewards.length > 0) {
        await prisma.reward.createMany({
          data: updateData.rewards.map(reward => ({
            eventId: id,
            type: reward.type,
            amount: reward.amount || null,
            badgeId: reward.type === 'badge' ? reward.id : null,
            name: reward.name || null,
            description: reward.description || null,
            days: reward.type === 'premium' ? reward.days : null,
            createdBy: session.user.id,
          })),
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedEvent,
    });
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update event' },
      { status: 500 }
    );
  }
}
