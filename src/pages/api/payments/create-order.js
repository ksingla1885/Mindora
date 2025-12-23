import Razorpay from 'razorpay';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/lib/auth';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const prisma = new PrismaClient();

/**
 * @param {import('next').NextApiRequest} req
 * @param {import('next').NextApiResponse} res
 */
export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { testId, amount, currency = 'INR' } = req.body;

    if (!testId || !amount) {
      return res.status(400).json({ error: 'Test ID and amount are required' });
    }

    // Verify test exists and get details
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
      return res.status(404).json({ error: 'Test not found' });
    }

    if (!test.isPaid) {
      return res.status(400).json({ error: 'This test is free' });
    }

    // Convert amount to paise (smallest currency unit for INR)
    const amountInPaise = Math.round(parseFloat(amount) * 100);

    // Create a payment order in your database
    const payment = await prisma.payment.create({
      data: {
        userId: session.user.id,
        testId,
        amount: parseFloat(amount),
        currency,
        status: 'PENDING',
        provider: 'RAZORPAY',
        metadata: {
          testTitle: test.title,
        },
      },
    });

    // Create Razorpay order
    const options = {
      amount: amountInPaise.toString(),
      currency,
      receipt: `order_${payment.id}`,
      payment_capture: 1, // Auto-capture payment
      notes: {
        testId,
        userId: session.user.id,
        paymentId: payment.id,
      },
    };

    const order = await razorpay.orders.create(options);

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

    return res.status(200).json({
      id: order.id,
      currency: order.currency,
      amount: order.amount,
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      name: 'Mindora Education',
      description: `Payment for ${test.title}`,
      order_id: order.id,
      prefill: {
        name: session.user.name || '',
        email: session.user.email || '',
        contact: session.user.phone || '',
      },
      theme: {
        color: '#4f46e5',
      },
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    return res.status(500).json({
      error: 'Failed to create payment order',
      details: error.message,
    });
  }
}
