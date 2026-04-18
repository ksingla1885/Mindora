import { NextResponse } from 'next/server';
import { contentService } from '@/services/content/content.service';
import { auth } from '@/auth';
import { cache } from '@/lib/redis-utils';

export async function GET(request, { params }) {
  try {
    const { slug } = await params;
    const session = await auth();
    const userId = session?.user?.id;
    
    // Cache key: content:slug:[slug]:[userId|guest]
    const cacheKey = `content:slug:${slug}:${userId || 'guest'}`;
    
    // Try to get from cache
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return NextResponse.json(cachedData);
    }

    const content = await contentService.getContentBySlug(slug, userId);

    if (!content) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    // Store in cache for 1 hour (3600 seconds)
    await cache.set(cacheKey, content, 3600);

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
