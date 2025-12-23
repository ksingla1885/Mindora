import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { AnalyticsService } from '@/services/analytics/analytics.service';

// Get test analytics
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const testId = searchParams.get('testId');
    const cohortId = searchParams.get('cohortId');
    const type = searchParams.get('type') || 'test';

    if (type === 'test' && !testId) {
      return NextResponse.json(
        { error: 'Test ID is required' },
        { status: 400 }
      );
    }

    if (type === 'cohort' && !cohortId) {
      return NextResponse.json(
        { error: 'Cohort ID is required' },
        { status: 400 }
      );
    }

    let data;
    if (type === 'test') {
      data = await AnalyticsService.getTestAnalytics(testId);
    } else if (type === 'cohort') {
      data = await AnalyticsService.getCohortAnalysis(cohortId);
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Analytics API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}
