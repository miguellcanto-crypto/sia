import { prisma } from './prisma';
import { AuditAction } from '../generated/client/client';

export async function logAuthEvent(
    userId: string | null,
    action: AuditAction,
    details: string,
    ip?: string,
    userAgent?: string
) {
    try {
        await prisma.auditLog.create({
            data: {
                userId,
                action,
                entityType: 'User',
                entityId: userId || 'unknown',
                newValues: {
                    info: details,
                    timestamp: new Date().toISOString()
                },
                ipAddress: ip,
                userAgent: userAgent,
            },
        });
    } catch (error) {
        console.error('Failed to log auth event:', error);
    }
}
