import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { verifyRazorpaySignature } from '@/lib/razorpay-verify';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

/**
 * Verify and process a Razorpay payment
 * POST /api/payments/verify
 */
export async function POST(request) {
  const startTime = Date.now();
  let paymentId, orderId, testId, userId;

  try {
    // 1. Authenticate the request
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.error('Unauthorized payment verification attempt');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    userId = session.user.id;

    // 2. Validate request body
    const body = await request.json();
    orderId = body.orderId || body.razorpay_order_id;
    paymentId = body.paymentId || body.razorpay_payment_id;
    const signature = body.signature || body.razorpay_signature;
    testId = body.testId;

    if (!orderId || !paymentId || !signature) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required parameters: orderId, paymentId, and signature are required' 
        },
        { status: 400 }
      );
    }

    // 3. Check for existing payment to prevent duplicate processing
    const existingPayment = await prisma.payment.findUnique({
      where: { providerOrderId: orderId },
      include: { test: { select: { title: true } } }
    });

    if (existingPayment) {
      console.log(`Payment already processed for order: ${orderId}`);
      return NextResponse.json({
        success: true,
        message: 'Payment already processed',
        payment: existingPayment,
      });
    }

    // 4. Verify the payment signature
    const isSignatureValid = verifyRazorpaySignature(orderId, paymentId, signature);
    if (!isSignatureValid) {
      console.error('Invalid Razorpay signature');
      
      // Log failed verification attempt
      await logPaymentAttempt({
        orderId,
        paymentId,
        userId,
        testId,
        status: 'FAILED',
        error: 'Invalid payment signature',
      });

      return NextResponse.json(
        { success: false, error: 'Invalid payment signature' },
        { status: 400 }
      );
    }

    // 5. Get test details
    const test = await prisma.test.findUnique({
      where: { id: testId },
      select: { 
        id: true, 
        price: true, 
        title: true, 
        duration: true,
        subjectId: true,
        chapters: true,
      },
    });

    if (!test) {
      await logPaymentAttempt({
        orderId,
        paymentId,
        userId,
        testId,
        status: 'FAILED',
        error: 'Test not found',
      });

      return NextResponse.json(
        { success: false, error: 'Test not found' },
        { status: 404 }
      );
    }

    // 6. Create payment record and grant test access in a transaction
    const [payment] = await prisma.$transaction([
      prisma.payment.create({
        data: {
          userId,
          testId,
          amount: test.price,
          currency: 'INR',
          status: 'COMPLETED',
          provider: 'RAZORPAY',
          providerPaymentId: paymentId,
          providerOrderId: orderId,
          metadata: {
            testTitle: test.title,
            verifiedAt: new Date().toISOString(),
            verificationTime: Date.now() - startTime,
            chapters: test.chapters,
          },
        },
        include: { 
          test: { 
            select: { 
              title: true,
              subject: {
                select: { name: true }
              }
            } 
          } 
        },
      }),
      
      // Grant or update test access
      prisma.testAccess.upsert({
        where: { 
          userId_testId: { 
            userId, 
            testId 
          } 
        },
        update: {
          paymentId: paymentId,
          accessGranted: true,
          expiresAt: test.duration ? new Date(Date.now() + test.duration * 24 * 60 * 60 * 1000) : null,
        },
        create: {
          userId,
          testId,
          paymentId: paymentId,
          accessGranted: true,
          expiresAt: test.duration ? new Date(Date.now() + test.duration * 24 * 60 * 60 * 1000) : null,
        },
      })
    ]);

    // 7. Log successful payment
    await logPaymentAttempt({
      orderId,
      paymentId,
      userId,
      testId,
      status: 'COMPLETED',
      amount: test.price,
    });

    console.log(`Payment verified successfully for order: ${orderId}`, {
      paymentId: payment.id,
      userId,
      testId,
      testTitle: test.title,
      amount: test.price,
      duration: test.duration
    });

    return NextResponse.json({
      success: true,
      message: 'Payment verified and access granted',
      payment: {
        ...payment,
        test: {
          ...payment.test,
          subject: test.subject?.name || null,
        },
      },
    });

  } catch (error) {
    console.error('Error in payment verification:', {
      error: error.message,
      stack: error.stack,
      orderId,
      paymentId,
      testId,
      userId,
      timestamp: new Date().toISOString(),
      processingTime: Date.now() - startTime
    });

    // Log the failed attempt
    if (orderId && paymentId) {
      try {
        await logPaymentAttempt({
          orderId,
          paymentId,
          userId,
          testId,
          status: 'FAILED',
          error: error.message,
          stack: error.stack,
        });
      } catch (dbError) {
        console.error('Failed to log payment error:', dbError);
      }
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process payment verification',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  } finally {
    const endTime = Date.now();
    console.log(`Payment verification took ${endTime - startTime}ms`);
  }
}

/**
 * Helper function to log payment attempts
 */
async function logPaymentAttempt({
  orderId,
  paymentId,
  userId,
  testId,
  status,
  error,
  stack,
  amount,
}) {
  try {
    await prisma.paymentLog.create({
      data: {
        orderId,
        paymentId,
        userId,
        testId,
        status,
        error,
        amount,
        metadata: {
          errorStack: stack?.split('\n'),
          timestamp: new Date().toISOString(),
        },
      },
    });
  } catch (logError) {
    console.error('Error logging payment attempt:', logError);
  }
}

/**
 * Verify Razorpay webhook signature
 */
function verifyWebhookSignature(body, signature, webhookSecret) {
  const hmac = crypto.createHmac('sha256', webhookSecret);
  hmac.update(JSON.stringify(body));
  const generatedSignature = hmac.digest('hex');
  return generatedSignature === signature;
}