import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/auth';

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

    // Filter by class
    const classFilter = searchParams.get('class');
    if (classFilter) {
      where.class = classFilter;
    } else {
      // If no explicit class filter, try to filter by user's class for students
      const session = await auth();
      if (session?.user?.role === 'STUDENT' && session?.user?.class) {
        where.class = session.user.class;
      }
    }

    if (isPublished !== null) {
      where.isPublished = isPublished === 'true';
    }

    // Get current user session to check for their attempts
    const session = await auth();

    // Modify query to include user's attempts info if logged in
    const includeConfig = {
      olympiad: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          testQuestions: true,
          attempts: true, // This is total attempts by everyone
        },
      },
    };

    if (session?.user?.id) {
      includeConfig.attempts = {
        where: {
          userId: session.user.id
        },
        select: {
          id: true,
          status: true,
          submittedAt: true
        }
      };
    }

    const [tests, total] = await Promise.all([
      prisma.test.findMany({
        where,
        include: includeConfig,
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
  const session = await auth();

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();

    // Validate required fields
    if (!body.title || !body.class || body.isPaid === undefined) {
      return NextResponse.json(
        { success: false, error: 'Title, class, and payment status are required' },
        { status: 400 }
      );
    }

    // Convert string dates to Date objects if provided
    let startTime = null;
    let endTime = null;

    if (body.startTime) {
      startTime = new Date(body.startTime);
    }

    if (body.endTime) {
      endTime = new Date(body.endTime);
    }

    if (startTime && endTime) {
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
    }

    if (body.isPaid && (!body.price || body.price <= 0)) {
      return NextResponse.json(
        { success: false, error: 'Price is required for paid tests' },
        { status: 400 }
      );
    }

    // Create the test data object
    const testData = {
      title: body.title,
      description: body.description || null,
      isPaid: body.isPaid || false,
      price: body.isPaid ? parseFloat(body.price) : 0,
      startTime,
      endTime,
      durationMinutes: body.durationMinutes || 60,
      isPublished: body.isPublished || false,
      createdBy: session.user.id,
      subject: body.subject,
      class: body.class,
      testType: body.testType,
      tags: body.tags || [],
      categories: body.categories || [],
      instructions: body.instructions,
      passingScore: body.passingScore ? parseFloat(body.passingScore) : null,
      allowMultipleAttempts: body.maxAttempts !== 1, // Simple mapping for now
    };

    if (body.olympiadId) {
      testData.olympiadId = body.olympiadId;
    }

    const test = await prisma.test.create({
      data: testData,
    });

    return NextResponse.json({
      success: true,
      data: test,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating test:', error);
    console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));

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
      { success: false, error: `Failed to create test: ${error.message}` },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
