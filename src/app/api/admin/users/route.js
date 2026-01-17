// MINDORA USER API - UPDATED
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const session = await auth();
    console.log('GET /api/admin/users - Session:', !!session);
    const userRole = session?.user?.role?.toLowerCase();

    if (!session || (userRole !== 'admin' && userRole !== 'teacher')) {
      return NextResponse.json(
        { error: 'Unauthorized', role: session?.user?.role },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const pageSize = parseInt(searchParams.get('pageSize')) || 10;
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const sort = searchParams.get('sort') || 'newest';

    const where = {
      AND: [
        {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        },
      ],
    };

    // Enforce STUDENT role only as per requirement
    where.role = 'STUDENT';

    if (status === 'active') {
      where.emailVerified = { not: null };
    } else if (status === 'pending') {
      where.emailVerified = null;
    } else if (status === 'inactive') {
      where.isActive = false;
    }

    let orderBy = {};
    if (sort === 'newest') orderBy = { createdAt: 'desc' };
    else if (sort === 'oldest') orderBy = { createdAt: 'asc' };
    else if (sort === 'name-asc') orderBy = { name: 'asc' };
    else if (sort === 'name-desc') orderBy = { name: 'desc' };

    const total = await prisma.user.count({ where });

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        class: true, // Added class
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            testAttempts: true,
            payments: true,
            contentItems: true,
          },
        },
      },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return NextResponse.json({
      data: users,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await auth();
    const userRole = session?.user?.role?.toLowerCase();

    if (!session || userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin required' },
        { status: 401 }
      );
    }

    const { email, name, role, sendInvite = true } = await request.json();

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    const user = await prisma.user.create({
      data: {
        email,
        name,
        role,
        emailVerified: null,
      },
    });

    if (sendInvite) {
      console.log(`Send invitation email to ${email}`);
    }

    return NextResponse.json({ data: user }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
