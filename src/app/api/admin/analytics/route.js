import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { AdminAnalyticsService } from '@/services/analytics/adminAnalytics.service';

// Get admin analytics data
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
    const type = searchParams.get('type') || 'overview';
    const days = parseInt(searchParams.get('days')) || 30;

    let data;
    
    switch (type) {
      case 'overview':
        data = {
          stats: await AdminAnalyticsService.getPlatformStats(),
          enrollmentTrends: await AdminAnalyticsService.getEnrollmentTrends(days),
          topCourses: await AdminAnalyticsService.getCoursePerformance(),
        };
        break;
      
      case 'enrollments':
        data = await AdminAnalyticsService.getEnrollmentTrends(days);
        break;
      
      case 'demographics':
        data = await AdminAnalyticsService.getStudentDemographics();
        break;
      
      case 'revenue':
        data = await AdminAnalyticsService.getRevenueData(days);
        break;
      
      case 'courses':
        data = await AdminAnalyticsService.getCoursePerformance();
        break;
      
      default:
        return NextResponse.json(
          { error: 'Invalid analytics type' },
          { status: 400 }
        );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Admin Analytics API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}
