import { prisma } from './prisma';
import { v4 as uuidv4 } from 'uuid';

export const ContentService = {
  // Categories
  async createCategory(name, description = '', parentId = null, metadata = {}) {
    return prisma.category.create({
      data: {
        id: uuidv4(),
        name,
        description,
        parentId,
        metadata,
      },
    });
  },

  async updateCategory(id, data) {
    return prisma.category.update({
      where: { id },
      data,
    });
  },

  async deleteCategory(id) {
    // Check if category has children
    const children = await prisma.category.count({
      where: { parentId: id },
    });

    if (children > 0) {
      throw new Error('Cannot delete category with subcategories');
    }

    // Check if category has content
    const contentCount = await prisma.contentItem.count({
      where: { categoryId: id },
    });

    if (contentCount > 0) {
      throw new Error('Cannot delete category with content items');
    }

    return prisma.category.delete({
      where: { id },
    });
  },

  async getCategories(parentId = null) {
    return prisma.category.findMany({
      where: { parentId },
      include: {
        _count: {
          select: { children: true, contentItems: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  },

  // Tags
  async createTag(name, description = '', color = '#6B7280') {
    return prisma.tag.upsert({
      where: { name },
      update: { description, color },
      create: {
        id: uuidv4(),
        name,
        description,
        color,
      },
    });
  },

  async getTags(search = '', limit = 10) {
    return prisma.tag.findMany({
      where: {
        name: {
          contains: search,
          mode: 'insensitive',
        },
      },
      take: limit,
      orderBy: { name: 'asc' },
    });
  },

  // Content Items
  async createContentItem(data) {
    const { tags = [], categoryId, ...contentData } = data;
    
    return prisma.$transaction(async (tx) => {
      // Create content item
      const contentItem = await tx.contentItem.create({
        data: {
          id: uuidv4(),
          ...contentData,
          categoryId: categoryId || null,
        },
      });

      // Add tags if provided
      if (tags.length > 0) {
        // Ensure tags exist
        const tagRecords = await Promise.all(
          tags.map(tagName => 
            tx.tag.upsert({
              where: { name: tagName },
              update: {},
              create: {
                id: uuidv4(),
                name: tagName,
                color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
              },
            })
          )
        );

        // Connect tags to content item
        await tx.contentItem.update({
          where: { id: contentItem.id },
          data: {
            tags: {
              connect: tagRecords.map(tag => ({ id: tag.id })),
            },
          },
        });
      }

      return this.getContentItemById(contentItem.id);
    });
  },

  async updateContentItem(id, data) {
    const { tags, ...updateData } = data;
    
    return prisma.$transaction(async (tx) => {
      // Update content item
      const contentItem = await tx.contentItem.update({
        where: { id },
        data: updateData,
      });

      // Update tags if provided
      if (tags) {
        // Get current tags
        const currentTags = await tx.tag.findMany({
          where: { contentItems: { some: { id } } },
        });

        // Disconnect all current tags
        await tx.contentItem.update({
          where: { id },
          data: {
            tags: {
              disconnect: currentTags.map(tag => ({ id: tag.id })),
            },
          },
        });

        // Add new tags if any
        if (tags.length > 0) {
          const tagRecords = await Promise.all(
            tags.map(tagName => 
              tx.tag.upsert({
                where: { name: tagName },
                update: {},
                create: {
                  id: uuidv4(),
                  name: tagName,
                  color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
                },
              })
            )
          );

          // Connect new tags
          await tx.contentItem.update({
            where: { id },
            data: {
              tags: {
                connect: tagRecords.map(tag => ({ id: tag.id })),
              },
            },
          });
        }
      }

      return this.getContentItemById(id);
    });
  },

  async getContentItemById(id) {
    return prisma.contentItem.findUnique({
      where: { id },
      include: {
        tags: true,
        category: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });
  },

  async searchContent({ 
    query = '', 
    categoryId = null, 
    tags = [], 
    type = null, 
    page = 1, 
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  }) {
    const skip = (page - 1) * limit;
    
    const where = {
      AND: [
        {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        categoryId ? { categoryId } : {},
        tags.length > 0 ? { tags: { some: { name: { in: tags } } } } : {},
        type ? { type } : {},
      ],
    };

    const [items, total] = await Promise.all([
      prisma.contentItem.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          tags: true,
          category: true,
          _count: {
            select: { views: true, downloads: true },
          },
        },
      }),
      prisma.contentItem.count({ where }),
    ]);

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  },

  // Views and interactions
  async trackView(contentItemId, userId = null) {
    return prisma.view.create({
      data: {
        contentItemId,
        userId,
      },
    });
  },

  async trackDownload(contentItemId, userId = null) {
    return prisma.download.create({
      data: {
        contentItemId,
        userId,
      },
    });
  },

  // Favorites and collections
  async addToFavorites(contentItemId, userId) {
    return prisma.favorite.upsert({
      where: {
        userId_contentItemId: {
          userId,
          contentItemId,
        },
      },
      update: {},
      create: {
        userId,
        contentItemId,
      },
    });
  },

  async removeFromFavorites(contentItemId, userId) {
    return prisma.favorite.delete({
      where: {
        userId_contentItemId: {
          userId,
          contentItemId,
        },
      },
    });
  },

  async getUserFavorites(userId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    
    const [items, total] = await Promise.all([
      prisma.favorite.findMany({
        where: { userId },
        skip,
        take: limit,
        include: {
          contentItem: {
            include: {
              tags: true,
              category: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
              _count: {
                select: { views: true, downloads: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.favorite.count({ where: { userId } }),
    ]);

    return {
      items: items.map(item => item.contentItem),
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  },
};
