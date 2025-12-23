import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { testId } = params;

    // Check if test exists and get its details
    const test = await prisma.test.findUnique({
      where: { id: testId },
      select: {
        id: true,
        isPaid: true,
        price: true,
      },
    });

    if (!test) {
      return NextResponse.json(
        { error: 'Test not found' },
        { status: 404 }
      );
    }

    // Check if user has already purchased this test
    const purchase = await prisma.payment.findFirst({
      where: {
        userId: session.user.id,
        testId,
        status: 'SUCCESS',
      },
      select: { id: true },
    });

    // Check if user has an active subscription that includes this test
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
        status: 'ACTIVE',
        tests: {
          some: { id: testId }
        },
      },
      select: { id: true },
    });

    const hasAccess = !test.isPaid || !!purchase || !!subscription;
    const requiresPayment = test.isPaid && !purchase && !subscription;

    return NextResponse.json({
      hasAccess,
      requiresPayment,
      test: {
        id: test.id,
        isPaid: test.isPaid,
        price: test.price,
      },
    });

  } catch (error) {
    console.error('Error checking test access:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
