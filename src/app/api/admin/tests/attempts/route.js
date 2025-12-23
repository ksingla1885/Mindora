import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const prisma = new PrismaClient();

// Helper function to build where clause based on filters
function buildWhereClause(filters) {
  const where = {};
  
  if (filters.search) {
    where.OR = [
      { user: { name: { contains: filters.search, mode: 'insensitive' } } },
      { user: { email: { contains: filters.search, mode: 'insensitive' } } },
      { test: { title: { contains: filters.search, mode: 'insensitive' } } },
    ];
  }
  
  if (filters.testId) {
    where.testId = filters.testId;
  }
  
  if (filters.userId) {
    where.userId = filters.userId;
  }
  
  if (filters.status) {
    where.status = filters.status;
  }
  
  if (filters.minScore || filters.maxScore) {
    where.score = {};
    if (filters.minScore) where.score.gte = parseFloat(filters.minScore);
    if (filters.maxScore) where.score.lte = parseFloat(filters.maxScore);
  }
  
  if (filters.startDate || filters.endDate) {
    where.startedAt = {};
    if (filters.startDate) where.startedAt.gte = new Date(filters.startDate);
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setDate(endDate.getDate() + 1); // Include the entire end date
      where.startedAt.lt = endDate;
    }
  }
  
  return where;
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    
    // Pagination
    const page = parseInt(searchParams.get('page')) || 1;
    const pageSize = Math.min(parseInt(searchParams.get('pageSize')) || 10, 100);
    const skip = (page - 1) * pageSize;
    
    // Filters
    const filters = {
      search: searchParams.get('search') || '',
      testId: searchParams.get('testId') || '',
      userId: searchParams.get('userId') || '',
      status: searchParams.get('status') || '',
      minScore: searchParams.get('minScore') || '',
      maxScore: searchParams.get('maxScore') || '',
      startDate: searchParams.get('startDate') || '',
      endDate: searchParams.get('endDate') || ''
    };
    
    const where = buildWhereClause(filters);
    
    // Get total count for pagination
    const total = await prisma.testAttempt.count({ where });
    
    // Get paginated attempts with related data
    const attempts = await prisma.testAttempt.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: {
        startedAt: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        test: {
          select: {
            id: true,
            title: true,
            subject: true,
          },
        },
      },
    });
    
    return NextResponse.json({
      data: attempts,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
    
  } catch (error) {
    console.error('Error fetching test attempts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch test attempts' },
      { status: 500 }
    );
  }
}
