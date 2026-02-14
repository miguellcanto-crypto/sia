import { prisma } from '@/lib/prisma';
import { NotificationType } from '@/generated/client';

export interface CreateNotificationDto {
    type: NotificationType;
    title: string;
    message: string;
    userId?: string;
    entityType?: string;
    entityId?: string;
}

export class NotificationService {
    /**
     * Creates a new notification in the system.
     */
    static async notify(data: CreateNotificationDto, tx?: any) {
        try {
            const db = tx || prisma;

            if (!(db as any).notification) {
                console.error('[NotificationService] prisma.notification is undefined. Client might need regeneration.');
                return null;
            }

            const notification = await (db as any).notification.create({
                data: {
                    type: data.type,
                    title: data.title,
                    message: data.message,
                    userId: data.userId,
                    entityType: data.entityType,
                    entityId: data.entityId,
                },
            });

            // Note: In a real-time system, we would trigger a socket event or SSE here.
            // For now, we'll rely on client-side polling or manual refresh.
            // TODO: Implement real-time broadcast if a websocket server is available.

            return notification;
        } catch (error) {
            console.error('[NotificationService] Failed to create notification:', error);
            // We don't throw to avoid breaking the caller's transaction/flow
            return null;
        }
    }

    /**
     * Gets unread notifications for a user.
     */
    static async getUnread(userId?: string) {
        try {
            if (!(prisma as any).notification) {
                console.error('[NotificationService] prisma.notification is undefined in getUnread');
                return [];
            }
            const filter: any = { isRead: false };
            if (userId) {
                filter.OR = [
                    { userId: userId },
                    { userId: null }
                ];
            } else {
                filter.userId = null;
            }

            return await prisma.notification.findMany({
                where: filter,
                orderBy: {
                    createdAt: 'desc',
                },
            });
        } catch (error) {
            console.error('[NotificationService] Error in getUnread:', error);
            return [];
        }
    }

    /**
     * Marks a notification as read.
     */
    static async markAsRead(id: string) {
        try {
            if (!(prisma as any).notification) return null;
            return await prisma.notification.update({
                where: { id },
                data: { isRead: true },
            });
        } catch (error) {
            console.error('[NotificationService] Error in markAsRead:', error);
            return null;
        }
    }

    /**
     * Marks all notifications as read for a user.
     */
    static async markAllAsRead(userId?: string) {
        try {
            if (!(prisma as any).notification) return null;
            return await prisma.notification.updateMany({
                where: {
                    userId: userId || null,
                    isRead: false,
                },
                data: { isRead: true },
            });
        } catch (error) {
            console.error('[NotificationService] Error in markAllAsRead:', error);
            return null;
        }
    }
}
