import { getEnhancedDPPStats } from '@/services/dpp/dpp.service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const stats = await getEnhancedDPPStats(session.user.id, {
      includePredictions: true,
      includeRecommendations: true
    });

    return new Response(JSON.stringify(stats), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching DPP analytics:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch DPP analytics' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
