import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'You must be signed in to sync your cart' },
        { status: 401 }
      );
    }

    const { items: localItems } = await request.json();
    
    // Get the user's current cart from the database
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

    // Get test IDs from local storage
    const localTestIds = localItems.map(item => item.testId);
    
    // Get test IDs from database
    const dbTestIds = cart.items.map(item => item.testId);

    // Find items to add (in local but not in DB)
    const itemsToAdd = localItems.filter(
      item => !dbTestIds.includes(item.testId)
    );

    // Find items to update (in both local and DB, different quantities)
    const itemsToUpdate = localItems.filter(localItem => {
      const dbItem = cart.items.find(item => item.testId === localItem.testId);
      return dbItem && dbItem.quantity !== localItem.quantity;
    });

    // Find items to remove (in DB but not in local)
    const itemsToRemove = cart.items.filter(
      dbItem => !localTestIds.includes(dbItem.testId)
    );

    // Perform database operations in a transaction
    const [updatedCart] = await prisma.$transaction([
      // Update existing items
      ...itemsToUpdate.map(item => 
        prisma.cartItem.updateMany({
          where: { 
            cartId: cart.id,
            testId: item.testId,
          },
          data: { 
            quantity: item.quantity,
            updatedAt: new Date(),
          },
        })
      ),
      
      // Add new items
      ...(itemsToAdd.length > 0 ? [
        prisma.cart.update({
          where: { id: cart.id },
          data: {
            items: {
              create: itemsToAdd.map(item => ({
                testId: item.testId,
                quantity: item.quantity,
                price: item.price,
              })),
            },
          },
          include: { items: true },
        })
      ] : [prisma.cart.findUnique({ 
        where: { id: cart.id },
        include: { items: true },
      })]),
      
      // Remove items not in local storage
      ...(itemsToRemove.length > 0 ? [
        prisma.cartItem.deleteMany({
          where: {
            id: { in: itemsToRemove.map(item => item.id) },
            cartId: cart.id,
          },
        })
      ] : []),
    ]);

    // Get the final cart with test details
    const finalCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: {
        items: {
          include: {
            test: true,
          },
        },
      },
    });

    return NextResponse.json({
      cart: {
        items: finalCart.items.map(item => ({
          id: item.id,
          testId: item.testId,
          title: item.test.title,
          description: item.test.description,
          price: item.price,
          image: item.test.image,
          difficulty: item.test.difficulty,
          duration: item.test.duration,
          quantity: item.quantity,
        })),
      },
    });
  } catch (error) {
    console.error('Error syncing cart:', error);
    return NextResponse.json(
      { error: 'Failed to sync cart' },
      { status: 500 }
    );
  }
}
