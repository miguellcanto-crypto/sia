import { prisma } from '../src/lib/prisma';

async function checkNotifications() {
    console.log('--- Revisando Notificaciones ---');
    const logs = await prisma.notification.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
            id: true,
            title: true,
            createdAt: true,
            isRead: true
        }
    });

    console.table(logs.map((l: any) => ({
        ...l,
        createdAt: l.createdAt.toISOString()
    })));
}

checkNotifications()
    .catch(console.error)
    .finally(() => process.exit());
