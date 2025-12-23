import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all content with optional filters
export async function getContentList({ page = 1, limit = 10, search = '', filters = {} } = {}) {
  const skip = (page - 1) * limit;
  
  const where = {
    isCurrent: true,
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }),
    ...filters
  };

  const [items, total] = await Promise.all([
    prisma.contentItem.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        topic: {
          select: {
            name: true,
            subject: {
              select: { name: true }
            }
          }
        }
      }
    }),
    prisma.contentItem.count({ where })
  ]);

  return {
    items,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page
  };
}

// Get content by ID with version history
export async function getContentWithVersions(id) {
  const content = await prisma.contentItem.findUnique({
    where: { id },
    include: {
      topic: {
        select: {
          name: true,
          subject: {
            select: { name: true }
          }
        }
      },
      versions: {
        orderBy: { version: 'desc' },
        select: {
          id: true,
          version: true,
          title: true,
          status: true,
          publishedAt: true,
          scheduledFor: true,
          updatedAt: true,
          changeLog: true
        }
      }
    }
  });

  return content;
}

// Schedule content for publishing
export async function scheduleContent(id, scheduledFor) {
  const scheduledDate = new Date(scheduledFor);
  
  const content = await prisma.contentItem.update({
    where: { id },
    data: {
      scheduledFor: scheduledDate,
      status: scheduledDate <= new Date() ? 'published' : 'scheduled',
      publishedAt: scheduledDate <= new Date() ? new Date() : null
    }
  });

  return content;
}

// Publish content immediately
export async function publishContent(id) {
  return prisma.contentItem.update({
    where: { id },
    data: {
      status: 'published',
      publishedAt: new Date(),
      scheduledFor: null
    }
  });
}

// Unpublish content
export async function unpublishContent(id) {
  return prisma.contentItem.update({
    where: { id },
    data: {
      status: 'draft',
      publishedAt: null,
      scheduledFor: null
    }
  });
}

// Archive content
export async function archiveContent(id) {
  return prisma.contentItem.update({
    where: { id },
    data: { status: 'archived' }
  });
}

// Get scheduled content that needs to be published
export async function getScheduledContent() {
  const now = new Date();
  
  return prisma.contentItem.findMany({
    where: {
      status: 'scheduled',
      scheduledFor: {
        lte: now
      }
    }
  });
}

// Process scheduled content (to be called by a cron job)
export async function processScheduledContent() {
  const scheduledItems = await getScheduledContent();
  
  const results = await Promise.allSettled(
    scheduledItems.map(item => 
      publishContent(item.id)
    )
  );

  return {
    total: scheduledItems.length,
    success: results.filter(r => r.status === 'fulfilled').length,
    failed: results.filter(r => r.status === 'rejected').length
  };
}

// Get content history
export async function getContentHistory(id) {
  const content = await prisma.contentItem.findUnique({
    where: { id },
    select: { id: true, title: true }
  });

  if (!content) {
    throw new Error('Content not found');
  }

  const versions = await prisma.contentItem.findMany({
    where: {
      OR: [
        { id },
        { parentId: id }
      ]
    },
    orderBy: { version: 'desc' },
    select: {
      id: true,
      version: true,
      title: true,
      status: true,
      publishedAt: true,
      scheduledFor: true,
      updatedAt: true,
      changeLog: true
    }
  });

  return {
    ...content,
    versions
  };
}
