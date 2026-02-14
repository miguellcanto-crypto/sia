import { prisma } from '@/lib/prisma';
import { AuditAction } from '@/generated/client';

export interface AuditMetadata {
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
    action?: string;
    details?: string;
}

export class AuditService {
    static async log(
        action: AuditAction,
        entityType: string,
        entityId: string,
        options: {
            oldValues?: any;
            newValues?: any;
            metadata?: AuditMetadata;
        } = {}
    ) {
        try {
            await prisma.auditLog.create({
                data: {
                    action,
                    entityType,
                    entityId,
                    oldValues: options.oldValues as any,
                    newValues: options.newValues as any,
                    ipAddress: options.metadata?.ipAddress,
                    userAgent: options.metadata?.userAgent,
                    userId: options.metadata?.userId,
                },
            });
        } catch (error) {
            console.error('Failed to create audit log:', error);
            // We don't throw here to avoid failing the main operation if logging fails
        }
    }
}
