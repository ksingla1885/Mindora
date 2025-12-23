import { PrismaClient } from '@prisma/client';
import Razorpay from 'razorpay';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Subscription Plans Configuration
const SUBSCRIPTION_PLANS = {
  BASIC: {
    name: 'Basic',
    description: 'Access to basic tests and features',
    amount: 19900, // in paise (₹199)
    interval: 'monthly',
    features: [
      'Access to basic test library',
      '5 tests per month',
      'Basic analytics',
      'Email support'
    ]
  },
  PREMIUM: {
    name: 'Premium',
    description: 'Full access to all tests and features',
    amount: 49900, // in paise (₹499)
    interval: 'monthly',
    features: [
      'Unlimited test access',
      'Advanced analytics',
      'Priority support',
      'Early access to new features',
      'Offline access'
    ]
  },
  // Add more plans as needed
};

/**
 * Create a new subscription for a user
 * @param {Object} options - Subscription options
 * @param {string} options.userId - User ID
 * @param {string} options.planId - Plan ID (e.g., 'BASIC', 'PREMIUM')
 * @param {string} options.paymentMethod - Payment method ID
 * @returns {Promise<Object>} Subscription details
 */
export const createSubscription = async ({ userId, planId, paymentMethod }) => {
  const plan = SUBSCRIPTION_PLANS[planId];
  if (!plan) {
    throw new Error('Invalid subscription plan');
  }

  // Check if user already has an active subscription
  const existingSubscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: { in: ['active', 'trialing', 'past_due'] },
    },
  });

  if (existingSubscription) {
    throw new Error('User already has an active subscription');
  }

  // Create subscription in Razorpay
  const razorpaySubscription = await razorpay.subscriptions.create({
    plan_id: planId.toLowerCase(),
    customer_notify: 1,
    total_count: 12, // 1 year subscription
    notes: {
      userId,
      planName: plan.name,
    },
  });

  // Create subscription in database
  const subscription = await prisma.subscription.create({
    data: {
      userId,
      planId,
      razorpaySubscriptionId: razorpaySubscription.id,
      status: razorpaySubscription.status,
      currentPeriodStart: new Date(razorpaySubscription.start_at * 1000),
      currentPeriodEnd: new Date(razorpaySubscription.end_at * 1000),
      cancelAtPeriodEnd: false,
    },
  });

  return subscription;
};

/**
 * Update a user's subscription plan
 * @param {Object} options - Update options
 * @param {string} options.userId - User ID
 * @param {string} options.newPlanId - New plan ID
 * @param {boolean} options.prorate - Whether to prorate the change
 * @returns {Promise<Object>} Updated subscription
 */
export const updateSubscription = async ({ userId, newPlanId, prorate = true }) => {
  const newPlan = SUBSCRIPTION_PLANS[newPlanId];
  if (!newPlan) {
    throw new Error('Invalid subscription plan');
  }

  // Get current subscription
  const currentSubscription = await prisma.subscription.findFirst({
    where: { userId, status: 'active' },
  });

  if (!currentSubscription) {
    throw new Error('No active subscription found');
  }

  // Calculate prorated amount if needed
  let prorationAmount = 0;
  if (prorate && currentSubscription.planId !== newPlanId) {
    prorationAmount = await calculateProration({
      currentPlanId: currentSubscription.planId,
      newPlanId,
      daysRemaining: getDaysRemaining(currentSubscription.currentPeriodEnd),
    });
  }

  // Update subscription in Razorpay
  await razorpay.subscriptions.update(currentSubscription.razorpaySubscriptionId, {
    plan_id: newPlanId.toLowerCase(),
    prorate: prorate ? 1 : 0,
    ...(prorationAmount > 0 && { proration_amount: prorationAmount }),
  });

  // Update subscription in database
  const updatedSubscription = await prisma.subscription.update({
    where: { id: currentSubscription.id },
    data: {
      planId: newPlanId,
      status: 'active',
      updatedAt: new Date(),
    },
  });

  return updatedSubscription;
};

/**
 * Cancel a user's subscription
 * @param {string} userId - User ID
 * @param {boolean} atPeriodEnd - Whether to cancel at period end
 * @returns {Promise<Object>} Cancelled subscription
 */
export const cancelSubscription = async (userId, atPeriodEnd = true) => {
  const subscription = await prisma.subscription.findFirst({
    where: { userId, status: 'active' },
  });

  if (!subscription) {
    throw new Error('No active subscription found');
  }

  if (atPeriodEnd) {
    // Schedule cancellation at period end
    await razorpay.subscriptions.cancel(subscription.razorpaySubscriptionId, {
      cancel_at_period_end: true,
    });

    return await prisma.subscription.update({
      where: { id: subscription.id },
      data: { cancelAtPeriodEnd: true },
    });
  } else {
    // Cancel immediately
    await razorpay.subscriptions.cancel(subscription.razorpaySubscriptionId);

    return await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'canceled',
        canceledAt: new Date(),
      },
    });
  }
};

