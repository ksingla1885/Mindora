import { PrismaClient } from '@prisma/client';
import { cache } from '@/lib/redis-utils';
import { dppService } from '../dpp/dpp.service';

const prisma = new PrismaClient();

const CACHE_TTL = 60 * 60; // 1 hour
const DPP_CACHE_TTL = 30 * 60; // 30 minutes

class ContentService {
  // Get content by ID with caching
  async getContentById(contentId, userId = null) {
    const cacheKey = `content:${contentId}:${userId || 'public'}`;
    
    return cache.getOrSet(cacheKey, async () => {
      const content = await prisma.contentItem.findUnique({
        where: { id: contentId },
        include: {
          author: {
            select: { id: true, name: true, email: true, image: true }
          },
          access: true,
          metadata: true,
          children: {
            where: { parentId: contentId },
            orderBy: { order: 'asc' }
          },
          _count: {
            select: { comments: true, likes: true }
          }
        }
      });

      // Check access rights
      if (!await this.checkContentAccess(content, userId)) {
        return null;
      }

      return content;
    }, CACHE_TTL);
  }

  // Get content by slug with caching
  async getContentBySlug(slug, userId = null) {
    const cacheKey = `content:slug:${slug}:${userId || 'public'}`;
    
    return cache.getOrSet(cacheKey, async () => {
      const content = await prisma.contentItem.findFirst({
        where: { slug },
        include: {
          author: {
            select: { id: true, name: true, email: true, image: true }
          },
          access: true,
          metadata: true,
          children: {
            where: { parentId: contentId },
            orderBy: { order: 'asc' }
          },
          _count: {
            select: { comments: true, likes: true }
          }
        }
      });

      if (!content) return null;
      
      // Check access rights
      if (!await this.checkContentAccess(content, userId)) {
        return null;
      }

      return content;
    }, CACHE_TTL);
  }

  // Check if user has access to content
  async checkContentAccess(content, userId) {
    if (!content) return false;
    
    // Public content is accessible to everyone
    if (content.accessLevel === 'PUBLIC') {
      return true;
    }

    // If no user ID is provided, only public content is accessible
    if (!userId) {
      return false;
    }

    // Check if user is the author
    if (content.authorId === userId) {
      return true;
    }

    // Check for explicit access
    const access = await prisma.contentAccess.findFirst({
      where: {
        contentId: content.id,
        userId,
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: new Date() } }
        ]
      }
    });

    return !!access;
  }

  // Track content view
  async trackContentView(contentId, userId) {
    // Record the view
    await prisma.analyticsEvent.create({
      data: {
        eventType: 'content_view',
        userId: userId,
        contentItemId: contentId,
        metadata: {}
      }
    });

    // Update view count
    await prisma.contentItem.update({
      where: { id: contentId },
      data: { viewCount: { increment: 1 } }
    });

    // Invalidate cache
    await cache.del(`content:${contentId}:*`);
  }

  // Search content
  async searchContent(query, filters = {}, userId = null) {
    const { 
      type = null, 
      category = null, 
      difficulty = null,
      page = 1, 
      limit = 10 
    } = filters;

    const where = {
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { content: { contains: query, mode: 'insensitive' } }
      ],
      status: 'PUBLISHED'
    };

    if (type) where.type = type;
    if (category) where.category = category;
    if (difficulty) where.difficulty = difficulty;

    // Get total count
    const total = await prisma.contentItem.count({ where });

    // Get paginated results
    const results = await prisma.contentItem.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: { id: true, name: true, image: true }
        },
        _count: {
          select: { comments: true, likes: true }
        }
      }
    });

    // Filter out content the user doesn't have access to
    const accessibleResults = [];
    for (const item of results) {
      if (await this.checkContentAccess(item, userId)) {
        accessibleResults.push(item);
      }
    }

    return {
      data: accessibleResults,
      meta: {
        total,
        page,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1
      }
    };
  }

  // Get DPP for content
  async getContentDPP(contentId, userId) {
    const cacheKey = `content:${contentId}:dpp:${userId}`;
    
    return cache.getOrSet(cacheKey, async () => {
      // Check if content has associated DPP
      const content = await prisma.contentItem.findUnique({
        where: { id: contentId },
        select: { 
          id: true,
          dppId: true,
          subject: true,
          topic: true,
          difficulty: true
        }
      });

      if (!content) {
        throw new Error('Content not found');
      }

      if (content.dppId) {
        // Return existing DPP
        return dppService.getDPP(content.dppId, userId);
      }

      // Create new DPP if none exists
      const dpp = await dppService.createDPP({
        title: `Practice for ${content.topic || 'this content'}`,
        subject: content.subject || 'General',
        topic: content.topic || 'Practice',
        difficulty: content.difficulty || 'MEDIUM',
        contentId,
        createdBy: userId
      });

      // Associate DPP with content
      await prisma.contentItem.update({
        where: { id: contentId },
        data: { dppId: dpp.id }
      });

      // Invalidate cache
      cache.del(`content:${contentId}`);
      
      return dpp;
    }, DPP_CACHE_TTL);
  }

  // Add comment to content
  async addComment({ contentId, userId, text, parentId = null }) {
    const comment = await prisma.comment.create({
      data: {
        content: text,
        contentId,
        userId,
        parentId,
        status: 'PUBLISHED'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      }
    });

    // Invalidate cache
    cache.del(`content:${contentId}:comments`);
    
    return comment;
  }

  // Get content comments
  async getContentComments(contentId) {
    const cacheKey = `content:${contentId}:comments`;
    
    return cache.getOrSet(cacheKey, async () => {
      return prisma.comment.findMany({
        where: { 
          contentId,
          parentId: null, // Only top-level comments
          status: 'PUBLISHED'
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true
            }
          },
          replies: {
            where: { status: 'PUBLISHED' },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true
                }
              }
            },
            orderBy: { createdAt: 'asc' }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    }, CACHE_TTL);
  }

  // Toggle bookmark
  async toggleBookmark(contentId, userId) {
    const existing = await prisma.bookmark.findFirst({
      where: { contentId, userId }
    });

    if (existing) {
      await prisma.bookmark.delete({
        where: { id: existing.id }
      });
      return { isBookmarked: false };
    } else {
      await prisma.bookmark.create({
        data: { contentId, userId }
      });
      return { isBookmarked: true };
    }
  }

  // Check bookmark status
  async checkBookmarkStatus(contentId, userId) {
    const bookmark = await prisma.bookmark.findFirst({
      where: { contentId, userId }
    });
    
    return { isBookmarked: !!bookmark };
  }
}

export const contentService = new ContentService();
