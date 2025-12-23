import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import slugify from 'slugify';

class FolderService {
  /**
   * Create a new folder
   * @param {Object} data - Folder data
   * @param {string} userId - ID of the user creating the folder
   * @returns {Promise<Object>} Created folder
   */
  static async createFolder(data, userId) {
    const { name, description, parentId } = data;
    const slug = slugify(name, { lower: true, strict: true });

    return prisma.$transaction(async (tx) => {
      const folder = await tx.contentFolder.create({
        data: {
          name,
          slug: `${slug}-${uuidv4().substring(0, 6)}`,
          description,
          parentId,
          createdBy: userId,
          updatedBy: userId,
          access: {
            create: {
              userId,
              access: 'OWNER',
            },
          },
        },
        include: {
          access: true,
        },
      });

      return folder;
    });
  }

  /**
   * Update a folder
   * @param {string} id - Folder ID
   * @param {Object} data - Updated folder data
   * @param {string} userId - ID of the user updating the folder
   * @returns {Promise<Object>} Updated folder
   */
  static async updateFolder(id, data, userId) {
    const { name, description, parentId } = data;
    const updateData = { updatedBy: userId };

    if (name) {
      updateData.name = name;
      updateData.slug = `${slugify(name, { lower: true, strict: true })}-${uuidv4().substring(0, 6)}`;
    }
    if (description !== undefined) updateData.description = description;
    if (parentId !== undefined) updateData.parentId = parentId;

    return prisma.contentFolder.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Get folder by ID with access control
   * @param {string} id - Folder ID
   * @param {string} userId - ID of the requesting user
   * @param {string} [minAccess='VIEW'] - Minimum required access level
   * @returns {Promise<Object>} Folder with access information
   */
  static async getFolder(id, userId, minAccess = 'VIEW') {
    const accessLevels = {
      NONE: 0,
      VIEW: 1,
      EDIT: 2,
      MANAGE: 3,
      OWNER: 4,
    };

    const folder = await prisma.contentFolder.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
        access: true,
        _count: {
          select: { items: true },
        },
      },
    });

    if (!folder) return null;

    // Check user access
    const userAccess = await this.getUserAccess(id, userId);
    const hasAccess = accessLevels[userAccess] >= accessLevels[minAccess];

    if (!hasAccess) {
      throw new Error('Insufficient permissions');
    }

    return {
      ...folder,
      userAccess,
    };
  }

  /**
   * Get user's access level for a folder
   * @param {string} folderId - Folder ID
   * @param {string} userId - User ID
   * @returns {Promise<string>} Access level
   */
  static async getUserAccess(folderId, userId) {
    // Check direct access
    const directAccess = await prisma.folderAccess.findFirst({
      where: {
        folderId,
        OR: [
          { userId },
          { role: { in: await this.getUserRoles(userId) } },
        ],
      },
      orderBy: {
        access: 'desc',
      },
    });

    if (directAccess) return directAccess.access;

    // Check parent folder access
    const folder = await prisma.contentFolder.findUnique({
      where: { id: folderId },
      select: { parentId: true },
    });

    if (folder?.parentId) {
      return this.getUserAccess(folder.parentId, userId);
    }

    return 'NONE';
  }

  /**
   * Get user's roles
   * @param {string} userId - User ID
   * @returns {Promise<Array<string>>} Array of role names
   */
  static async getUserRoles(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    return [user.role];
  }

  /**
   * List folders with pagination and filtering
   * @param {Object} options - Query options
   * @param {string} [options.parentId] - Filter by parent folder ID
   * @param {string} [options.search] - Search term
   * @param {number} [options.page=1] - Page number
   * @param {number} [options.limit=20] - Items per page
   * @param {string} userId - ID of the requesting user
   * @returns {Promise<Object>} Paginated folder list
   */
  static async listFolders({ parentId, search, page = 1, limit = 20 }, userId) {
    const skip = (page - 1) * limit;
    const where = {
      parentId: parentId || null,
      OR: search
        ? [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ]
        : undefined,
      access: {
        some: {
          OR: [
            { userId },
            { role: { in: await this.getUserRoles(userId) } },
            { access: { gte: 'VIEW' } },
          ],
        },
      },
    };

    const [folders, total] = await Promise.all([
      prisma.contentFolder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { items: true, children: true },
          },
        },
      }),
      prisma.contentFolder.count({ where }),
    ]);

    return {
      data: folders,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Delete a folder
   * @param {string} id - Folder ID
   * @param {string} userId - ID of the user deleting the folder
   * @returns {Promise<Object>} Deletion result
   */
  static async deleteFolder(id, userId) {
    // Verify user has permission to delete
    const access = await this.getUserAccess(id, userId);
    if (access !== 'OWNER' && access !== 'MANAGE') {
      throw new Error('Insufficient permissions');
    }

    return prisma.$transaction(async (tx) => {
      // Move all items to parent folder or root
      const folder = await tx.contentFolder.findUnique({
        where: { id },
        include: { children: true },
      });

      if (folder.children.length > 0) {
        throw new Error('Cannot delete folder with subfolders');
      }

      // Update items to remove folder reference
      await tx.contentItem.updateMany({
        where: { folderId: id },
        data: { folderId: folder.parentId },
      });

      // Delete folder
      return tx.contentFolder.delete({
        where: { id },
      });
    });
  }
}

export default FolderService;
