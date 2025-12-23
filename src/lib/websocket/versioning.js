import { webSocketService } from '@/lib/websocket';
import { versioningService } from '@/services/content/versioning.service';

// Event types for content versioning
const VERSIONING_EVENTS = {
  VERSION_CREATED: 'VERSION_CREATED',
  VERSION_RESTORED: 'VERSION_RESTORED',
  CONTENT_UPDATED: 'CONTENT_UPDATED',
  VERSION_DELETED: 'VERSION_DELETED'
};

// Channel name for content version updates
export const getContentVersionChannel = (contentId) => `content:${contentId}:versions`;

// Subscribe to content version updates
export function subscribeToContentVersions(contentId, callback) {
  const channel = getContentVersionChannel(contentId);
  return webSocketService.subscribe(channel, callback);
}

// Notify when a new version is created
export async function notifyVersionCreated(version) {
  const channel = getContentVersionChannel(version.contentId);
  await webSocketService.publish(channel, {
    type: VERSIONING_EVENTS.VERSION_CREATED,
    data: version,
    timestamp: new Date().toISOString()
  });
}

// Notify when a version is restored
export async function notifyVersionRestored(version, restoredById) {
  const channel = getContentVersionChannel(version.contentId);
  await webSocketService.publish(channel, {
    type: VERSIONING_EVENTS.VERSION_RESTORED,
    data: {
      version,
      restoredBy: restoredById
    },
    timestamp: new Date().toISOString()
  });
}

// Notify when content is updated (creates a new version)
export async function notifyContentUpdated(contentId, updatedBy) {
  const channel = getContentVersionChannel(contentId);
  await webSocketService.publish(channel, {
    type: VERSIONING_EVENTS.CONTENT_UPDATED,
    data: {
      contentId,
      updatedBy,
      timestamp: new Date().toISOString()
    }
  });
}

// Notify when a version is deleted
export async function notifyVersionDeleted(contentId, versionNumber, deletedBy) {
  const channel = getContentVersionChannel(contentId);
  await webSocketService.publish(channel, {
    type: VERSIONING_EVENTS.VERSION_DELETED,
    data: {
      contentId,
      versionNumber,
      deletedBy,
      timestamp: new Date().toISOString()
    }
  });
}

// React hook for content version updates
export function useContentVersionUpdates(contentId, callback) {
  const { useEffect } = require('react');
  const callbackRef = useRef(callback);

  // Update the callback if it changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!contentId) return;

    const handleMessage = (event) => {
      if (callbackRef.current) {
        callbackRef.current(event);
      }
    };

    const channel = getContentVersionChannel(contentId);
    const unsubscribe = webSocketService.subscribe(channel, handleMessage);

    return () => {
      unsubscribe();
    };
  }, [contentId]);
}

export default {
  VERSIONING_EVENTS,
  getContentVersionChannel,
  subscribeToContentVersions,
  notifyVersionCreated,
  notifyVersionRestored,
  notifyContentUpdated,
  notifyVersionDeleted,
  useContentVersionUpdates
};
