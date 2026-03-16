import { AuditAction } from '@/generated/client';
import { AuditService } from '@/services/AuditService';

export async function logAuthEvent(
    userId: string | null,
    action: AuditAction,
    details: string,
    ip?: string,
    userAgent?: string
) {
    const isSuccess = details.toLowerCase().includes('exitoso') || details.toLowerCase().includes('success');

    await AuditService.log(action, 'User', userId || 'unknown', {
        newValues: { details },
        metadata: {
            userId: userId || undefined,
            ipAddress: ip,
            userAgent: userAgent,
            resultStatus: isSuccess ? 'SUCCESS' : 'FAILED'
        }
    });
}
