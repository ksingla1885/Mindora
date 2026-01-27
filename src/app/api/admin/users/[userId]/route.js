import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function GET(request, { params }) {
  try {
    const session = await auth();
    const userRole = session?.user?.role?.toLowerCase();

    if (!session || (userRole !== 'admin' && userRole !== 'teacher')) {
      return NextResponse.json(
        { error: 'Unauthorized', role: session?.user?.role },
        { status: 401 }
      );
    }

    const { userId } = await params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        class: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        profileMeta: true,
        _count: {
          select: {
            testAttempts: true,
            payments: true,
            contentItems: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: user });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await auth();
    const userRole = session?.user?.role?.toLowerCase();

    if (!session || userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin required' },
        { status: 401 }
      );
    }

    const { userId } = await params;
    const { name, email, role, class: userClass, profileMeta } = await request.json();

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        email,
        role,
        class: userClass,
        profileMeta: profileMeta || {}
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        class: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return NextResponse.json({ data: updatedUser });
  } catch (error) {
    console.error('Error updating user:', error);

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await auth();
    const userRole = session?.user?.role?.toLowerCase();

    if (!session || userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin required' },
        { status: 401 }
      );
    }

    const { userId } = await params;

    // Prevent deleting your own account
    if (session.user.id === userId) {
      return NextResponse.json(
        { error: 'You cannot delete your own account' },
        { status: 400 }
      );
    }

    // Delete related records first
    await prisma.$transaction([
      prisma.testAttempt.deleteMany({ where: { userId } }),
      prisma.payment.deleteMany({ where: { userId } }),
      prisma.contentComment.deleteMany({ where: { userId } }),
      prisma.userBadge.deleteMany({ where: { userId } }),
      // Add other related deletes as needed
    ]);

    // Then delete the user
    await prisma.user.delete({
      where: { id: userId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
