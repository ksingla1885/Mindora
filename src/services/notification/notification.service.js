/**
 * Notification Service
 * Handles sending notifications through various channels (In-app, Email, etc.)
 */
import prisma from '@/lib/prisma';

export const sendNotification = async ({
    userId,
    title,
    message,
    type,
    data = {},
    metadata = {},
    priority = 'medium'
}) => {
    try {
        // 1. Log to console for development audit
        console.log(`[Notification] to User: ${userId} - ${title}: ${message}`);

        // 2. Persist to database so the in-app bell can surface it
        await prisma.notification.create({
            data: {
                userId,
                title,
                message,
                type: type || 'GENERAL',
                read: false,
                data: data || {},
                metadata: metadata || {},
            },
        });

        // 3. TODO: Send via WebSocket if user is online
        /*
        const websocketService = require('@/services/websocket/websocket.service');
        websocketService.sendToUser(userId, 'notification', { title, message, type, data });
        */

        // 4. TODO: Send via Email for high-priority notifications
        /*
        if (priority === 'high') {
          const emailLib = require('@/lib/email');
          await emailLib.sendTransactionalEmail(userId, title, message);
        }
        */

        return { success: true, timestamp: new Date() };
    } catch (error) {
        console.error('[Notification Service] sendNotification failed:', error);
        // Don't throw — notifications should never break the main flow
        return { success: false, error: error.message };
    }
};

export const markAsRead = async (notificationId) => {
    return prisma.notification.update({
        where: { id: notificationId },
        data: { read: true },
    });
};

export const getUserNotifications = async (userId, limit = 10) => {
    return prisma.notification.findMany({
        where: { userId },
        take: limit,
        orderBy: { createdAt: 'desc' },
    });
};
