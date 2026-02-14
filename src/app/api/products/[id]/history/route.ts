import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const [movements, priceHistory] = await Promise.all([
            prisma.stockMovement.findMany({
                where: { productId: id },
                orderBy: { createdAt: 'desc' },
                include: { user: { select: { name: true } } }
            }),
            prisma.priceHistory.findMany({
                where: { productId: id },
                orderBy: { createdAt: 'desc' },
                include: { user: { select: { name: true } } }
            })
        ]);

        // Merge and sort for timeline
        const timeline = [
            ...movements.map(m => ({
                id: m.id,
                type: 'STOCK',
                actionLabel: 'Ajuste de Stock',
                date: m.createdAt,
                quantity: Number(m.quantity),
                reason: m.reason || 'Movimiento de inventario',
                user: m.user?.name,
                unit: 'kg'
            })),
            ...priceHistory.map(p => ({
                id: p.id,
                type: 'PRICE',
                actionLabel: 'Cambio de Precio',
                date: p.createdAt,
                newValue: Number(p.newPrice),
                oldValue: Number(p.oldPrice),
                reason: p.reason || 'Actualización de mercado',
                user: p.user?.name
            }))
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return NextResponse.json(timeline);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
    }
}
