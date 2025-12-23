import Razorpay from 'razorpay';
import { v4 as uuidv4 } from 'uuid';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Payment providers
const PROVIDERS = {
  RAZORPAY: 'razorpay',
  // Add more providers here (e.g., STRIPE: 'stripe')
};

// Payment statuses
const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
  PARTIALLY_REFUNDED: 'PARTIALLY_REFUNDED',
};

/**
 * Create a new payment order
 * @param {Object} params - Payment parameters
 * @param {number} params.amount - Amount in base currency (e.g., INR)
 * @param {string} [params.currency='INR'] - Currency code (e.g., 'INR')
 * @param {string} params.userId - User ID making the payment
 * @param {string} params.testId - Test ID being purchased
 * @param {Object} [params.metadata={}] - Additional metadata
 * @returns {Promise<Object>} - Payment order details
 */
export const createPaymentOrder = async ({
  amount,
  currency = 'INR',
  userId,
  testId,
  metadata = {},
}) => {
  const orderId = `order_${uuidv4()}`;
  const amountInPaise = Math.round(amount * 100); // Convert to paise for Razorpay

  try {
    // Create a payment record in the database
    const payment = await prisma.payment.create({
      data: {
        userId,
        testId,
        amount: parseFloat(amount),
        currency,
        status: PAYMENT_STATUS.PENDING,
        provider: PROVIDERS.RAZORPAY,
        providerOrderId: orderId,
        metadata: {
          ...metadata,
          testId,
          userId,
        },
      },
    });

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency,
      receipt: orderId,
      payment_capture: 1, // Auto-capture payment
      notes: {
        paymentId: payment.id,
        testId,
        userId,
        ...metadata,
      },
    });

    // Update payment with Razorpay order ID
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        providerOrderId: order.id,
        metadata: {
          ...payment.metadata,
          razorpayOrderId: order.id,
        },
      },
    });

    return {
      id: order.id,
      paymentId: payment.id,
      amount: order.amount,
      currency: order.currency,
      status: PAYMENT_STATUS.PENDING,
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      name: 'Mindora Education',
      description: metadata.description || 'Test Purchase',
      order_id: order.id,
      prefill: {
        name: metadata.userName || '',
        email: metadata.userEmail || '',
        contact: metadata.userPhone || '',
      },
      theme: {
        color: '#4f46e5',
      },
    };
  } catch (error) {
    console.error('Error creating payment order:', error);
    throw new Error('Failed to create payment order');
  }
};

/**
 * Verify and process payment
 * @param {string} orderId - Razorpay order ID
 * @param {string} paymentId - Razorpay payment ID
 * @param {string} signature - Payment signature
 * @returns {Promise<Object>} - Payment verification result
 */