/**
 * Get a user's active subscription
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} Subscription details or null if not found
 */
export const getActiveSubscription = async (userId) => {
  return await prisma.subscription.findFirst({
    where: {
      userId,
      status: { in: ['active', 'trialing'] },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
};

/**
 * Handle Razorpay subscription webhook events
 * @param {string} event - Webhook event type
 * @param {Object} payload - Webhook payload
 * @returns {Promise<void>}
 */
export const handleWebhookEvent = async (event, payload) => {
  const { subscription_id: subscriptionId } = payload.payload?.subscription?.entity || {};
  
  if (!subscriptionId) return;

  switch (event) {
    case 'subscription.charged':
      await handleSubscriptionCharged(payload);
      break;
    case 'subscription.halted':
      await handleSubscriptionHalted(payload);
      break;
    case 'subscription.paused':
      await handleSubscriptionPaused(payload);
      break;
    case 'subscription.resumed':
      await handleSubscriptionResumed(payload);
      break;
    case 'subscription.cancelled':
      await handleSubscriptionCancelled(payload);
      break;
    default:
      console.log(`Unhandled webhook event: ${event}`);
  }
};

// Helper functions
async function calculateProration({ currentPlanId, newPlanId, daysRemaining }) {
  // Implement proration logic based on your business rules
  // This is a simplified example
  const currentPlan = SUBSCRIPTION_PLANS[currentPlanId];
  const newPlan = SUBSCRIPTION_PLANS[newPlanId];
  
  if (!currentPlan || !newPlan) {
    return 0;
  }

  const dailyRate = newPlan.amount / 30; // Assuming 30-day months
  const proratedAmount = Math.round(dailyRate * daysRemaining);
  
  return Math.max(0, proratedAmount);
}

function getDaysRemaining(endDate) {
  const now = new Date();
  const end = new Date(endDate);
  const diffTime = end - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

async function handleSubscriptionCharged(payload) {
  const { subscription_id: subscriptionId } = payload.payload.subscription.entity;
  const payment = payload.payload.payment.entity;
  
  await prisma.subscription.update({
    where: { razorpaySubscriptionId: subscriptionId },
    data: {
      lastPaymentDate: new Date(),
      nextBillingDate: new Date(payload.payload.subscription.entity.charge_at * 1000),
      status: 'active',
    },
  });

  // Record payment in database
  await prisma.payment.create({
    data: {
      userId: payload.payload.subscription.entity.notes?.userId,
      amount: payment.amount / 100, // Convert from paise to rupees
      currency: payment.currency,
      status: 'COMPLETED',
      provider: 'razorpay',
      providerPaymentId: payment.id,
      subscriptionId,
      metadata: {
        invoiceId: payment.invoice_id,
        method: payment.method,
        bank: payment.bank,
        cardId: payment.card_id,
      },
    },
  });
}

async function handleSubscriptionHalted(payload) {
  const { subscription_id: subscriptionId } = payload.payload.subscription.entity;
  
  await prisma.subscription.update({
    where: { razorpaySubscriptionId: subscriptionId },
    data: {
      status: 'past_due',
      lastError: payload.payload.subscription.entity.notes?.error_description || 'Payment failed',
    },
  });
}

async function handleSubscriptionPaused(payload) {
  const { subscription_id: subscriptionId } = payload.payload.subscription.entity;
  
  await prisma.subscription.update({
    where: { razorpaySubscriptionId: subscriptionId },
    data: { status: 'paused' },
  });
}

async function handleSubscriptionResumed(payload) {
  const { subscription_id: subscriptionId } = payload.payload.subscription.entity;
  
  await prisma.subscription.update({
    where: { razorpaySubscriptionId: subscriptionId },
    data: { status: 'active' },
  });
}

async function handleSubscriptionCancelled(payload) {
  const { subscription_id: subscriptionId } = payload.payload.subscription.entity;
  
  await prisma.subscription.update({
    where: { razorpaySubscriptionId: subscriptionId },
    data: {
      status: 'canceled',
      canceledAt: new Date(),
    },
  });
}

export default {
  createSubscription,
  updateSubscription,
  cancelSubscription,
  getActiveSubscription,
  handleWebhookEvent,
  PLANS: SUBSCRIPTION_PLANS,
};
