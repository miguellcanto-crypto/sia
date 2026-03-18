import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    const params = await context.params;
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const userPermissions = (session.user as any).permissions || [];
        const userRole = (session.user as any).role;

        if (userRole !== 'ADMIN' && userRole !== 'MANAGER' && !userPermissions.includes('VIEW_CUSTOMERS')) {
            return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
        const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '50')));
        const skip = (page - 1) * limit;

        const [sales, total] = await Promise.all([
            prisma.sale.findMany({
                where: { customerId: params.id },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    user: { select: { name: true } },
                    items: {
                        include: {
                            product: { select: { name: true } }
                        }
                    }
                }
            }),
            prisma.sale.count({ where: { customerId: params.id } })
        ]);

        return NextResponse.json({
            sales,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Error fetching customer sales history:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor al obtener historial de compras' },
            { status: 500 }
        );
    }
}
