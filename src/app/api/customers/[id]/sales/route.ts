import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
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
        const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '50')));

        const sales = await prisma.sale.findMany({
            where: { customerId: params.id },
            orderBy: { date: 'desc' },
            take: limit,
            include: {
                items: {
                    include: {
                        product: { select: { name: true } }
                    }
                }
            }
        });

        return NextResponse.json(sales);

    } catch (error) {
        console.error('Error fetching customer sales history:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor al obtener historial de compras' },
            { status: 500 }
        );
    }
}
