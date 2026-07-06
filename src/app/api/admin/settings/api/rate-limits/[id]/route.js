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

// DELETE /api/admin/settings/api/rate-limits/[id] - Remove rate limit
export async function DELETE(request, { params }) {
  const { error, status } = await checkAdminAccess();
  if (error) {
    return NextResponse.json({ error }, { status });
  }

  try {
    const { id } = await params;
    
    global._rateLimits = global._rateLimits || [];
    const limitIndex = global._rateLimits.findIndex(l => l.id === id);
    
    if (limitIndex === -1) {
      return NextResponse.json({ error: 'Rate limit not found' }, { status: 404 });
    }

    global._rateLimits.splice(limitIndex, 1);

    return NextResponse.json({
      success: true,
      message: 'Rate limit removed successfully'
    });
  } catch (error) {
    console.error('Error removing rate limit:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
