import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

/**
 * Content Organization Service for managing content structure and relationships
 */
class ContentOrganizationService {
  /**
   * Create a new folder
   * @param {string} name - Folder name
   * @param {string} [parentId] - Parent folder ID (optional)
   * @param {string} [topicId] - Associated topic ID (optional)
   * @param {string} [classLevel] - Class level (optional)
   * @param {string} [description] - Folder description (optional)
   * @param {string} userId - ID of the user creating the folder
   * @returns {Promise<Object>} Created folder
   */
  async createFolder(name, { parentId, topicId, classLevel, description }, userId) {
    return prisma.contentFolder.create({
      data: {
        id: uuidv4(),
        name,
        description,
        parentId,
        topicId,
        classLevel,
        createdBy: userId
      }
    });
  }

  /**
   * Update a folder
   * @param {string} folderId - Folder ID
   * @param {Object} data - Updated folder data
   * @param {string} userId - ID of the user updating the folder
   * @returns {Promise<Object>} Updated folder
   */
  async updateFolder(folderId, data, userId) {
    return prisma.contentFolder.update({
      where: { id: folderId },
      data: {
        ...data,
        updatedAt: new Date(),
        updatedBy: userId
      }
    });
  }

  /**
   * Delete a folder
   * @param {string} folderId - Folder ID
   * @param {string} userId - ID of the user deleting the folder
   * @returns {Promise<boolean>} True if successful
   */
  async deleteFolder(folderId, userId) {
    // Check if folder is empty
    const folder = await prisma.contentFolder.findUnique({
      where: { id: folderId },
      include: {
        items: true,
        children: true
      }
    });

    if (!folder) {
      throw new Error('Folder not found');
    }

    if (folder.items.length > 0 || folder.children.length > 0) {
      throw new Error('Cannot delete non-empty folder');
    }

    await prisma.contentFolder.delete({
      where: { id: folderId }
    });

    return true;
  }

  /**
   * Move content to a different folder
   * @param {string|string[]} contentIds - Single content ID or array of content IDs
   * @param {string} targetFolderId - Target folder ID (null for root)
   * @param {string} userId - ID of the user performing the move
   * @returns {Promise<Object>} Update result
   */
  async moveContent(contentIds, targetFolderId, userId) {
    const ids = Array.isArray(contentIds) ? contentIds : [contentIds];
    
    return prisma.contentItem.updateMany({
      where: {
        id: { in: ids },
        // Verify user has permission to move these items
        OR: [
          { createdBy: userId },
          {
            accessControls: {
              some: {
                userId,
                permission: { in: ['MANAGE', 'WRITE'] }
              }
            }
          }
        ]
      },
      data: {
        folderId: targetFolderId,
        updatedAt: new Date(),
        updatedBy: userId
      }
    });
  }

