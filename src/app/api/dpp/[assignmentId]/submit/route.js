import { NextResponse } from 'next/server';
import { auth } from '@/auth'; // Assuming auth-js v5 or similar setup
import { submitDPPAnswer } from '@/services/dpp/dpp.service';

export async function POST(request, { params }) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { assignmentId } = params;
    const { answer, timeSpent } = await request.json();

    if (!answer) {
      return NextResponse.json({ error: 'Answer is required' }, { status: 400 });
    }

    const result = await submitDPPAnswer(assignmentId, session.user.id, answer, { timeSpent });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in DPP submit API:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit answer' },
      { status: error.code === 'NOT_FOUND' ? 404 : 500 }
    );
  }
}
