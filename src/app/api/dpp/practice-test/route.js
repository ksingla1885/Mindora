import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { generatePracticeTest } from '@/services/dpp/dpp.service';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const count = parseInt(searchParams.get('count')) || 10;
    const subjects = searchParams.get('subjects')?.split(',') || [];
    const topics = searchParams.get('topics')?.split(',') || [];
    const difficulties = searchParams.get('difficulties')?.split(',') || ['easy', 'medium', 'hard'];

    // Generate practice test
    const questions = await generatePracticeTest(session.user.id, {
      count,
      subjects: subjects.filter(Boolean),
      topics: topics.filter(Boolean),
      difficulties: difficulties.filter(Boolean),
    });

    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Error generating practice test:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate practice test' },
      { status: error.code === 'DPP_ERROR' ? 400 : 500 }
    );
  }
}
