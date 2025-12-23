import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AnalyticsService } from '@/services/analytics/analytics.service';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated and has the right role
    if (!session || !['admin', 'analyst'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = searchParams.get('endDate') || new Date();

    const dateRange = {
      from: new Date(startDate),
      to: new Date(endDate)
    };

    // Fetch all analytics data in parallel
    const [
      userEngagement,
      contentPerformance,
      testPerformance,
      userActivity
    ] = await Promise.all([
      AnalyticsService.getUserEngagementMetrics(dateRange),
      AnalyticsService.getContentPerformance(dateRange),
      AnalyticsService.getTestPerformance(dateRange),
      AnalyticsService.getRecentUserActivity(10) // Get last 10 activities
    ]);

    return NextResponse.json({
      success: true,
      data: {
        userEngagement,
        contentPerformance,
        testPerformance,
        userActivity
      },
      dateRange: {
        start: dateRange.from.toISOString(),
        end: dateRange.to.toISOString()
      }
    });

  } catch (error) {
    console.error('Analytics API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch analytics data',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
