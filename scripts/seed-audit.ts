import { prisma } from '../src/lib/prisma';
import { AuditAction } from '../src/generated/client';

async function seedAuditLogs(count: number = 1000) {
    console.log(`[Seeding] Generando ${count} registros de auditoría...`);

    const actions: AuditAction[] = ['CREATE', 'UPDATE', 'DELETE', 'SALE_CREATED', 'PRICE_CHANGED', 'LOGIN'];
    const entities = ['Product', 'Sale', 'User', 'Category'];

    const users = await prisma.user.findMany({ take: 5 });
    if (users.length === 0) {
        console.error('No hay usuarios en la DB para asociar los logs.');
        return;
    }

    const logs = [];
    for (let i = 0; i < count; i++) {
        const user = users[Math.floor(Math.random() * users.length)];
        const action = actions[Math.floor(Math.random() * actions.length)];
        const entity = entities[Math.floor(Math.random() * entities.length)];

        logs.push({
            userId: user.id,
            action,
            entityType: entity,
            entityId: `test-${Math.random().toString(36).substr(2, 9)}`,
            resultStatus: Math.random() > 0.1 ? 'SUCCESS' : 'FAILED',
            ipAddress: `192.168.1.${Math.floor(Math.random() * 254)}`,
            createdAt: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)) // Últimos 30 días
        });
    }

    try {
        await prisma.auditLog.createMany({
            data: logs
        });
        console.log(`[Seeding] ¡Éxito! Se crearon ${count} registros.`);
    } catch (error) {
        console.error('[Seeding] Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seedAuditLogs(5000);
