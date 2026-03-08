import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getTodaysDPP } from '@/services/dpp/dpp.service';

/**
 * GET /api/dpp/today - Retrieves today's Daily Practice Problem (DPP) assignments for the authenticated user.
 * It uses the centralized getTodaysDPP service to fetch or generate assignments based on user configuration.
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Use service to get today's DPP
    // Returns a list of assignments (typically 1-5 questions depending on config)
    const { assignments } = await getTodaysDPP(session.user.id);

    // If no assignments after generation attempt
    if (!assignments || assignments.length === 0) {
      return NextResponse.json(
        { message: 'No questions available for today. Please check your configuration.' },
        { status: 200 }
      );
    }

    // For the widget which might expect a single question or the whole list
    // We'll return the array of assignments. The frontend handles the array.
    return NextResponse.json(assignments);

  } catch (error) {
    console.error('Error fetching today\'s DPP:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch daily practice problem' },
      { status: 500 }
    );
  }
}
