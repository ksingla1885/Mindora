/**
 * Stub: @/lib/notifications
 * Wraps the notification service from @/services/notification/notification.service
 */
import { sendNotification as _send } from '@/services/notification/notification.service';

export async function sendNotification(params) {
  try {
    return await _send(params);
  } catch (e) {
    console.warn('[Notifications] sendNotification failed (non-fatal):', e.message);
  }
}
