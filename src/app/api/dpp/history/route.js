import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getDPPHistory, DPPError } from '@/services/dpp/dpp.service';

// GET /api/dpp/history - Get DPP history with filters
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const subjectId = searchParams.get('subjectId');
    const topicId = searchParams.get('topicId');
    const difficulty = searchParams.get('difficulty');
    const isCorrect = searchParams.get('isCorrect');

    const result = await getDPPHistory(session.user.id, {
      page,
      limit,
      fromDate,
      toDate,
      subjectId,
      topicId,
      difficulty,
      isCorrect: isCorrect ? isCorrect === 'true' : undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in GET /api/dpp/history:', error);
    const status = error instanceof DPPError && error.code === 'UNAUTHORIZED' ? 403 : 500;
    return NextResponse.json(
      { error: error.message || 'Failed to fetch DPP history' },
      { status }
    );
  }
}

// Handle unsupported methods
export function OPTIONS() {
  return new Response(null, {
    headers: {
      'Allow': 'GET, OPTIONS',
    },
  });
}

// Handle other HTTP methods
export async function HEAD() {
  return new Response(null, { status: 200 });
}

export { HEAD };
