import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// POST /api/gamification/events/participate - Register for an event
export async function POST(request) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Parse request body
    const { eventId } = await request.json();
    
    if (!eventId) {
      return NextResponse.json(
        { success: false, error: 'Event ID is required' },
        { status: 400 }
      );
    }

    // Check if event exists and is active
    const event = await prisma.event.findUnique({
      where: { 
        id: eventId,
        isActive: true,
      },
      include: {
        participants: {
          where: { userId: session.user.id },
          select: { id: true }
        }
      }
    });

    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Event not found or inactive' },
        { status: 404 }
      );
    }

    // Check if registration is still open
    const now = new Date();
    const registrationEnd = event.registrationEnd ? new Date(event.registrationEnd) : new Date(event.startDate);
    
    if (now > registrationEnd) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Registration for this event has ended' 
        },
        { status: 400 }
      );
    }

    // Check if event has already started
    const eventStart = new Date(event.startDate);
    if (now < eventStart) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Event has not started yet' 
        },
        { status: 400 }
      );
    }

    // Check if user is already registered
    if (event.participants && event.participants.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'You are already registered for this event' 
        },
        { status: 400 }
      );
    }

    // Register user for the event
    await prisma.eventParticipation.create({
      data: {
        eventId,
        userId: session.user.id,
        joinedAt: new Date(),
        progress: 0,
        score: 0,
      },
    });

    // Create a notification for the user
    await prisma.notification.create({
      data: {
        userId: session.user.id,
        type: 'EVENT_JOINED',
        title: 'Event Registration Confirmed',
        message: `You have successfully registered for the event "${event.title}"`,
        metadata: {
          eventId,
          eventTitle: event.title,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Successfully registered for the event',
    });
  } catch (error) {
    console.error('Error registering for event:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to register for event' },
      { status: 500 }
    );
  }
}

// GET /api/gamification/events/participate - Get user's event participations
export async function GET(request) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build where clause based on status
    const now = new Date();
    let where = {
      userId: session.user.id,
    };

    if (status !== 'all') {
      if (status === 'active') {
        where.AND = [
          { event: { startDate: { lte: now } } },
          { event: { endDate: { gte: now } } },
        ];
      } else if (status === 'upcoming') {
        where.AND = [
          { event: { startDate: { gt: now } } },
        ];
      } else if (status === 'completed') {
        where.AND = [
          { event: { endDate: { lt: now } } },
        ];
      }
    }

    // Get total count for pagination
    const total = await prisma.eventParticipation.count({
      where,
    });

    // Get paginated participations with event details
    const participations = await prisma.eventParticipation.findMany({
      where,
      include: {
        event: {
          select: {
            id: true,
            title: true,
            description: true,
            type: true,
            category: true,
            startDate: true,
            endDate: true,
            image: true,
            difficulty: true,
            leaderboard: true,
          },
        },
      },
      orderBy: {
        event: {
          startDate: 'desc',
        },
      },
      skip,
      take: limit,
    });

    // Format response
    const formattedParticipations = participations.map(participation => {
      const event = participation.event;
      const startDate = new Date(event.startDate);
      const endDate = new Date(event.endDate);
      
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
      } else {
        eventStatus = 'active';
        const totalDuration = endDate - startDate;
        const elapsed = now - startDate;
        progress = Math.min((elapsed / totalDuration) * 100, 100);
        statusLabel = `Ends in ${Math.ceil((endDate - now) / (1000 * 60 * 60 * 24))} days`;
      }
      
      return {
        ...participation,
        event: {
          ...event,
          status: {
            status: eventStatus,
            label: statusLabel,
            progress,
          },
        },
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedParticipations,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching event participations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch event participations' },
      { status: 500 }
    );
  }
}

// PUT /api/gamification/events/participate - Update event participation (e.g., update progress)
export async function PUT(request) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Parse request body
    const { eventId, progress, score, completed } = await request.json();
    
    if (!eventId) {
      return NextResponse.json(
        { success: false, error: 'Event ID is required' },
        { status: 400 }
      );
    }

    // Check if participation exists
    const participation = await prisma.eventParticipation.findFirst({
      where: {
        eventId,
        userId: session.user.id,
      },
      include: {
        event: {
          select: {
            startDate: true,
            endDate: true,
          },
        },
      },
    });

    if (!participation) {
      return NextResponse.json(
        { success: false, error: 'You are not registered for this event' },
        { status: 404 }
      );
    }

    // Check if event is active
    const now = new Date();
    const eventStart = new Date(participation.event.startDate);
    const eventEnd = new Date(participation.event.endDate);

    if (now < eventStart) {
      return NextResponse.json(
        { success: false, error: 'Event has not started yet' },
        { status: 400 }
      );
    }

    if (now > eventEnd) {
      return NextResponse.json(
        { success: false, error: 'Event has already ended' },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData = {};
    
    if (progress !== undefined) {
      updateData.progress = Math.min(Math.max(progress, 0), 100); // Clamp between 0 and 100
    }
    
    if (score !== undefined) {
      updateData.score = Math.max(score, 0); // Ensure score is not negative
    }
    
    if (completed !== undefined) {
      updateData.completed = completed;
      updateData.completedAt = completed ? new Date() : null;
    }

    // Update participation
    const updatedParticipation = await prisma.eventParticipation.update({
      where: {
        id: participation.id,
      },
      data: updateData,
      include: {
        event: {
          select: {
            title: true,
          },
        },
      },
    });

    // Check for completion and award rewards if needed
    if (completed && !participation.completed) {
      // Get event rewards
      const rewards = await prisma.reward.findMany({
        where: {
          eventId,
        },
      });

      // Process each reward
      for (const reward of rewards) {
        if (reward.type === 'xp' && reward.amount) {
          // Award XP to user
          await prisma.user.update({
            where: { id: session.user.id },
            data: {
              xp: { increment: reward.amount },
            },
          });

          // Create XP transaction
          await prisma.xpTransaction.create({
            data: {
              userId: session.user.id,
              amount: reward.amount,
              type: 'EVENT_REWARD',
              description: `Awarded for completing event: ${updatedParticipation.event.title}`,
              metadata: {
                eventId,
                rewardId: reward.id,
              },
            },
          });
        } else if (reward.type === 'badge' && reward.badgeId) {
          // Award badge to user
          await prisma.badgeAward.create({
            data: {
              userId: session.user.id,
              badgeId: reward.badgeId,
              awardedBy: 'system',
              reason: `Awarded for completing event: ${updatedParticipation.event.title}`,
              metadata: {
                eventId,
                rewardId: reward.id,
              },
            },
          });
        } else if (reward.type === 'premium' && reward.days) {
          // Award premium days
          const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { premiumUntil: true },
          });

          const currentDate = user.premiumUntil ? new Date(user.premiumUntil) : new Date();
          const newPremiumDate = new Date(currentDate);
          newPremiumDate.setDate(currentDate.getDate() + reward.days);

          await prisma.user.update({
            where: { id: session.user.id },
            data: {
              premiumUntil: newPremiumDate,
              isPremium: true,
            },
          });
        }

        // Create notification for the reward
        await prisma.notification.create({
          data: {
            userId: session.user.id,
            type: 'REWARD_AWARDED',
            title: 'Reward Unlocked!',
            message: `You've earned a reward for completing the event "${updatedParticipation.event.title}"`,
            metadata: {
              eventId,
              rewardId: reward.id,
              rewardType: reward.type,
            },
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedParticipation,
    });
  } catch (error) {
    console.error('Error updating event participation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update event participation' },
      { status: 500 }
    );
  }
}
