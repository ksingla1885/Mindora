import { PrismaClient } from '@prisma/client';
import { createOrder, verifyPayment } from './razorpay';

const prisma = new PrismaClient();

/**
 * Create a payment record and Razorpay order
 * @param {Object} options - Payment options
 * @param {string} options.userId - User ID making the payment
 * @param {string} options.testId - Test ID being purchased
 * @param {number} options.amount - Amount in INR
 * @param {string} options.currency - Currency code (default: 'INR')
 * @returns {Promise<Object>} Payment and order details
 */
export const initiatePayment = async ({
  userId,
  testId,
  amount,
  currency = 'INR',
}) => {
  // Start a transaction
  return prisma.$transaction(async (tx) => {
    // Create payment record
    const payment = await tx.payment.create({
      data: {
        userId,
        testId,
        amount,
        currency,
        status: 'PENDING',
        provider: 'RAZORPAY',
      },
    });

    // Create Razorpay order
    const { order, error } = await createOrder(amount, currency, {
      payment_id: payment.id,
      user_id: userId,
      test_id: testId,
    });

    if (error) {
      throw new Error(`Failed to create payment order: ${error}`);
    }

    // Update payment with Razorpay order ID
    const updatedPayment = await tx.payment.update({
      where: { id: payment.id },
      data: {
        providerOrderId: order.id,
      },
    });

    return {
      payment: updatedPayment,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        key: process.env.RAZORPAY_KEY_ID,
        name: 'Mindora Education',
        description: `Payment for test ${testId}`,
        order_id: order.id,
        handler: async function(response) {
          // This will be called on the client side
          console.log('Payment successful:', response);
        },
        prefill: {
          name: '', // Will be filled in the frontend
          email: '', // Will be filled in the frontend
          contact: '', // Will be filled in the frontend
        },
        theme: {
          color: '#4F46E5',
        },
      },
    };
  });
};

/**
 * Verify and complete a payment
 * @param {string} paymentId - Internal payment ID
 * @param {string} razorpayOrderId - Razorpay order ID
 * @param {string} razorpayPaymentId - Razorpay payment ID
 * @param {string} razorpaySignature - Razorpay signature
 * @returns {Promise<Object>} Updated payment details
 */
export const completePayment = async ({
  paymentId,
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
}) => {
  // Verify the payment signature
  const isValid = verifyPayment(
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature
  );

  if (!isValid) {
    throw new Error('Invalid payment signature');
  }

  // Update payment status
  return prisma.payment.update({
    where: { id: paymentId },
    data: {
      status: 'COMPLETED',
      providerPaymentId: razorpayPaymentId,
      paidAt: new Date(),
    },
    include: {
      test: true,
      user: true,
    },
  });
};

/**
 * Get payment details by ID
 * @param {string} paymentId - Payment ID
 * @returns {Promise<Object>} Payment details
 */
export const getPayment = async (paymentId) => {
  return prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      test: true,
      user: true,
    },
  });
};

/**
 * Get user's payment history
 * @param {string} userId - User ID
 * @param {number} limit - Number of records to return
 * @param {number} page - Page number
 * @returns {Promise<Object>} Paginated payment history
 */
export const getUserPayments = async (userId, limit = 10, page = 1) => {
  const skip = (page - 1) * limit;
  
  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where: { userId },
      include: {
        test: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.payment.count({ where: { userId } }),
  ]);

  return {
    data: payments,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};
