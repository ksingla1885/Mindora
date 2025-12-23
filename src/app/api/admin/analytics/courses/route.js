import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

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
    const courseId = searchParams.get('courseId');
    const timeRange = searchParams.get('timeRange') || '30d';

    // Calculate date range based on timeRange
    const now = new Date();
    let startDate = new Date();
    
    switch (timeRange) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case '90d':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case '12m':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(now.getMonth() - 1);
    }

    // Get course details
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          include: {
            lessons: true,
            quizzes: true,
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Get enrollment data
    const enrollments = await prisma.enrollment.findMany({
      where: {
        courseId,
        enrolledAt: { gte: startDate },
      },
      include: {
        user: true,
        progress: true,
        payments: {
          where: {
            status: 'COMPLETED',
          },
        },
      },
    });

    // Calculate metrics
    const totalEnrollments = enrollments.length;
    const activeEnrollments = enrollments.filter(
      (e) => e.progress && e.progress.completedAt === null
    ).length;
    const completedEnrollments = enrollments.filter(
      (e) => e.progress && e.progress.completedAt !== null
    ).length;
    const completionRate = totalEnrollments > 0 
      ? (completedEnrollments / totalEnrollments) * 100 
      : 0;

    // Calculate revenue
    const revenue = enrollments.reduce((sum, enrollment) => {
      return sum + (enrollment.payments[0]?.amount || 0);
    }, 0);

    // Calculate progress by module
    const moduleProgress = await Promise.all(
      course.modules.map(async (module) => {
        const moduleEnrollments = await prisma.moduleProgress.count({
          where: {
            moduleId: module.id,
            completed: true,
          },
        });

        return {
          id: module.id,
          title: module.title,
          totalStudents: totalEnrollments,
          completed: moduleEnrollments,
          completionRate: totalEnrollments > 0 
            ? (moduleEnrollments / totalEnrollments) * 100 
            : 0,
        };
      })
    );

    // Calculate assessment performance
    const quizResults = await prisma.quizAttempt.groupBy({
      by: ['quizId'],
      where: {
        quiz: {
          module: {
            courseId,
          },
        },
        submittedAt: { gte: startDate },
      },
      _avg: {
        score: true,
      },
      _count: {
        id: true,
      },
    });

    const assessmentPerformance = quizResults.map((quiz) => ({
      quizId: quiz.quizId,
      averageScore: quiz._avg.score || 0,
      attempts: quiz._count.id,
    }));

    // Time series data for enrollments
    const enrollmentData = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('day', "enrolledAt") as date,
        COUNT(*) as count
      FROM "Enrollment"
      WHERE 
        "courseId" = ${courseId}
        AND "enrolledAt" >= ${startDate}
      GROUP BY DATE_TRUNC('day', "enrolledAt")
      ORDER BY date ASC
    `;

    // Format response
    const response = {
      course: {
        id: course.id,
        title: course.title,
        description: course.description,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt,
      },
      metrics: {
        totalEnrollments,
        activeEnrollments,
        completedEnrollments,
        completionRate: parseFloat(completionRate.toFixed(2)),
        revenue,
        averageRating: course.averageRating || 0,
        totalModules: course.modules.length,
        totalLessons: course.modules.reduce(
          (sum, module) => sum + module.lessons.length,
          0
        ),
        totalQuizzes: course.modules.reduce(
          (sum, module) => sum + module.quizzes.length,
          0
        ),
      },
      moduleProgress,
      assessmentPerformance,
      enrollmentData: enrollmentData.map((item) => ({
        date: item.date,
        count: Number(item.count),
      })),
    };

    return NextResponse.json({ data: response });
  } catch (error) {
    console.error('Error fetching course analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course analytics' },
      { status: 500 }
    );
  }
}
