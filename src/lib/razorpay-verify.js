import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Verify Razorpay payment signature
 * @param {string} orderId - Razorpay order ID
 * @param {string} paymentId - Razorpay payment ID
 * @param {string} signature - Razorpay signature to verify
 * @returns {boolean} - Whether the signature is valid
 */
export const verifyRazorpaySignature = (orderId, paymentId, signature) => {
  try {
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    hmac.update(orderId + '|' + paymentId);
    const generatedSignature = hmac.digest('hex');
    return generatedSignature === signature;
  } catch (error) {
    console.error('Error verifying Razorpay signature:', error);
    return false;
  }
};

/**
 * Process a successful payment
 * @param {string} orderId - Razorpay order ID
 * @param {string} paymentId - Razorpay payment ID
 * @param {string} userId - User ID who made the payment
 * @returns {Promise<Object>} - Result of the payment processing
 */
export const processSuccessfulPayment = async (orderId, paymentId, userId) => {
  const transaction = await prisma.$transaction(async (tx) => {
    // 1. Update payment status
    const payment = await tx.payment.update({
      where: { providerOrderId: orderId },
      data: {
        status: 'COMPLETED',
        providerPaymentId: paymentId,
        completedAt: new Date(),
      },
      include: {
        test: {
          select: {
            id: true,
            title: true,
            durationMinutes: true,
          },
        },
      },
    });

    if (!payment) {
      throw new Error('Payment record not found');
    }

    // 2. Grant test access to user
    const accessExpiry = new Date();
    accessExpiry.setDate(accessExpiry.getDate() + 30); // 30 days access

    await tx.testAccess.upsert({
      where: {
        userId_testId: {
          userId,
          testId: payment.testId,
        },
      },
      update: {
        expiresAt: accessExpiry,
      },
      create: {
        userId,
        testId: payment.testId,
        expiresAt: accessExpiry,
      },
    });

    // 3. Create a test attempt if it doesn't exist
    await tx.testAttempt.upsert({
      where: {
        userId_testId: {
          userId,
          testId: payment.testId,
        },
      },
      update: {},
      create: {
        userId,
        testId: payment.testId,
        status: 'NOT_STARTED',
        timeSpent: 0,
      },
    });

    return {
      success: true,
      payment: {
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        testId: payment.testId,
        testTitle: payment.test?.title,
        accessExpiry,
      },
    };
  });

  return transaction;
};

/**
 * Handle payment verification webhook
 * @param {Object} payload - Webhook payload from Razorpay
 * @returns {Promise<Object>} - Result of the webhook handling
 */
export const handlePaymentWebhook = async (payload) => {
  const { event, payload: paymentData } = payload;
  
  if (event !== 'payment.captured') {
    return { success: false, error: 'Unhandled event type' };
  }

  const { order_id: orderId, id: paymentId } = paymentData.payment.entity;
  
  try {
    // Find the payment record
    const payment = await prisma.payment.findUnique({
      where: { providerOrderId: orderId },
      include: { user: true },
    });

    if (!payment) {
      console.error('Payment record not found for order:', orderId);
      return { success: false, error: 'Payment record not found' };
    }

    // Skip if already processed
    if (payment.status === 'COMPLETED') {
      return { success: true, message: 'Payment already processed' };
    }

    // Process the payment
    const result = await processSuccessfulPayment(
      orderId,
      paymentId,
      payment.userId
    );

    // TODO: Send payment confirmation email
    
    return result;
  } catch (error) {
    console.error('Error processing payment webhook:', error);
    
    // Update payment status to failed
    await prisma.payment.update({
      where: { providerOrderId: orderId },
      data: {
        status: 'FAILED',
        metadata: {
          ...(payment.metadata || {}),
          error: error.message,
          webhookPayload: payload,
        },
      },
    });
    
    return { success: false, error: error.message };
  }
};
