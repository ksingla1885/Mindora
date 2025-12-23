import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500, // Max 500 users per second
});

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'You must be signed in to view orders' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Apply rate limiting
    const identifier = session.user.id;
    await limiter.check(10, identifier); // 10 requests per minute

    // Build where clause
    const where = { userId: session.user.id };
    if (status && status !== 'all') {
      where.status = status;
    }

    // Get orders with pagination
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              test: {
                select: {
                  title: true,
                  image: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      prisma.order.count({ where }),
    ]);

    // Format response
    const formattedOrders = orders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      total: order.total,
      createdAt: order.createdAt,
      items: order.items.map(item => ({
        id: item.id,
        testId: item.testId,
        title: item.test?.title || 'Test',
        image: item.test?.image,
        price: item.price,
        quantity: item.quantity,
        total: item.total,
      })),
    }));

    return NextResponse.json({
      orders: formattedOrders,
      pagination: {
        total,
        page,
        totalPages: Math.ceil(total / limit),
        limit,
      },
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    
    if (error.message.includes('rate limit exceeded')) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'You must be signed in to create an order' },
        { status: 401 }
      );
    }

    // Apply rate limiting
    const identifier = session.user.id;
    await limiter.check(5, identifier); // 5 requests per minute

    const { items, coupon, paymentMethod, billingAddress } = await request.json();

    // Validate request
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'No items in order' },
        { status: 400 }
      );
    }

    // Get test details and calculate totals
    const testIds = items.map(item => item.testId);
    const tests = await prisma.test.findMany({
      where: { id: { in: testIds } },
      select: { 
        id: true, 
        title: true, 
        price: true,
        isPublished: true,
      },
    });

    // Check if all tests exist and are published
    const invalidTests = items.some(
      item => !tests.find(t => t.id === item.testId && t.isPublished)
    );
    
    if (invalidTests) {
      return NextResponse.json(
        { error: 'One or more tests are not available' },
        { status: 400 }
      );
    }

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
          paymentStatus: 'pending',
          paymentMethod: paymentMethod || 'online',
          coupon: couponApplied,
          billingAddress: billingAddress ? {
            create: {
              name: billingAddress.name,
              email: billingAddress.email,
              phone: billingAddress.phone,
              line1: billingAddress.line1,
              line2: billingAddress.line2,
              city: billingAddress.city,
              state: billingAddress.state,
              postalCode: billingAddress.postalCode,
              country: billingAddress.country,
            },
          } : undefined,
          items: {
            create: orderItems.map(item => ({
              testId: item.testId,
              quantity: item.quantity,
              price: item.price,
              total: item.total,
            })),
          },
          updates: {
            create: [
              {
                status: 'pending',
                message: 'Order created and awaiting payment',
              },
            ],
          },
        },
        include: {
          items: true,
          billingAddress: true,
          updates: true,
        },
      });

      return order;
    });

    return NextResponse.json({
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        subtotal: order.subtotal,
        discount: order.discount,
        tax: order.tax,
        total: order.total,
        createdAt: order.createdAt,
        items: order.items.map(item => ({
          id: item.id,
          testId: item.testId,
          title: orderItems.find(oi => oi.testId === item.testId)?.title || 'Test',
          price: item.price,
          quantity: item.quantity,
          total: item.total,
        })),
        billingAddress: order.billingAddress,
      },
    });
  } catch (error) {
    console.error('Error creating order:', error);
    
    if (error.message.includes('rate limit exceeded')) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
