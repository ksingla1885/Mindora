import prisma from '@/lib/prisma';
import { startOfDay, endOfDay, subDays, format, isWithinInterval } from 'date-fns';

export const AdminAnalyticsService = {
  // Get overall platform statistics
  async getPlatformStats() {
    const [totalStudents, totalInstructors, totalCourses, totalRevenue] = await Promise.all([
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.user.count({ where: { role: 'INSTRUCTOR' } }),
      prisma.course.count(),
      this.calculateTotalRevenue(),
    ]);

    return {
      totalStudents,
      totalInstructors,
      totalCourses,
      totalRevenue,
    };
  },

  // Get enrollment trends over time
  async getEnrollmentTrends(days = 30) {
    const endDate = new Date();
    const startDate = subDays(endDate, days);
    
    const enrollments = await prisma.enrollment.findMany({
      where: {
        enrolledAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        enrolledAt: true,
      },
      orderBy: {
        enrolledAt: 'asc',
      },
    });

    // Group by day
    const dailyEnrollments = enrollments.reduce((acc, { enrolledAt }) => {
      const date = format(new Date(enrolledAt), 'yyyy-MM-dd');
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    // Fill in missing days with 0
    const result = [];
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      result.push({
        date: dateStr,
        count: dailyEnrollments[dateStr] || 0,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return result;
  },

  // Get student demographics
  async getStudentDemographics() {
    const demographics = await prisma.user.groupBy({
      by: ['country'],
      where: {
        role: 'STUDENT',
        country: { not: null },
      },
      _count: {
        country: true,
      },
      orderBy: {
        _count: {
          country: 'desc',
        },
      },
      take: 10,
    });

    return demographics.map(d => ({
      name: d.country,
      value: d._count.country,
    }));
  },

  // Get course performance metrics
  async getCoursePerformance() {
    const courses = await prisma.course.findMany({
      include: {
        enrollments: true,
        reviews: true,
      },
      take: 10,
    });

    return courses.map(course => ({
      id: course.id,
      title: course.title,
      enrollments: course.enrollments.length,
      averageRating: course.reviews.length > 0 
        ? course.reviews.reduce((sum, r) => sum + r.rating, 0) / course.reviews.length 
        : 0,
      completionRate: course.enrollments.length > 0
        ? (course.enrollments.filter(e => e.completed).length / course.enrollments.length) * 100
        : 0,
    }));
  },

  // Calculate total revenue (simplified example)
  async calculateTotalRevenue() {
    const result = await prisma.payment.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        status: 'COMPLETED',
      },
    });

    return result._sum.amount || 0;
  },

  // Get revenue data
  async getRevenueData(days = 30) {
    const endDate = new Date();
    const startDate = subDays(endDate, days);

    const payments = await prisma.payment.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        amount: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group by day
    const dailyRevenue = {};
    payments.forEach(payment => {
      const date = format(new Date(payment.createdAt), 'yyyy-MM-dd');
      dailyRevenue[date] = (dailyRevenue[date] || 0) + payment.amount;
    });

    // Fill in missing days with 0
    const result = [];
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      result.push({
        date: dateStr,
        amount: dailyRevenue[dateStr] || 0,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return result;
  },
};

export default AdminAnalyticsService;
