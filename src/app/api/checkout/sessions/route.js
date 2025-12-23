import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import Razorpay from 'razorpay';
import { v4 as uuidv4 } from 'uuid';

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'You must be signed in to checkout' },
        { status: 401 }
      );
    }

    const { items, coupon } = await request.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'No items in cart' },
        { status: 400 }
      );
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, name: true, phone: true },
    });

    // Get test details and calculate total
    const testIds = items.map(item => item.testId);
    const tests = await prisma.test.findMany({
      where: { id: { in: testIds } },
      select: { id: true, title: true, price: true },
    });

    // Calculate order amount
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const test = tests.find(t => t.id === item.testId);
      if (!test) continue;
      
      const itemTotal = test.price * item.quantity;
      subtotal += itemTotal;
      
      orderItems.push({
        testId: test.id,
        title: test.title,
        price: test.price,
        quantity: item.quantity,
        total: itemTotal,
      });
    }

    // Apply coupon if provided
    let discount = 0;
    let couponApplied = null;
    
    if (coupon) {
      // In a real app, validate the coupon against your database
      const validCoupons = {
        'WELCOME10': { discount: 0.1, type: 'percentage' },
        'SAVE20': { discount: 20, type: 'fixed' },
      };
      
      const couponData = validCoupons[coupon.toUpperCase()];
      
      if (couponData) {
        couponApplied = coupon.toUpperCase();
        if (couponData.type === 'percentage') {
          discount = subtotal * couponData.discount;
        } else {
          discount = Math.min(couponData.discount, subtotal);
        }
      }
    }

    // Calculate tax (18%)
    const tax = (subtotal - discount) * 0.18;
    const total = subtotal - discount + tax;

    // Create order in database
    const order = await prisma.$transaction(async (tx) => {
      // Create order
      const order = await tx.order.create({
        data: {
          userId: session.user.id,
          orderNumber: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          subtotal,
          discount,
          tax,
          total: Math.round(total * 100), // Store in paise
          status: 'pending',
          coupon: couponApplied,
          items: {
            create: orderItems.map(item => ({
              testId: item.testId,
              quantity: item.quantity,
              price: item.price,
              total: item.total,
            })),
          },
        },
      });

      return order;
    });

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(total * 100), // Amount in paise
      currency: 'INR',
      receipt: order.orderNumber,
      payment_capture: 1, // Auto capture payment
      notes: {
        orderId: order.id,
        userId: session.user.id,
      },
    });

    // Update order with Razorpay order ID
    await prisma.order.update({
      where: { id: order.id },
      data: { 
        paymentId: razorpayOrder.id,
        paymentGateway: 'razorpay',
      },
    });

    // Return Razorpay order details to client
    return NextResponse.json({
      id: razorpayOrder.id,
      currency: razorpayOrder.currency,
      amount: razorpayOrder.amount,
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      name: 'Mindora',
      description: `Order #${order.orderNumber}`,
      order_id: order.id,
      prefill: {
        name: user.name || '',
        email: user.email || '',
        contact: user.phone || '',
      },
      notes: {
        orderId: order.id,
      },
      theme: {
        color: '#4f46e5',
      },
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
