
import { NotificationService } from '../src/services/NotificationService';
import { NotificationType, PrismaClient } from '../src/generated/client';

const prisma = new PrismaClient();

async function verify() {
    console.log('--- VERIFICATION START ---');

    try {
        // 1. Create a test notification
        console.log('Creating test notification...');
        const notification = await NotificationService.notify({
            type: NotificationType.INFO,
            title: 'Verificación de Sistema',
            message: 'Esta es una notificación de prueba para validar el sistema.',
        });

        if (notification) {
            console.log('Notification created successfully:', notification.id);
        } else {
            throw new Error('Failed to create notification');
        }

        // 2. Verify search
        console.log('Fetching unread notifications...');
        const unread = await NotificationService.getUnread();
        console.log(`Found ${unread.length} unread notifications.`);

        const found = unread.find(n => n.id === notification.id);
        if (found) {
            console.log('SUCCESS: Notification found in unread list.');
        } else {
            console.log('FAILURE: Notification not found in unread list.');
        }

        // 3. Mark as read
        console.log('Marking as read...');
        await NotificationService.markAsRead(notification.id);

        const afterMark = await NotificationService.getUnread();
        if (!afterMark.find(n => n.id === notification.id)) {
            console.log('SUCCESS: Notification is no longer in unread list.');
        } else {
            console.log('FAILURE: Notification is still unread!');
        }

    } catch (err: any) {
        console.error('ERROR:', err.message);
    } finally {
        await prisma.$disconnect();
        console.log('--- VERIFICATION END ---');
    }
}

verify();
