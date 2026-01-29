import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createOrder } from '@/lib/payment';

export async function POST(request) {
  const session = await auth();

  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { testId } = await request.json();
    const userId = session.user.id;

    // Verify test exists and get price
    const test = await prisma.test.findUnique({
      where: { id: testId },
      select: {
        id: true,
        price: true,
        title: true,
        isPaid: true,
        currency: true
      },
    });

    if (!test) {
      return NextResponse.json(
        { error: 'Test not found' },
        { status: 404 }
      );
    }

    if (!test.isPaid || test.price <= 0) {
      return NextResponse.json(
        { error: 'This test is free and does not require payment' },
        { status: 400 }
      );
    }

    // Check if user already has access
    const existingAccess = await prisma.testAccess.findFirst({
      where: {
        testId,
        userId,
        expiresAt: {
          gte: new Date()
        }
      }
    });

    if (existingAccess) {
      return NextResponse.json({
        success: true,
        alreadyHasAccess: true,
        message: 'You already have access to this test',
        testId,
        accessId: existingAccess.id
      });
    }

    // Create payment order
    const order = await createOrder(
      test.price,
      test.currency,
      userId,
      testId
    );

    // Create payment record in database
    const payment = await prisma.payment.create({
      data: {
        userId,
        testId,
        amount: test.price,
        currency: test.currency,
        status: 'created',
        provider: 'razorpay',
        providerOrderId: order.id,
        receipt: order.receipt,
        metadata: {
          testTitle: test.title,
        },
      },
    });

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        name: 'Mindora',
        description: `Payment for test: ${test.title}`,
        prefill: {
          name: session.user.name || '',
          email: session.user.email || '',
          contact: session.user.phone || ''
        },
        theme: {
          color: '#2563eb',
        },
      },
      paymentId: payment.id,
    });

  } catch (error) {
    console.error('Payment creation error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to create payment',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// Add CORS headers for preflight requests
export async function OPTIONS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
