import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get total students
    const totalStudents = await prisma.user.count({
      where: { role: 'STUDENT' }
    });
    
    // Get total tests
    const totalTests = await prisma.test.count();
    
    // Get total test attempts
    const totalAttempts = await prisma.testAttempt.count();
    
    // Get total revenue (from payments)
    const revenueResult = await prisma.payment.aggregate({
      _sum: {
        amount: true
      },
      where: {
        status: 'COMPLETED'
      }
    });
    
    // Get recent test attempts
    const recentAttempts = await prisma.testAttempt.findMany({
      take: 5,
      orderBy: {
        submittedAt: 'desc'
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        test: {
          select: {
            title: true
          }
        }
      }
    });
    
    // Get test participation data for the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const participationData = await prisma.$queryRaw`
      SELECT 
        DATE("submittedAt") as date,
        COUNT(*) as count
      FROM "TestAttempt"
      WHERE "submittedAt" >= ${sevenDaysAgo}
      GROUP BY DATE("submittedAt")
      ORDER BY date ASC
    `;
    
    return NextResponse.json({
      stats: {
        totalStudents,
        totalTests,
        totalAttempts,
        totalRevenue: revenueResult._sum.amount || 0
      },
      recentAttempts: recentAttempts.map(attempt => ({
        id: attempt.id,
        userName: attempt.user.name || attempt.user.email,
        testTitle: attempt.test?.title || 'Test',
        score: attempt.score,
        submittedAt: attempt.submittedAt
      })),
      participationData: participationData.map(item => ({
        date: item.date.toISOString().split('T')[0],
        count: parseInt(item.count)
      }))
    });
    
  } catch (error) {
    console.error('Error fetching admin analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}
