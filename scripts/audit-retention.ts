import { prisma } from '../src/lib/prisma';

async function cleanupAuditLogs(days: number = 90) {
    console.log(`[Mantenimiento] Iniciando purga de logs de auditoría con más de ${days} días...`);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    try {
        const deleted = await prisma.auditLog.deleteMany({
            where: {
                createdAt: {
                    lt: cutoffDate
                }
            }
        });

        console.log(`[Mantenimiento] Purgados con éxito ${deleted.count} registros antiguos.`);
    } catch (error) {
        console.error('[Mantenimiento] Error al purgar logs:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecución manual o vía cron: npx ts-node scripts/audit-retention.ts 90
const daysArg = process.argv[2] ? parseInt(process.argv[2]) : 90;
cleanupAuditLogs(daysArg);
