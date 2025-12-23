import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { scheduleContent, getContentSchedule, cancelContentSchedule } from '@/lib/content-schedule-utils';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id') || searchParams.get('contentId'); // Support both for backward compatibility

    if (!id) {
      return new Response(JSON.stringify({ error: 'Content ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const schedule = await getContentSchedule(id);

    if (!schedule) {
      return new Response(JSON.stringify({ data: null }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ data: schedule }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching content schedule:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch schedule' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { id: contentId, publishAt, unpublishAt } = await request.json();
    const id = contentId || (await request.json()).contentId; // Support both for backward compatibility

    if (!id) {
      return new Response(JSON.stringify({ error: 'Content ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!publishAt && !unpublishAt) {
      return new Response(
        JSON.stringify({ error: 'Either publishAt or unpublishAt is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const schedule = await scheduleContent(
      id,
      { publishAt, unpublishAt },
      session.user.id
    );

    return new Response(JSON.stringify({ data: schedule }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error scheduling content:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to schedule content' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id') || searchParams.get('contentId'); // Support both for backward compatibility

    if (!id) {
      return new Response(JSON.stringify({ error: 'Content ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await cancelContentSchedule(id);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error canceling schedule:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to cancel schedule' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