  /**
   * Get folder tree structure
   * @param {string} [parentId] - Parent folder ID (optional, null for root)
   * @param {string} [topicId] - Filter by topic ID (optional)
   * @param {string} [classLevel] - Filter by class level (optional)
   * @returns {Promise<Array>} Folder tree
   */
  async getFolderTree(parentId = null, { topicId, classLevel } = {}) {
    const where = { parentId };
    
    if (topicId) where.topicId = topicId;
    if (classLevel) where.classLevel = classLevel;

    const folders = await prisma.contentFolder.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            items: true,
            children: true
          }
        }
      }
    });

    // Recursively get children
    const tree = await Promise.all(
      folders.map(async (folder) => ({
        ...folder,
        children: await this.getFolderTree(folder.id, { topicId, classLevel })
      }))
    );

    return tree;
  }

  /**
   * Get breadcrumb trail for a folder or content item
   * @param {string} id - Folder or content item ID
   * @param {boolean} isContent - Whether the ID is for a content item
   * @returns {Promise<Array>} Breadcrumb trail
   */
  async getBreadcrumbs(id, isContent = false) {
    const breadcrumbs = [];
    
    if (isContent) {
      const content = await prisma.contentItem.findUnique({
        where: { id },
        select: {
          id,
          title,
          folder: {
            select: {
              id: true,
              name: true,
              parentId: true
            }
          }
        }
      });
      
      if (!content) return [];
      
      breadcrumbs.push({
        id: content.id,
        name: content.title,
        type: 'content'
      });
      
      if (content.folder) {
        const folderCrumbs = await this.getFolderBreadcrumbs(content.folder.id);
        breadcrumbs.unshift(...folderCrumbs);
      }
    } else {
      const folderCrumbs = await this.getFolderBreadcrumbs(id);
      breadcrumbs.push(...folderCrumbs);
    }
    
    return breadcrumbs;
  }

  /**
   * Get breadcrumbs for a folder
   * @private
   */
  async getFolderBreadcrumbs(folderId) {
    const breadcrumbs = [];
    let currentId = folderId;
    
    while (currentId) {
      const folder = await prisma.contentFolder.findUnique({
        where: { id: currentId },
        select: {
          id: true,
          name: true,
          parentId: true
        }
      });
      
      if (!folder) break;
      
      breadcrumbs.unshift({
        id: folder.id,
        name: folder.name,
        type: 'folder'
      });
      
      currentId = folder.parentId;
    }
    
    return breadcrumbs;
  }

  /**
   * Get content by folder with pagination
   * @param {string} folderId - Folder ID (null for root)
   * @param {Object} options - Pagination and filtering options
   * @param {string} userId - User ID for access control
   * @returns {Promise<Object>} Paginated content items
   */
  async getContentByFolder(folderId, { page = 1, limit = 20, search = '', type, sortBy = 'createdAt', sortOrder = 'desc' }, userId) {
    const skip = (page - 1) * limit;
    
    const where = {
      folderId: folderId || null,
      isCurrent: true,
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      }),
      ...(type && { type }),
      // Access control
      OR: [
        { isPublic: true },
        { createdBy: userId },
        {
          accessControls: {
            some: {
              OR: [
                { userId },
                { 
                  group: {
                    groupMembers: {
                      some: { userId }
                    }
                  }
                }
              ]
            }
          }
        }
      ]
    };
    
    const [items, total] = await Promise.all([
      prisma.contentItem.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { [sortBy]: sortOrder.toLowerCase() },
        include: {
          contentTags: {
            include: {
              tag: true
            }
          },
          creator: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }),
      prisma.contentItem.count({ where })
    ]);
    
    return {
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Get recent content
   * @param {Object} options - Pagination and filtering options
   * @param {string} userId - User ID for access control
   * @returns {Promise<Array>} Recent content items
   */
  async getRecentContent({ limit = 10, type, topicId }, userId) {
    const where = {
      isCurrent: true,
      ...(type && { type }),
      ...(topicId && { topicId }),
      // Access control
      OR: [
        { isPublic: true },
        { createdBy: userId },
        {
          accessControls: {
            some: {
              OR: [
                { userId },
                { 
                  group: {
                    groupMembers: {
                      some: { userId }
                    }
                  }
                }
              ]
            }
          }
        }
      ]
    };
    
    return prisma.contentItem.findMany({
      where,
      take: parseInt(limit),
      orderBy: { updatedAt: 'desc' },
      include: {
        contentTags: {
          include: {
            tag: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
  }

  /**
   * Get content statistics
   * @param {string} userId - User ID for access control
   * @returns {Promise<Object>} Content statistics
   */
  async getContentStats(userId) {
    const [total, byType, recentActivity] = await Promise.all([
      // Total content count
      prisma.contentItem.count({
        where: {
          isCurrent: true,
          OR: [
            { isPublic: true },
            { createdBy: userId },
            {
              accessControls: {
                some: { userId }
              }
            }
          ]
        }
      }),
      
      // Count by type
      prisma.contentItem.groupBy({
        by: ['type'],
        _count: {
          type: true
        },
        where: {
          isCurrent: true,
          OR: [
            { isPublic: true },
            { createdBy: userId },
            {
              accessControls: {
                some: { userId }
              }
            }
          ]
        }
      }),
      
      // Recent activity
      prisma.contentItem.findMany({
        where: {
          isCurrent: true,
          OR: [
            { isPublic: true },
            { createdBy: userId },
            {
              accessControls: {
                some: { userId }
              }
            }
          ]
        },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          type: true,
          updatedAt: true,
          creator: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })
    ]);
    
    return {
      total,
      byType: byType.reduce((acc, { type, _count }) => ({
        ...acc,
        [type.toLowerCase()]: _count.type
      }), {}),
      recentActivity
    };
  }

  /**
   * Search content and folders
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @param {string} userId - User ID for access control
   * @returns {Promise<Object>} Search results
   */
  async searchContent(query, { type, limit = 10, offset = 0 }, userId) {
    const where = {
      isCurrent: true,
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } }
      ],
      ...(type && { type }),
      // Access control
      OR: [
        { isPublic: true },
        { createdBy: userId },
        {
          accessControls: {
            some: {
              OR: [
                { userId },
                { 
                  group: {
                    groupMembers: {
                      some: { userId }
                    }
                  }
                }
              ]
            }
          }
        }
      ]
    };
    
    const [content, folders] = await Promise.all([
      prisma.contentItem.findMany({
        where,
        take: parseInt(limit),
        skip: parseInt(offset),
        include: {
          contentTags: {
            include: {
              tag: true
            }
          },
          creator: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }),
      prisma.contentFolder.findMany({
        where: {
          name: { contains: query, mode: 'insensitive' },
          ...(type === 'folder' ? {} : { topicId: null })
        },
        take: parseInt(limit),
        skip: parseInt(offset)
      })
    ]);
    
    return {
      content,
      folders,
      total: content.length + folders.length
    };
  }
}

export default new ContentOrganizationService();
