import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500, // Max 500 users per second
});

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'You must be signed in to view this order' },
        { status: 401 }
      );
    }

    const { orderId } = params;

    // Apply rate limiting
    const identifier = session.user.id;
    await limiter.check(10, identifier); // 10 requests per minute

    // Get order with related data
    const order = await prisma.order.findUnique({
      where: { 
        id: orderId,
        userId: session.user.id, // Ensure the order belongs to the user
      },
      include: {
        items: {
          include: {
            test: {
              select: {
                id: true,
                title: true,
                description: true,
                image: true,
                duration: true,
                difficulty: true,
              },
            },
          },
        },
        billingAddress: true,
        updates: {
          orderBy: { timestamp: 'desc' },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Error fetching order:', error);
    
    if (error.message.includes('rate limit exceeded')) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'You must be signed in to update this order' },
        { status: 401 }
      );
    }

    const { orderId } = params;
    const { status, paymentStatus, paymentId } = await request.json();

    // Apply rate limiting
    const identifier = session.user.id;
    await limiter.check(5, identifier); // 5 requests per minute

    // Get the current order
    const currentOrder = await prisma.order.findUnique({
      where: { 
        id: orderId,
        userId: session.user.id, // Ensure the order belongs to the user
      },
    });

    if (!currentOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData = {};
    const updates = [];

    if (status && status !== currentOrder.status) {
      updateData.status = status;
      updates.push({
        status,
        message: `Order status updated to ${status}`,
      });
    }

    if (paymentStatus && paymentStatus !== currentOrder.paymentStatus) {
      updateData.paymentStatus = paymentStatus;
      updates.push({
        status: paymentStatus,
        message: `Payment status updated to ${paymentStatus}`,
      });
    }

    if (paymentId && !currentOrder.paymentId) {
      updateData.paymentId = paymentId;
    }

    // Update the order
    const order = await prisma.$transaction(async (tx) => {
      // Create order updates if any
      if (updates.length > 0) {
        await tx.order.update({
          where: { id: orderId },
          data: {
            updates: {
              create: updates.map(update => ({
                status: update.status,
                message: update.message,
              })),
            },
          },
        });
      }

      // Update order fields
      return await tx.order.update({
        where: { id: orderId },
        data: updateData,
        include: {
          items: {
            include: {
              test: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
          updates: {
            orderBy: { timestamp: 'desc' },
            take: 5,
          },
        },
      });
    });

    // If order is completed, grant user access to the tests
    if (status === 'completed' && currentOrder.status !== 'completed') {
      try {
        await grantUserAccessToTests(session.user.id, order.items);
      } catch (error) {
        console.error('Error granting user access to tests:', error);
        // Log the error but don't fail the request
      }
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Error updating order:', error);
    
    if (error.message.includes('rate limit exceeded')) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}

// Helper function to grant user access to purchased tests
async function grantUserAccessToTests(userId, items) {
  // Get unique test IDs
  const testIds = [...new Set(items.map(item => item.testId))];
  
  // Check which tests the user already has access to
  const existingAccess = await prisma.userTest.findMany({
    where: {
      userId,
      testId: { in: testIds },
    },
    select: {
      testId: true,
    },
  });

  const existingTestIds = new Set(existingAccess.map(access => access.testId));
  const newTestIds = testIds.filter(id => !existingTestIds.has(id));

  // Grant access to new tests
  if (newTestIds.length > 0) {
    await prisma.userTest.createMany({
      data: newTestIds.map(testId => ({
        userId,
        testId,
        assignedAt: new Date(),
        status: 'active',
      })),
      skipDuplicates: true,
    });
  }

  // Update test access counts
  await prisma.test.updateMany({
    where: {
      id: { in: testIds },
    },
    data: {
      accessCount: {
        increment: 1,
      },
    },
  });
}
