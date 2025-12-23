import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

class ContentVersionService {
  /**
   * Create a new version of a content item
   * @param {string} contentId - ID of the content to version
   * @param {object} data - New content data
   * @param {string} userId - ID of the user creating the version
   * @param {string} changeLog - Description of changes
   * @returns {Promise<object>} The new version
   */
  static async createVersion(contentId, data, userId, changeLog = '') {
    const currentContent = await prisma.contentItem.findUnique({
      where: { id: contentId },
    });

    if (!currentContent) {
      throw new Error('Content not found');
    }

    // Mark current version as not current
    await prisma.contentItem.update({
      where: { id: contentId },
      data: { isCurrent: false },
    });

    // Create new version
    const newVersion = await prisma.contentItem.create({
      data: {
        ...currentContent,
        id: undefined, // Let Prisma generate a new ID
        parentId: currentContent.id,
        version: currentContent.version + 1,
        versionGroupId: currentContent.versionGroupId || uuidv4(),
        changeLog,
        isCurrent: true,
        status: 'DRAFT',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: userId,
        updatedBy: userId,
        ...data, // Override with new data
      },
    });

    return newVersion;
  }

  /**
   * Get version history of a content item
   * @param {string} versionGroupId - Version group ID
   * @returns {Promise<Array>} List of versions
   */
  static async getVersionHistory(versionGroupId) {
    return prisma.contentItem.findMany({
      where: { versionGroupId },
      orderBy: { version: 'desc' },
      select: {
        id: true,
        version: true,
        title: true,
        status: true,
        changeLog: true,
        createdAt: true,
        updatedAt: true,
        createdBy: true,
        updatedBy: true,
      },
    });
  }

  /**
   * Restore a previous version
   * @param {string} versionId - ID of the version to restore
   * @param {string} userId - ID of the user restoring the version
   * @returns {Promise<object>} The restored version
   */
  static async restoreVersion(versionId, userId) {
    const version = await prisma.contentItem.findUnique({
      where: { id: versionId },
    });

    if (!version) {
      throw new Error('Version not found');
    }

    // Get current version
    const currentVersion = await prisma.contentItem.findFirst({
      where: {
        versionGroupId: version.versionGroupId,
        isCurrent: true,
      },
    });

    if (!currentVersion) {
      throw new Error('Current version not found');
    }

    // Mark current version as not current
    await prisma.contentItem.update({
      where: { id: currentVersion.id },
      data: { isCurrent: false },
    });

    // Create a new version based on the old version
    const restoredVersion = await prisma.contentItem.create({
      data: {
        ...version,
        id: undefined, // New ID
        parentId: currentVersion.id,
        version: currentVersion.version + 1,
        isCurrent: true,
        status: 'DRAFT',
        changeLog: `Restored from version ${version.version}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: userId,
        updatedBy: userId,
      },
    });

    return restoredVersion;
  }

  /**
   * Compare two versions
   * @param {string} versionId1 - First version ID
   * @param {string} versionId2 - Second version ID
   * @returns {Promise<object>} Comparison result
   */
  static async compareVersions(versionId1, versionId2) {
    const [v1, v2] = await Promise.all([
      prisma.contentItem.findUnique({ where: { id: versionId1 } }),
      prisma.contentItem.findUnique({ where: { id: versionId2 } }),
    ]);

    if (!v1 || !v2) {
      throw new Error('One or both versions not found');
    }

    // Simple diff for now - could be enhanced with a proper diffing library
    const diff = {};
    const allKeys = new Set([...Object.keys(v1), ...Object.keys(v2)]);

    for (const key of allKeys) {
      if (key === 'id' || key === 'version' || key === 'updatedAt') continue;
      if (JSON.stringify(v1[key]) !== JSON.stringify(v2[key])) {
        diff[key] = {
          from: v1[key],
          to: v2[key],
        };
      }
    }

    return {
      version1: v1.version,
      version2: v2.version,
      diff,
    };
  }
}

export default ContentVersionService;
