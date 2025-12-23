import { PrismaClient } from '@prisma/client';
import { cache } from '@/lib/redis-utils';
import { diff } from 'deep-object-diff';
import { 
  notifyVersionCreated, 
  notifyVersionRestored,
  notifyContentUpdated,
  VERSIONING_EVENTS 
} from '@/lib/websocket/versioning';

const prisma = new PrismaClient();
const CACHE_TTL = 60 * 60; // 1 hour

class ContentVersioningService {
  // Create a new version of content
  async createVersion(contentId, data, userId, message = '') {
    // Get current content
    const content = await prisma.contentItem.findUnique({
      where: { id: contentId },
      include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } }
    });

    if (!content) {
      throw new Error('Content not found');
    }

    // Calculate next version number
    const nextVersion = content.versions[0] ? content.versions[0].versionNumber + 1 : 1;

    // Create version
    const version = await prisma.contentVersion.create({
      data: {
        contentId,
        versionNumber: nextVersion,
        title: content.title,
        content: content.content,
        metadata: content.metadata,
        status: content.status,
        message,
        createdById: userId,
        diff: content.versions[0] 
          ? this.calculateDiff(content.versions[0], content) 
          : { initial: true }
      }
    });

    // Invalidate cache
    await this.invalidateCache(contentId);
    
    // Notify about the new version
    await notifyVersionCreated(version);
    
    return version;
  }

  // Get all versions for content
  async getVersions(contentId) {
    const cacheKey = `content:${contentId}:versions`;
    
    return cache.getOrSet(cacheKey, async () => {
      return prisma.contentVersion.findMany({
        where: { contentId },
        orderBy: { versionNumber: 'desc' },
        include: {
          createdBy: {
            select: { id: true, name: true, email: true, image: true }
          }
        }
      });
    }, CACHE_TTL);
  }

  // Get specific version
  async getVersion(contentId, versionNumber) {
    return prisma.contentVersion.findUnique({
      where: {
        contentId_versionNumber: {
          contentId,
          versionNumber: parseInt(versionNumber)
        }
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, image: true }
        }
      }
    });
  }

  // Restore a specific version
  async restoreVersion(contentId, versionNumber, userId) {
    const version = await this.getVersion(contentId, versionNumber);
    
    if (!version) {
      throw new Error('Version not found');
    }

    // Update content with version data
    const updatedContent = await prisma.contentItem.update({
      where: { id: contentId },
      data: {
        title: version.title,
        content: version.content,
        metadata: version.metadata,
        status: version.status,
        updatedAt: new Date(),
        updatedById: userId
      }
    });

    // Create a new version to document the restoration
    const newVersion = await this.createVersion(
      contentId, 
      updatedContent, 
      userId, 
      `Restored from version ${versionNumber}`
    );

    // Notify about the restoration
    await notifyVersionRestored(version, userId);
    
    // Notify about the content update
    await notifyContentUpdated(contentId, userId);

    return updatedContent;
  }

  // Compare two versions
  async compareVersions(contentId, version1, version2) {
    const [v1, v2] = await Promise.all([
      this.getVersion(contentId, version1),
      this.getVersion(contentId, version2)
    ]);

    if (!v1 || !v2) {
      throw new Error('One or both versions not found');
    }

    return {
      title: this.diffText(v1.title, v2.title),
      content: this.diffHtml(v1.content, v2.content),
      metadata: diff(v1.metadata || {}, v2.metadata || {}),
      status: v1.status === v2.status ? null : { from: v1.status, to: v2.status }
    };
  }

  // Helper to calculate differences between versions
  calculateDiff(version, content) {
    return {
      title: version.title !== content.title,
      content: version.content !== content.content,
      metadata: Object.keys(diff(version.metadata || {}, content.metadata || {})).length > 0,
      status: version.status !== content.status
    };
  }

  // Simple text diff
  diffText(oldText, newText) {
    if (oldText === newText) return null;
    return { from: oldText, to: newText };
  }

  // HTML diff (simplified)
  diffHtml(oldHtml, newHtml) {
    if (oldHtml === newHtml) return null;
    
    // In a real implementation, you might want to use a library like diff-match-patch
    // or similar to generate a more detailed diff
    return {
      changed: true,
      oldLength: oldHtml?.length || 0,
      newLength: newHtml?.length || 0
    };
  }

  // Invalidate cache
  async invalidateCache(contentId) {
    await cache.del(`content:${contentId}:versions`);
    await cache.del(`content:${contentId}:*`);
  }
}

export const versioningService = new ContentVersioningService();
