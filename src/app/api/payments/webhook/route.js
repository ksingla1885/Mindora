import { NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { verifyWebhookSignature } from '@/services/payment/razorpay';

/**
 * Process payment.captured webhook event
 * @param {Object} payment - Payment entity from Razorpay
 */
async function handlePaymentCaptured(payment) {
  const { order_id: razorpayOrderId, id: razorpayPaymentId } = payment;

  try {
    // Find the payment record
    const paymentRecord = await prisma.payment.findFirst({
      where: { providerOrderId: razorpayOrderId },
      include: { user: true, test: true }
    });

    if (!paymentRecord) {
      throw new Error(`Payment record not found for order: ${razorpayOrderId}`);
    }

    // Skip if already processed
    if (paymentRecord.status === 'COMPLETED') {
      console.log(`Payment ${paymentRecord.id} already processed`);
      return;
    }

    // Update payment status
    await prisma.payment.update({
      where: { id: paymentRecord.id },
      data: {
        status: 'COMPLETED',
        providerPaymentId: razorpayPaymentId,
        completedAt: new Date(),
        metadata: {
          ...(paymentRecord.metadata || {}),
          razorpay_payment: payment,
          updatedAt: new Date().toISOString()
        }
      }
    });

    // Grant test access to user
    await prisma.testAccess.create({
      data: {
        userId: paymentRecord.userId,
        testId: paymentRecord.testId,
        paymentId: paymentRecord.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      }
    });

    // TODO: Send confirmation email
    console.log(`Payment ${paymentRecord.id} processed successfully`);
  } catch (error) {
    console.error('Error processing payment.captured:', error);
    // TODO: Implement retry logic or alert system
  }
}

/**
 * Process payment.failed webhook event
 * @param {Object} payment - Payment entity from Razorpay
 */
async function handlePaymentFailed(payment) {
  const { order_id: razorpayOrderId, error_description: errorMessage } = payment;

  try {
    await prisma.payment.updateMany({
      where: {
        providerOrderId: razorpayOrderId,
        status: { not: 'COMPLETED' }
      },
      data: {
        status: 'FAILED',
        error: errorMessage || 'Payment failed',
        metadata: {
          ...(payment.metadata || {}),
          razorpay_error: payment.error,
          updatedAt: new Date().toISOString()
        }
      }
    });
    console.log(`Payment failed for order: ${razorpayOrderId}`, errorMessage);
  } catch (error) {
    console.error('Error processing payment.failed:', error);
  }
}

/**
 * Process order.paid webhook event
 * @param {Object} order - Order entity from Razorpay
 */
async function handleOrderPaid(order) {
  // This is a fallback in case payment.captured wasn't received
  // or processed successfully
  const payment = order.payments?.entities?.[0];
  if (payment && payment.status === 'captured') {
    await handlePaymentCaptured(payment);
  }
}

// This is the webhook handler for Razorpay
// It's called asynchronously by Razorpay when payment events occur
// POST /api/payments/webhook
export async function POST(request) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    if (!signature) {
      console.error('Missing x-razorpay-signature header');
      return NextResponse.json(
        { error: 'Missing signature header' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const isSignatureValid = verifyWebhookSignature(body, signature);
    if (!isSignatureValid) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    const event = JSON.parse(body);
    const { payload } = event;

    console.log(`Received webhook event: ${event.event}`, {
      eventId: event.id,
      timestamp: new Date().toISOString()
    });

    // Handle different webhook events
    try {
      switch (event.event) {
        case 'payment.captured':
          await handlePaymentCaptured(payload.payment.entity);
          break;

        case 'payment.failed':
          await handlePaymentFailed(payload.payment.entity);
          break;

        case 'order.paid':
          await handleOrderPaid(payload.order.entity);
          break;

        case 'payment.authorized':
          // Handle authorized but not captured payments if needed
          console.log('Payment authorized but not captured yet:', payload.payment.entity.id);
          break;

        default:
          console.log(`Unhandled event type: ${event.event}`);
      }

      return NextResponse.json({ received: true });
    } catch (error) {
      console.error(`Error processing ${event.event} event:`, error);
      // Return 200 to prevent Razorpay from retrying for non-recoverable errors
      return NextResponse.json(
        { error: 'Error processing event' },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error('Error in webhook handler:', error);
    // Log the full error for debugging
    console.error('Webhook error details:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      headers: Object.fromEntries(request.headers.entries())
    });

    // Return 200 to prevent Razorpay from retrying for non-recoverable errors
    return NextResponse.json(
      { error: 'Error processing webhook' },
      { status: 200 }
    );
  }
}

// Add support for HEAD requests for webhook URL validation
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}


