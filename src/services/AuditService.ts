import { prisma } from '@/lib/prisma';
import { AuditAction } from '@/generated/client';

export interface AuditMetadata {
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
    resultStatus?: 'SUCCESS' | 'FAILED' | 'WARNING';
    action?: string;
    details?: string;
}

export class AuditService {
    /**
     * Registra un evento de auditoría en la base de datos.
     * Esta operación falla silenciosamente para no interrumpir el flujo principal.
     */
    static async log(
        action: AuditAction,
        entityType: string,
        entityId: string,
        options: {
            oldValues?: any;
            newValues?: any;
            entityName?: string;
            metadata?: AuditMetadata;
        } = {}
    ) {
        try {
            await prisma.auditLog.create({
                data: {
                    action,
                    entityType,
                    entityId,
                    entityName: options.entityName,
                    oldValues: options.oldValues ? (options.oldValues as any) : undefined,
                    newValues: {
                        ...(options.newValues as any || {}),
                        // Preservar metadata extra que no tiene columna propia
                        _details: options.metadata?.details,
                        _action: options.metadata?.action
                    },
                    ipAddress: options.metadata?.ipAddress,
                    userAgent: options.metadata?.userAgent,
                    sessionId: options.metadata?.sessionId,
                    resultStatus: options.metadata?.resultStatus || 'SUCCESS',
                    userId: options.metadata?.userId,
                },
            });
        } catch (error) {
            // Falla silenciosa con log en consola para diagnóstico
            console.error('[AuditService] Error al crear log de auditoría:', error);
        }
    }

    static async logCreation(entityType: string, entityId: string, data: any, userId: string, entityName?: string, metadata?: AuditMetadata) {
        return this.log('CREATE', entityType, entityId, {
            newValues: data,
            entityName,
            metadata: { ...metadata, userId }
        });
    }

    static async logUpdate(entityType: string, entityId: string, oldValues: any, newValues: any, userId: string, entityName?: string, metadata?: AuditMetadata) {
        return this.log('UPDATE', entityType, entityId, {
            oldValues,
            newValues,
            entityName,
            metadata: { ...metadata, userId }
        });
    }

    static async logDeletion(entityType: string, entityId: string, oldValues: any, userId: string, entityName?: string, metadata?: AuditMetadata) {
        return this.log('DELETE', entityType, entityId, {
            oldValues,
            entityName,
            metadata: { ...metadata, userId }
        });
    }

    static async logSecurity(action: AuditAction, details: string, metadata?: AuditMetadata) {
        return this.log(action, 'SECURITY', 'SYSTEM', {
            newValues: { details },
            metadata: { ...metadata, resultStatus: 'FAILED' }
        });
    }
}
