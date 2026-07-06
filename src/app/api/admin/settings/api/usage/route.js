import { NextResponse } from 'next/server';
import { auth } from '@/auth';

async function checkAdminAccess() {
  const session = await auth();
  if (!session) {
    return { error: 'Unauthorized', status: 401 };
  }
  if (session.user.role !== 'ADMIN') {
    return { error: 'Forbidden', status: 403 };
  }
  return { session };
}

// GET /api/admin/settings/api/usage - Get API usage analytics
export async function GET(request) {
  const { error, status } = await checkAdminAccess();
  if (error) {
    return NextResponse.json({ error }, { status });
  }

  // Generate mock usage data
  const usageData = {
    totalRequests: 124500,
    successRate: 99.2,
    avgResponseTime: 142,
    endpoints: [
      { id: '1', method: 'GET', endpoint: '/api/v1/courses', requests: 45200, successRate: 99.8, avgResponseTime: 98 },
      { id: '2', method: 'POST', endpoint: '/api/v1/submissions', requests: 12400, successRate: 98.5, avgResponseTime: 210 },
      { id: '3', method: 'GET', endpoint: '/api/v1/leaderboard', requests: 38900, successRate: 100, avgResponseTime: 45 },
      { id: '4', method: 'GET', endpoint: '/api/v1/users/profile', requests: 28000, successRate: 98.0, avgResponseTime: 115 },
    ]
  };

  return NextResponse.json({ data: usageData });
}
