import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // 1. Cleanup abandoned test attempts (e.g. In progress for > 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const result = await prisma.testAttempt.updateMany({
      where: {
        status: { in: ['in_progress', 'IN_PROGRESS'] },
        startedAt: { lt: yesterday }
      },
      data: {
        status: 'ABANDONED',
        submittedAt: new Date()
      }
    });

    // 2. Clear old test analytics cache if any (logic as needed)

    return NextResponse.json({
      success: true,
      cleanedUp: result.count,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Cron job failed:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
