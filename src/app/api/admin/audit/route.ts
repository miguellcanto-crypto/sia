import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { Prisma } from '@/generated/client';
import { AuditService } from '@/services/AuditService';

// Rate Limiting básico en memoria
const RATE_LIMIT_MAP = new Map<string, { count: number, lastReset: number }>();
const LIMIT = 50; // peticiones
const WINDOW = 60 * 1000; // 1 minuto

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

    // Check Rate Limit
    const now = Date.now();
    const rateData = RATE_LIMIT_MAP.get(ip) || { count: 0, lastReset: now };

    if (now - rateData.lastReset > WINDOW) {
        rateData.count = 0;
        rateData.lastReset = now;
    }

    rateData.count++;
    RATE_LIMIT_MAP.set(ip, rateData);

    if (rateData.count > LIMIT) {
        return NextResponse.json({ error: 'Demasiadas peticiones. Intente más tarde.' }, { status: 429 });
    }

    // 4. Seguridad: Verificar rol ADMIN
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
        const userId = (session?.user as any)?.id || 'anonymous';
        await AuditService.log('ACCESS_DENIED', 'SECURITY', 'ADMIN_AUDIT', {
            metadata: {
                userId,
                resultStatus: 'FAILED',
                details: 'Intento de acceso no autorizado a la bitácora de auditoría'
            }
        });
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);

    // Paginación
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Filtros
    const userId = searchParams.get('userId');
    const entityType = searchParams.get('entityType');
    const action = searchParams.get('action');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const resultStatus = searchParams.get('resultStatus');

    try {
        const where: Prisma.AuditLogWhereInput = {};

        if (userId) where.userId = userId;
        if (entityType && entityType !== 'none') where.entityType = entityType;
        if (action && action !== 'none') where.action = action as any;
        if (resultStatus && resultStatus !== 'none') where.resultStatus = resultStatus as any;

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate);
            if (endDate) where.createdAt.lte = new Date(endDate);
        }

        // Ejecutar consultas en paralelo para rendimiento
        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: {
                            name: true,
                            email: true
                        }
                    }
                }
            }),
            prisma.auditLog.count({ where })
        ]);

        return NextResponse.json({
            data: logs,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error: any) {
        console.error('[API Audit] Error:', error);
        return NextResponse.json({ error: 'Error al obtener la bitácora' }, { status: 500 });
    }
}
