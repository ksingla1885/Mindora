import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const prisma = new PrismaClient();

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
    const page = parseInt(searchParams.get('page')) || 1;
    const pageSize = parseInt(searchParams.get('pageSize')) || 10;
    const search = searchParams.get('search') || '';
    const subjectId = searchParams.get('subjectId') || '';
    const isPublished = searchParams.get('isPublished');
    const isPaid = searchParams.get('isPaid');
    
    const skip = (page - 1) * pageSize;
    
    const where = {};
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (subjectId) {
      where.subjectId = subjectId;
    }
    
    if (isPublished !== null) {
      where.isPublished = isPublished === 'true';
    }
    
    if (isPaid !== null) {
      where.isPaid = isPaid === 'true';
    }
    
    const [tests, total] = await Promise.all([
      prisma.test.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          subject: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              questions: true,
              attempts: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.test.count({ where }),
    ]);
    
    return NextResponse.json({
      data: tests.map(test => ({
        ...test,
        questionsCount: test._count.questions,
        attemptsCount: test._count.attempts,
        _count: undefined,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
    
  } catch (error) {
    console.error('Error fetching tests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tests' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const {
      title,
      description,
      subjectId,
      duration,
      totalMarks,
      passingMarks,
      isPublished,
      isPaid,
      price,
      startDate,
      endDate,
      instructions,
      questions,
    } = await request.json();
    
    // Validate required fields
    if (!title || !subjectId || !duration || !totalMarks || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
      return NextResponse.json(
        { error: 'Invalid date range' },
        { status: 400 }
      );
    }
    
    // Validate passing marks
    if (passingMarks > totalMarks) {
      return NextResponse.json(
        { error: 'Passing marks cannot be greater than total marks' },
        { status: 400 }
      );
    }
    
    // Create test
    const test = await prisma.$transaction(async (tx) => {
      // Create the test
      const newTest = await tx.test.create({
        data: {
          title,
          description: description || '',
          subjectId,
          duration: parseInt(duration),
          totalMarks: parseInt(totalMarks),
          passingMarks: parseInt(passingMarks) || 0,
          isPublished: !!isPublished,
          isPaid: !!isPaid,
          price: isPaid ? parseFloat(price) || 0 : 0,
          startDate: start,
          endDate: end,
          instructions: instructions || 'Read all questions carefully before answering.',
          createdBy: session.user.id,
        },
      });
      
      // Add questions to the test
      if (Array.isArray(questions) && questions.length > 0) {
        await tx.testQuestion.createMany({
          data: questions.map((q, index) => ({
            testId: newTest.id,
            questionId: q.questionId,
            marks: parseInt(q.marks) || 1,
            sequence: index + 1,
          })),
        });
      }
      
      return newTest;
    });
    
    return NextResponse.json(test, { status: 201 });
    
  } catch (error) {
    console.error('Error creating test:', error);
    return NextResponse.json(
      { error: 'Failed to create test', details: error.message },
      { status: 500 }
    );
  }
}
