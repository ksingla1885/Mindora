import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from './prisma';

// Check if a user has access to a test
export async function hasTestAccess(userId, testId) {
  if (!userId || !testId) return false;

  try {
    // Check if test exists and is free
    const test = await prisma.test.findUnique({
      where: { id: testId },
      select: { isPaid: true, price: true },
    });

    // Free tests are accessible to everyone
    if (!test?.isPaid || test.price === 0) {
      return true;
    }

    // Check if user has purchased the test
    const payment = await prisma.payment.findFirst({
      where: {
        userId,
        testId,
        status: 'CAPTURED',
      },
    });

    return !!payment;
  } catch (error) {
    console.error('Error checking test access:', error);
    return false;
  }
}

// Middleware to protect test pages
export async function withTestAccess(handler) {
  return async (req, { params }) => {
    const session = await getServerSession(req, authOptions);
    
    if (!session) {
      return {
        redirect: {
          destination: `/auth/signin?callbackUrl=/tests/${params.testId}`,
          permanent: false,
        },
      };
    }

    const hasAccess = await hasTestAccess(session.user.id, params.testId);
    
    if (!hasAccess) {
      // Check if test exists and is paid
      const test = await prisma.test.findUnique({
        where: { id: params.testId },
        select: { isPaid: true, price: true, title: true },
      });

      if (test?.isPaid && test.price > 0) {
        return {
          redirect: {
            destination: `/tests/${params.testId}/purchase`,
            permanent: false,
          },
        };
      }
    }

    return handler(req, { params });
  };
}
