import Razorpay from 'razorpay';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import crypto from 'crypto';
import prisma from '@/lib/prisma';

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create a new payment order
// POST /api/payments
// Body: { testId: string, userId: string }
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { testId } = await request.json();
    const userId = session.user.id;

    // Get test details
    const test = await prisma.test.findUnique({
      where: { id: testId },
      select: {
        id: true,
        title: true,
        price: true,
        isPaid: true,
      },
    });

    if (!test) {
      return NextResponse.json(
        { error: 'Test not found' },
        { status: 404 }
      );
    }

    // Check if test is free
    if (!test.isPaid || test.price === 0) {
      return NextResponse.json(
        { error: 'This test is free' },
        { status: 400 }
      );
    }

    // Check if user has already purchased this test
    const existingPayment = await prisma.payment.findFirst({
      where: {
        userId,
        testId,
        status: 'CAPTURED',
      },
    });

    if (existingPayment) {
      return NextResponse.json(
        { error: 'You have already purchased this test' },
        { status: 400 }
      );
    }

    // Create order in Razorpay
    const amount = Math.round(test.price * 100); // Convert to paise
    const currency = 'INR';
    const receipt = `test_${testId}_${Date.now()}`;

    const order = await razorpay.orders.create({
      amount,
      currency,
      receipt,
      payment_capture: 1, // Auto-capture payment
      notes: {
        testId,
        userId,
        type: 'TEST_PURCHASE',
      },
    });

    // Create payment record in database
    const payment = await prisma.payment.create({
      data: {
        userId,
        testId,
        amount: test.price,
        currency,
        status: 'CREATED',
        provider: 'RAZORPAY',
        providerOrderId: order.id,
        // receipt and metadata not in schema
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
      name: 'Mindora',
      description: `Payment for test: ${test.title}`,
      prefill: {
        name: session.user.name || '',
        email: session.user.email || '',
      },
      theme: {
        color: '#4f46e5',
      },
    });

  } catch (error) {
    console.error('Error creating payment order:', error);
    return NextResponse.json(
      { error: 'Failed to create payment order' },
      { status: 500 }
    );
  }
}

// Verify payment signature and update payment status
// POST /api/payments/verify
// Body: { orderId: string, paymentId: string, signature: string }
export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { orderId, paymentId, signature } = await request.json();
    const userId = session.user.id;

    // Find payment record
    const payment = await prisma.payment.findFirst({
      where: {
        providerOrderId: orderId,
        userId,
        status: 'CREATED',
      },
    });

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found or already processed' },
        { status: 404 }
      );
    }

    // Verify signature
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    if (generatedSignature !== signature) {
      // Update payment status to failed
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
          providerPaymentId: paymentId,
        },
      });

      return NextResponse.json(
        { error: 'Payment verification failed' },
        { status: 400 }
      );
    }

    // Verify payment with Razorpay
    const razorpayPayment = await razorpay.payments.fetch(paymentId);

    if (razorpayPayment.status !== 'captured') {
      // Update payment status to failed
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
          providerPaymentId: paymentId,
        },
      });

      return NextResponse.json(
        { error: 'Payment not captured' },
        { status: 400 }
      );
    }

    // Update payment status to captured
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'CAPTURED', // Or 'completed'
        providerPaymentId: paymentId,
      },
    });

    // TODO: Send email confirmation
    // TODO: Grant access to the test

    return NextResponse.json({
      success: true,
      paymentId: razorpayPayment.id,
      amount: razorpayPayment.amount / 100, // Convert back to rupees
      testId: payment.testId,
    });

  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { error: 'Payment verification failed' },
      { status: 500 }
    );
  }
}
