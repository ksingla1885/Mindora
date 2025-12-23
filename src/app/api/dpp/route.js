import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import {
  getOrCreateDPPConfig,
  updateDPPConfig,
  getTodaysDPP,
  generateDPP,
  getDPPStats,
  getDPPHistory,
  skipDPPQuestion,
  DPPError,
} from '@/services/dpp/dpp.service';

// GET /api/dpp - Get today's DPP and user configuration
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
    const includeCompleted = searchParams.get('includeCompleted') === 'true';
    const refresh = searchParams.get('refresh') === 'true';

    // Get user's DPP configuration
    const config = await getOrCreateDPPConfig(session.user.id);
    
    // Get today's DPP
    let assignments = await getTodaysDPP(session.user.id, includeCompleted);
    
    // If no assignments and refresh is requested, generate new ones
    if ((!assignments || assignments.length === 0) && refresh) {
      assignments = await generateDPP(session.user.id);
    }

    // Get user's DPP statistics
    const stats = await getDPPStats(session.user.id);

    return NextResponse.json({
      config,
      assignments,
      stats,
    });
  } catch (error) {
    console.error('Error in GET /api/dpp:', error);
    const status = error instanceof DPPError && error.code === 'UNAUTHORIZED' ? 403 : 500;
    return NextResponse.json(
      { error: error.message || 'Failed to fetch DPP' },
      { status }
    );
  }
}

// POST /api/dpp - Generate new DPP assignments
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { count } = await request.json();
    const assignments = await generateDPP(session.user.id, count);

    return NextResponse.json({ assignments });
  } catch (error) {
    console.error('Error in POST /api/dpp:', error);
    const status = error instanceof DPPError && error.code === 'UNAUTHORIZED' ? 403 : 500;
    return NextResponse.json(
      { error: error.message || 'Failed to generate DPP' },
      { status }
    );
  }
}

// PUT /api/dpp - Update DPP configuration
export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const updates = await request.json();
    const config = await updateDPPConfig(session.user.id, updates);

    return NextResponse.json({ config });
  } catch (error) {
    console.error('Error in PUT /api/dpp:', error);
    const status = error instanceof DPPError && error.code === 'UNAUTHORIZED' ? 403 : 500;
    return NextResponse.json(
      { error: error.message || 'Failed to update DPP configuration' },
      { status }
    );
  }
}

// Handle unsupported methods
export function OPTIONS() {
  return new Response(null, {
    headers: {
      'Allow': 'GET, POST, PUT, OPTIONS',
    },
  });
}

// Handle other HTTP methods
export async function HEAD() {
  return new Response(null, { status: 200 });
}

export { HEAD };
