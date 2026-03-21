import { NextResponse } from 'next/server';
import { contentService } from '@/services/content/content.service';
import { auth } from '@/auth';

export async function GET(request, { params }) {
  try {
    const { slug } = await params;
    const session = await auth();
    const userId = session?.user?.id;

    const content = await contentService.getContentBySlug(slug, userId);

    if (!content) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    return NextResponse.json(content);
  } catch (error) {
    console.error('Error in GET /api/content/slug/[slug]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Track view
export async function POST(request, { params }) {
    try {
        const { slug } = await params;
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const content = await contentService.getContentBySlug(slug, session.user.id);
        if (!content) {
            return NextResponse.json({ error: 'Content not found' }, { status: 404 });
        }

        await contentService.trackContentView(content.id, session.user.id);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error tracking view:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