export const verifyAndProcessPayment = async (orderId, paymentId, signature) => {
  try {
    // Verify the payment signature
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    hmac.update(orderId + '|' + paymentId);
    const generatedSignature = hmac.digest('hex');
    
    if (generatedSignature !== signature) {
      throw new Error('Invalid payment signature');
    }

    // Get payment details from Razorpay
    const payment = await razorpay.payments.fetch(paymentId);
    
    if (payment.status !== 'captured') {
      throw new Error('Payment not captured');
    }

    // Update payment status in the database
    const updatedPayment = await prisma.$transaction(async (tx) => {
      // Update payment status
      const updatedPayment = await tx.payment.update({
        where: { providerOrderId: orderId },
        data: {
          status: PAYMENT_STATUS.COMPLETED,
          providerPaymentId: paymentId,
          completedAt: new Date(),
          metadata: {
            razorpayPaymentId: paymentId,
            paymentDetails: payment,
          },
        },
        include: {
          test: true,
          user: {
            select: { email: true, name: true },
          },
        },
      });

      // Grant test access to user
      await tx.testAccess.upsert({
        where: {
          userId_testId: {
            userId: updatedPayment.userId,
            testId: updatedPayment.testId,
          },
        },
        update: {
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
        create: {
          userId: updatedPayment.userId,
          testId: updatedPayment.testId,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      });

      return updatedPayment;
    });

    // TODO: Send payment confirmation email
    
    return {
      success: true,
      payment: updatedPayment,
    };
  } catch (error) {
    console.error('Payment verification failed:', error);
    
    // Update payment status to failed
    try {
      await prisma.payment.updateMany({
        where: { providerOrderId: orderId },
        data: {
          status: PAYMENT_STATUS.FAILED,
          metadata: {
            error: error.message,
            errorDetails: error,
          },
        },
      });
    } catch (updateError) {
      console.error('Failed to update payment status:', updateError);
    }
    
    throw new Error(`Payment verification failed: ${error.message}`);
  }
};

/**
 * Get payment details
 * @param {string} paymentId - Payment ID in our system
 * @returns {Promise<Object>} - Payment details
 */
export const getPaymentDetails = async (paymentId) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        test: {
          select: {
            id: true,
            title: true,
            description: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    // If payment was made through Razorpay, fetch additional details
    if (payment.provider === PROVIDERS.RAZORPAY && payment.providerPaymentId) {
      try {
        const razorpayPayment = await razorpay.payments.fetch(payment.providerPaymentId);
        return {
          ...payment,
          providerDetails: razorpayPayment,
        };
      } catch (error) {
        console.error('Error fetching Razorpay payment details:', error);
        // Continue with basic payment details if we can't fetch from Razorpay
      }
    }

    return payment;
  } catch (error) {
    console.error('Error fetching payment details:', error);
    throw new Error('Failed to fetch payment details');
  }
};

/**
 * Process refund for a payment
 * @param {string} paymentId - Payment ID in our system
 * @param {number} [amount] - Amount to refund (in base currency). If not provided, full amount will be refunded.
 * @returns {Promise<Object>} - Refund details
 */
export const processRefund = async (paymentId, amount) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.status !== PAYMENT_STATUS.COMPLETED) {
      throw new Error('Only completed payments can be refunded');
    }

    if (!payment.providerPaymentId) {
      throw new Error('Provider payment ID not found');
    }

    // Convert amount to paise for Razorpay
    const refundAmount = amount 
      ? Math.round(amount * 100)
      : Math.round(payment.amount * 100);

    // Process refund through Razorpay
    const refund = await razorpay.payments.refund(payment.providerPaymentId, {
      amount: refundAmount,
      speed: 'normal', // or 'optimum'
    });

    // Update payment status in the database
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: amount && amount < payment.amount 
          ? PAYMENT_STATUS.PARTIALLY_REFUNDED 
          : PAYMENT_STATUS.REFUNDED,
        refundedAt: new Date(),
        refundAmount: (payment.refundAmount || 0) + (refundAmount / 100),
        metadata: {
          ...(payment.metadata || {}),
          refunds: [
            ...((payment.metadata?.refunds || [])),
            {
              id: refund.id,
              amount: refund.amount / 100,
              status: refund.status,
              processedAt: new Date().toISOString(),
              razorpayRefundId: refund.id,
            },
          ],
        },
      },
    });

    // TODO: Send refund confirmation email

    return {
      success: true,
      refundId: refund.id,
      amount: refund.amount / 100,
      status: refund.status,
      payment: updatedPayment,
    };
  } catch (error) {
    console.error('Error processing refund:', error);
    
    // Update payment with error details
    try {
      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          metadata: {
            refundError: error.message,
            refundErrorDetails: error,
          },
        },
      });
    } catch (updateError) {
      console.error('Failed to update payment with refund error:', updateError);
    }
    
    throw new Error(`Refund failed: ${error.message}`);
  }
};

/**
 * Get user's payment history
 * @param {string} userId - User ID
 * @param {Object} [options] - Query options
 * @param {number} [options.limit=10] - Number of records to return
 * @param {number} [options.page=1] - Page number
 * @returns {Promise<Object>} - Paginated payment history
 */
export const getUserPaymentHistory = async (userId, { limit = 10, page = 1 } = {}) => {
  try {
    const skip = (page - 1) * limit;
    
    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          test: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      }),
      prisma.payment.count({ where: { userId } }),
    ]);

    return {
      data: payments,
      pagination: {
        total,
        page,
        totalPages: Math.ceil(total / limit),
        limit,
      },
    };
  } catch (error) {
    console.error('Error fetching payment history:', error);
    throw new Error('Failed to fetch payment history');
  }
};
