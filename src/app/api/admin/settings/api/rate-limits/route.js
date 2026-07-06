import { NextResponse } from 'next/server';
import { auth } from '@/auth';

global._rateLimits = global._rateLimits || [
  { id: 'limit_1', path: '*', limit: 1000, window: '1h' },
  { id: 'limit_2', path: 'courses/*', limit: 100, window: '1m' },
];

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

// GET /api/admin/settings/api/rate-limits - Get rate limits
export async function GET(request) {
  const { error, status } = await checkAdminAccess();
  if (error) {
    return NextResponse.json({ error }, { status });
  }

  return NextResponse.json({ data: global._rateLimits });
}

// POST /api/admin/settings/api/rate-limits - Add a rate limit
export async function POST(request) {
  const { error, status } = await checkAdminAccess();
  if (error) {
    return NextResponse.json({ error }, { status });
  }

  try {
    const data = await request.json();
    if (!data.path || !data.limit || !data.window) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newLimit = {
      id: Date.now().toString(),
      path: data.path.startsWith('/') ? data.path : `/${data.path}`,
      limit: Number(data.limit),
      window: data.window
    };

    global._rateLimits.unshift(newLimit);

    return NextResponse.json({
      success: true,
      data: newLimit
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding rate limit:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
