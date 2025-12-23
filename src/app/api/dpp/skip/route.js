import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { skipDPPQuestion, DPPError } from '@/services/dpp/dpp.service';

// POST /api/dpp/skip - Skip a DPP question
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { assignmentId } = await request.json();
    
    if (!assignmentId) {
      return NextResponse.json(
        { error: 'Assignment ID is required' },
        { status: 400 }
      );
    }

    const result = await skipDPPQuestion(assignmentId, session.user.id);
    return NextResponse.json({ result });
  } catch (error) {
    console.error('Error in POST /api/dpp/skip:', error);
    const status = error instanceof DPPError && error.code === 'UNAUTHORIZED' ? 403 : 500;
    return NextResponse.json(
      { error: error.message || 'Failed to skip question' },
      { status }
    );
  }
}

// Handle unsupported methods
export function OPTIONS() {
  return new Response(null, {
    headers: {
      'Allow': 'POST, OPTIONS',
    },
  });
}

// Handle other HTTP methods
export async function HEAD() {
  return new Response(null, { status: 200 });
}

export { HEAD };
