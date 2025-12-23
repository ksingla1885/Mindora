import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import {
  createContentRelationship,
  getContentRelationships,
  removeContentRelationship,
  updateContentRelationship,
  getContentGraph,
  RELATIONSHIP_TYPES,
} from '@/lib/content-relationship-utils';

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
    const type = searchParams.get('type');
    const direction = searchParams.get('direction') || 'outgoing';
    const asGraph = searchParams.get('asGraph') === 'true';
    const depth = parseInt(searchParams.get('depth') || '1');
    const types = searchParams.get('types')?.split(',').filter(Boolean);

    if (!id) {
      return new Response(JSON.stringify({ error: 'Content ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (asGraph) {
      const graph = await getContentGraph(id, { depth, types });
      return new Response(JSON.stringify({ data: graph }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      const relationships = await getContentRelationships(id, {
        type,
        direction,
      });
      return new Response(JSON.stringify({ data: relationships }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error fetching content relationships:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch relationships' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
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

    const { sourceId, targetId, type, metadata } = await request.json();

    if (!sourceId || !targetId || !type) {
      return new Response(
        JSON.stringify({
          error: 'sourceId, targetId, and type are required',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (!Object.values(RELATIONSHIP_TYPES).includes(type)) {
      return new Response(
        JSON.stringify({
          error: `Invalid relationship type. Must be one of: ${Object.values(
            RELATIONSHIP_TYPES
          ).join(', ')}`,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const relationship = await createContentRelationship(
      sourceId,
      targetId,
      type,
      metadata
    );

    return new Response(JSON.stringify({ data: relationship }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating content relationship:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to create relationship',
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

export async function PATCH(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { relationshipId, metadata } = await request.json();

    if (!relationshipId) {
      return new Response(
        JSON.stringify({ error: 'relationshipId is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const relationship = await updateContentRelationship(relationshipId, metadata);

    return new Response(JSON.stringify({ data: relationship }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating content relationship:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to update relationship',
      }),
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
    const relationshipId = searchParams.get('relationshipId');

    if (!relationshipId) {
      return new Response(
        JSON.stringify({ error: 'relationshipId is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    await removeContentRelationship(relationshipId);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error deleting content relationship:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to delete relationship',
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
