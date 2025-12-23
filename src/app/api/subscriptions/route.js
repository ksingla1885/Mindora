import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import subscriptionService from '@/services/payment/subscription.service';
import { rateLimit } from '@/lib/rate-limit';

// Rate limiting configuration
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500, // Max users per second
});

/**
 * GET /api/subscriptions
 * Get current user's subscription
 */
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Apply rate limiting
    const identifier = session.user.email;
    const { success } = await limiter.check(10, identifier); // 10 requests per minute
    
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }

    const subscription = await subscriptionService.getActiveSubscription(session.user.id);
    
    return NextResponse.json({
      subscription,
      plans: subscriptionService.PLANS,
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/subscriptions
 * Create a new subscription
 */
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { planId, paymentMethodId } = await request.json();
    
    if (!planId || !paymentMethodId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Apply rate limiting
    const identifier = session.user.email;
    const { success } = await limiter.check(5, identifier); // 5 requests per minute
    
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }

    const subscription = await subscriptionService.createSubscription({
      userId: session.user.id,
      planId,
      paymentMethod: paymentMethodId,
    });

    return NextResponse.json({ subscription });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/subscriptions
 * Update existing subscription
 */
export async function PATCH(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { planId, prorate = true } = await request.json();
    
    if (!planId) {
      return NextResponse.json(
        { error: 'Missing planId' },
        { status: 400 }
      );
    }

    // Apply rate limiting
    const identifier = session.user.email;
    const { success } = await limiter.check(5, identifier); // 5 requests per minute
    
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }

    const subscription = await subscriptionService.updateSubscription({
      userId: session.user.id,
      newPlanId: planId,
      prorate,
    });

    return NextResponse.json({ subscription });
  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to update subscription', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/subscriptions
 * Cancel subscription
 */
export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { atPeriodEnd = true } = await request.json();

    // Apply rate limiting
    const identifier = session.user.email;
    const { success } = await limiter.check(3, identifier); // 3 requests per minute
    
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }

    const subscription = await subscriptionService.cancelSubscription(
      session.user.id,
      atPeriodEnd
    );

    return NextResponse.json({ 
      message: atPeriodEnd 
        ? 'Subscription will be cancelled at the end of the billing period' 
        : 'Subscription has been cancelled',
      subscription,
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription', details: error.message },
      { status: 500 }
    );
  }
}
