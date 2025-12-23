import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500, // Max 500 users per second
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'You must be signed in to view your cart' },
        { status: 401 }
      );
    }

    // Get user's cart with test details
    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
      include: {
        items: {
          include: {
            test: true,
          },
        },
      },
    });

    if (!cart) {
      return NextResponse.json({ items: [] });
    }

    return NextResponse.json({
      items: cart.items.map(item => ({
        id: item.id,
        testId: item.testId,
        title: item.test.title,
        description: item.test.description,
        price: item.test.price,
        image: item.test.image,
        difficulty: item.test.difficulty,
        duration: item.test.duration,
        quantity: item.quantity,
      })),
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cart' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'You must be signed in to add to cart' },
        { status: 401 }
      );
    }

    // Apply rate limiting
    const identifier = session.user.id;
    await limiter.check(10, identifier); // 10 requests per minute

    const { testId, quantity = 1 } = await request.json();

    if (!testId) {
      return NextResponse.json(
        { error: 'Test ID is required' },
        { status: 400 }
      );
    }

    // Verify test exists and is available for purchase
    const test = await prisma.test.findUnique({
      where: { id: testId, isPublished: true },
    });

    if (!test) {
      return NextResponse.json(
        { error: 'Test not found or not available' },
        { status: 404 }
      );
    }

    // Check if user already has this test
    const userTest = await prisma.userTest.findFirst({
      where: {
        userId: session.user.id,
        testId: testId,
      },
    });

    if (userTest) {
      return NextResponse.json(
        { error: 'You already have access to this test' },
        { status: 400 }
      );
    }

    // Check if test is already in cart
    let cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
      include: { items: true },
    });

    // Create cart if it doesn't exist
    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId: session.user.id,
        },
        include: { items: true },
      });
    }

    // Check if item is already in cart
    const existingItem = cart.items.find(item => item.testId === testId);
    let updatedCart;

    if (existingItem) {
      // Update quantity if item exists
      updatedCart = await prisma.cart.update({
        where: { id: cart.id },
        data: {
          items: {
            update: {
              where: { id: existingItem.id },
              data: { 
                quantity: existingItem.quantity + quantity,
                updatedAt: new Date(),
              },
            },
          },
        },
        include: {
          items: {
            include: {
              test: true,
            },
          },
        },
      });
    } else {
      // Add new item to cart
      updatedCart = await prisma.cart.update({
        where: { id: cart.id },
        data: {
          items: {
            create: {
              testId,
              quantity,
              price: test.price,
            },
          },
        },
        include: {
          items: {
            include: {
              test: true,
            },
          },
        },
      });
    }

    return NextResponse.json({
      message: 'Item added to cart',
      cart: {
        items: updatedCart.items.map(item => ({
          id: item.id,
          testId: item.testId,
          title: item.test.title,
          price: item.price,
          quantity: item.quantity,
        })),
      },
    });
  } catch (error) {
    console.error('Error adding to cart:', error);
    
    if (error.message.includes('rate limit exceeded')) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to add to cart' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'You must be signed in to clear your cart' },
        { status: 401 }
      );
    }

    // Delete all items in the cart
    await prisma.cartItem.deleteMany({
      where: {
        cart: {
          userId: session.user.id,
        },
      },
    });

    return NextResponse.json({ message: 'Cart cleared' });
  } catch (error) {
    console.error('Error clearing cart:', error);
    return NextResponse.json(
      { error: 'Failed to clear cart' },
      { status: 500 }
    );
  }
}
