import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { exportContent, generateExportLink, getExportStatus } from '@/lib/content-export-utils';

// Helper function to handle stream response
function streamToResponse(readable, res, filename, contentType) {
  const headers = new Headers();
  headers.set('Content-Disposition', `attachment; filename="${filename}"`);
  headers.set('Content-Type', contentType);
  
  return new Response(readable, { headers });
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

    const { contentIds, format = 'json', async = false } = await request.json();

    if (!contentIds || !Array.isArray(contentIds) || contentIds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'At least one content ID is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // If async mode, generate a link for later download
    if (async) {
      const { url, expiresAt } = await generateExportLink(format, contentIds);
      return new Response(
        JSON.stringify({
          status: 'processing',
          downloadUrl: url,
          expiresAt: expiresAt.toISOString(),
        }),
        {
          status: 202, // Accepted
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Otherwise, stream the export directly
    try {
      const { filename, stream, type } = await exportContent(contentIds, format);
      return streamToResponse(stream, null, filename, type);
    } catch (error) {
      console.error('Export error:', error);
      return new Response(
        JSON.stringify({
          error: error.message || 'Failed to generate export',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error) {
    console.error('Error in export API:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'An unexpected error occurred',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    const id = searchParams.get('id') || searchParams.get('contentId'); // Support both for backward compatibility

    if (jobId) {
      // Check status of an async export job
      const status = await getExportStatus(jobId);
      return new Response(JSON.stringify(status), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } else if (id) {
      // For backward compatibility, support direct content ID in query params
      const contentIds = [id];
      const format = searchParams.get('format') || 'json';
      
      try {
        const { filename, stream, type } = await exportContent(contentIds, format);
        return streamToResponse(stream, null, filename, type);
      } catch (error) {
        console.error('Export error:', error);
        return new Response(
          JSON.stringify({
            error: error.message || 'Failed to generate export',
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    } else {
      return new Response(
        JSON.stringify({ error: 'Either jobId or contentId is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error) {
    console.error('Error in export status API:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to check export status',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
