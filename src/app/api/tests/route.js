import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const prisma = new PrismaClient();

// GET /api/tests - List tests with optional filtering
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const olympiadId = searchParams.get('olympiadId');
    const isPublished = searchParams.get('isPublished');
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const skip = (page - 1) * limit;

    const where = {};
    
    if (olympiadId) {
      where.olympiadId = olympiadId;
    }
    
    if (isPublished !== null) {
      where.isPublished = isPublished === 'true';
    }

    const [tests, total] = await Promise.all([
      prisma.test.findMany({
        where,
        include: {
          olympiad: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              testQuestions: true,
              attempts: true,
            },
          },
        },
        orderBy: {
          startTime: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.test.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: tests,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching tests:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tests' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST /api/tests - Create a new test
export async function POST(request) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.title || !body.startTime || !body.endTime || body.isPaid === undefined) {
      return NextResponse.json(
        { success: false, error: 'Title, start time, end time, and payment status are required' },
        { status: 400 }
      );
    }

    // Convert string dates to Date objects
    const startTime = new Date(body.startTime);
    const endTime = new Date(body.endTime);
    
    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Invalid date format' },
        { status: 400 }
      );
    }
    
    if (startTime >= endTime) {
      return NextResponse.json(
        { success: false, error: 'End time must be after start time' },
        { status: 400 }
      );
    }
    
    if (body.isPaid && (!body.price || body.price <= 0)) {
      return NextResponse.json(
        { success: false, error: 'Price is required for paid tests' },
        { status: 400 }
      );
    }

    // Create the test
    const test = await prisma.test.create({
      data: {
        title: body.title,
        description: body.description || null,
        olympiadId: body.olympiadId || null,
        isPaid: body.isPaid || false,
        price: body.isPaid ? parseFloat(body.price) : 0,
        startTime,
        endTime,
        durationMinutes: body.durationMinutes || 60,
        isPublished: body.isPublished || false,
        createdBy: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      data: test,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating test:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'A test with similar details already exists' },
        { status: 400 }
      );
    }
    
    if (error.code === 'P2003') {
      return NextResponse.json(
        { success: false, error: 'Invalid olympiad ID' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to create test' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
