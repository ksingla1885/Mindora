import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// Update cart item quantity
export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'You must be signed in to update your cart' },
        { status: 401 }
      );
    }

    const { itemId } = params;
    const { quantity } = await request.json();

    if (quantity < 1) {
      return NextResponse.json(
        { error: 'Quantity must be at least 1' },
        { status: 400 }
      );
    }

    // Verify the item belongs to the user's cart
    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cart: {
          userId: session.user.id,
        },
      },
      include: {
        cart: true,
      },
    });

    if (!cartItem) {
      return NextResponse.json(
        { error: 'Item not found in your cart' },
        { status: 404 }
      );
    }

    // Update the quantity
    const updatedItem = await prisma.cartItem.update({
      where: { id: itemId },
      data: { 
        quantity,
        updatedAt: new Date(),
      },
      include: {
        test: true,
      },
    });

    return NextResponse.json({
      message: 'Cart updated',
      item: {
        id: updatedItem.id,
        testId: updatedItem.testId,
        title: updatedItem.test.title,
        price: updatedItem.price,
        quantity: updatedItem.quantity,
      },
    });
  } catch (error) {
    console.error('Error updating cart item:', error);
    return NextResponse.json(
      { error: 'Failed to update cart item' },
      { status: 500 }
    );
  }
}

// Remove item from cart
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'You must be signed in to update your cart' },
        { status: 401 }
      );
    }

    const { itemId } = params;

    // Verify the item belongs to the user's cart
    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cart: {
          userId: session.user.id,
        },
      },
    });

    if (!cartItem) {
      return NextResponse.json(
        { error: 'Item not found in your cart' },
        { status: 404 }
      );
    }

    // Delete the item
    await prisma.cartItem.delete({
      where: { id: itemId },
    });

    return NextResponse.json({ message: 'Item removed from cart' });
  } catch (error) {
    console.error('Error removing item from cart:', error);
    return NextResponse.json(
      { error: 'Failed to remove item from cart' },
      { status: 500 }
    );
  }
}
