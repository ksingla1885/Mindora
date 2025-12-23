import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Schedule content to be published or unpublished
 * @param {string} contentId - ID of the content to schedule
 * @param {object} schedule - Schedule configuration
 * @param {Date} [schedule.publishAt] - When to publish the content
 * @param {Date} [schedule.unpublishAt] - When to unpublish the content
 * @param {string} userId - ID of the user scheduling the content
 * @returns {Promise<object>} The scheduled content
 */
export async function scheduleContent(contentId, schedule, userId) {
  const { publishAt, unpublishAt } = schedule;
  
  // Validate schedule times
  if (publishAt && new Date(publishAt) <= new Date()) {
    throw new Error('Publish time must be in the future');
  }
  
  if (unpublishAt && new Date(unpublishAt) <= new Date()) {
    throw new Error('Unpublish time must be in the future');
  }
  
  if (publishAt && unpublishAt && new Date(publishAt) >= new Date(unpublishAt)) {
    throw new Error('Publish time must be before unpublish time');
  }
  
  // Update or create schedule
  const data = {
    content: { connect: { id: contentId } },
    scheduledBy: { connect: { id: userId } },
    status: 'scheduled',
    ...(publishAt && { publishAt: new Date(publishAt) }),
    ...(unpublishAt && { unpublishAt: new Date(unpublishAt) }),
  };
  
  return prisma.contentSchedule.upsert({
    where: { contentId },
    update: data,
    create: data,
    include: {
      content: {
        select: {
          id: true,
          title: true,
          status: true,
          type: true,
        },
      },
      scheduledBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

/**
 * Get content schedule by content ID
 * @param {string} contentId - ID of the content
 * @returns {Promise<object|null>} The content schedule or null if not found
 */
export async function getContentSchedule(contentId) {
  return prisma.contentSchedule.findUnique({
    where: { contentId },
    include: {
      content: {
        select: {
          id: true,
          title: true,
          status: true,
        },
      },
      scheduledBy: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}

/**
 * Get all scheduled content within a date range
 * @param {object} options - Query options
 * @param {Date} [options.start] - Start of date range
 * @param {Date} [options.end] - End of date range
 * @param {string} [options.status] - Filter by status (scheduled, published, unpublished)
 * @returns {Promise<Array>} Array of scheduled content
 */
export async function getScheduledContent({ start, end, status } = {}) {
  const where = {};
  
  if (start || end) {
    where.OR = [];
    
    if (start && end) {
      where.OR.push(
        { publishAt: { gte: new Date(start), lte: new Date(end) } },
        { unpublishAt: { gte: new Date(start), lte: new Date(end) } }
      );
    } else if (start) {
      where.OR.push(
        { publishAt: { gte: new Date(start) } },
        { unpublishAt: { gte: new Date(start) } }
      );
    } else if (end) {
      where.OR.push(
        { publishAt: { lte: new Date(end) } },
        { unpublishAt: { lte: new Date(end) } }
      );
    }
  }
  
  if (status) {
    where.status = status;
  }
  
  return prisma.contentSchedule.findMany({
    where,
    include: {
      content: {
        select: {
          id: true,
          title: true,
          type: true,
          status: true,
        },
      },
      scheduledBy: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: [
      { publishAt: 'asc' },
      { unpublishAt: 'asc' },
    ],
  });
}

/**
 * Process scheduled content (to be called by a cron job)
 * @returns {Promise<object>} Processing results
 */
export async function processScheduledContent() {
  const now = new Date();
  
  // Find content that needs to be published
  const toPublish = await prisma.contentSchedule.findMany({
    where: {
      publishAt: {
        lte: now,
      },
      status: 'scheduled',
    },
    include: {
      content: true,
    },
  });
  
  // Find content that needs to be unpublished
  const toUnpublish = await prisma.contentSchedule.findMany({
    where: {
      unpublishAt: {
        lte: now,
      },
      status: 'published',
    },
    include: {
      content: true,
    },
  });
  
  // Process publishing
  const publishResults = await Promise.allSettled(
    toPublish.map(async (schedule) => {
      await prisma.$transaction([
        prisma.content.update({
          where: { id: schedule.contentId },
          data: { status: 'published' },
        }),
        prisma.contentSchedule.update({
          where: { id: schedule.id },
          data: { 
            status: 'published',
            publishedAt: now,
          },
        }),
      ]);
      
      return {
        contentId: schedule.contentId,
        title: schedule.content.title,
        action: 'published',
        success: true,
      };
    })
  );
  
  // Process unpublishing
  const unpublishResults = await Promise.allSettled(
    toUnpublish.map(async (schedule) => {
      await prisma.$transaction([
        prisma.content.update({
          where: { id: schedule.contentId },
          data: { status: 'draft' },
        }),
        prisma.contentSchedule.update({
          where: { id: schedule.id },
          data: { 
            status: 'unpublished',
            unpublishedAt: now,
          },
        }),
      ]);
      
      return {
        contentId: schedule.contentId,
        title: schedule.content.title,
        action: 'unpublished',
        success: true,
      };
    })
  );
  
  return {
    published: publishResults,
    unpublished: unpublishResults,
    timestamp: now,
  };
}

/**
 * Cancel a scheduled content action
 * @param {string} contentId - ID of the content
 * @returns {Promise<object>} The cancelled schedule
 */
export async function cancelContentSchedule(contentId) {
  const schedule = await prisma.contentSchedule.findUnique({
    where: { contentId },
  });
  
  if (!schedule) {
    throw new Error('No schedule found for this content');
  }
  
  if (schedule.status !== 'scheduled') {
    throw new Error('Cannot cancel a schedule that has already been processed');
  }
  
  return prisma.contentSchedule.delete({
    where: { id: schedule.id },
  });
}
