import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500, // Max 500 users per second
});

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'You must be signed in to cancel an order' },
        { status: 401 }
      );
    }

    const { orderId } = params;

    // Apply rate limiting
    const identifier = session.user.id;
    await limiter.check(5, identifier); // 5 requests per minute

    // Get the current order
    const order = await prisma.order.findUnique({
      where: { 
        id: orderId,
        userId: session.user.id, // Ensure the order belongs to the user
      },
      include: {
        items: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check if order can be cancelled
    if (!['pending', 'processing'].includes(order.status)) {
      return NextResponse.json(
        { 
          error: `Cannot cancel order with status: ${order.status}`,
          code: 'ORDER_CANNOT_BE_CANCELLED',
        },
        { status: 400 }
      );
    }

    // Process refund if payment was made
    let refundStatus = 'not_required';
    if (order.paymentStatus === 'paid') {
      try {
        // In a real app, initiate refund through payment gateway
        // This is a placeholder for the refund logic
        refundStatus = await processRefund(order);
      } catch (error) {
        console.error('Error processing refund:', error);
        return NextResponse.json(
          { 
            error: 'Failed to process refund',
            details: error.message,
            code: 'REFUND_FAILED',
          },
          { status: 500 }
        );
      }
    }

    // Update order status
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Add order update
      await tx.order.update({
        where: { id: orderId },
        data: {
          updates: {
            create: [
              {
                status: 'cancelled',
                message: refundStatus === 'completed' 
                  ? 'Order cancelled and refund processed' 
                  : 'Order cancelled',
              },
            ],
          },
        },
      });

      // Update order status
      return await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'cancelled',
          cancelledAt: new Date(),
          ...(refundStatus === 'completed' && { paymentStatus: 'refunded' }),
        },
        include: {
          items: true,
          updates: {
            orderBy: { timestamp: 'desc' },
            take: 5,
          },
        },
      });
    });

    // Send cancellation email (in a real app)
    try {
      await sendOrderCancellationEmail(session.user.email, updatedOrder);
    } catch (error) {
      console.error('Error sending cancellation email:', error);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      message: 'Order cancelled successfully',
      order: updatedOrder,
      refundStatus,
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    
    if (error.message.includes('rate limit exceeded')) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to cancel order',
        details: error.message,
        code: 'CANCELLATION_FAILED',
      },
      { status: 500 }
    );
  }
}

// Helper function to process refund (placeholder implementation)
async function processRefund(order) {
  // In a real app, integrate with your payment gateway's refund API
  // This is a simplified example
  
  // Simulate API call to payment gateway
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Return status based on a mock condition
  return Math.random() > 0.1 ? 'completed' : 'failed';
}

// Helper function to send order cancellation email (placeholder implementation)
async function sendOrderCancellationEmail(email, order) {
  // In a real app, implement email sending logic
  console.log(`Sending cancellation email to ${email} for order ${order.orderNumber}`);
  return { success: true };
}
