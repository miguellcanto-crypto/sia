import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const parkedSales = await prisma.parkedSale.findMany({
            where: {
                userId: (session.user as any).id,
                expiresAt: { gt: new Date() }
            },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(parkedSales);
    } catch (error) {
        return NextResponse.json({ error: 'Error al obtener ventas en espera' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const { name, items, subtotal, customerId, notes } = body;

        const parkedSale = await prisma.parkedSale.create({
            data: {
                name: name || `Venta ${new Date().toLocaleTimeString()}`,
                items: items, // JSON snapshot
                subtotal: Number(subtotal),
                userId: (session.user as any).id,
                customerId: customerId,
                notes: notes,
                expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24) // 24 hours
            }
        });

        return NextResponse.json(parkedSale, { status: 201 });
    } catch (error) {
        console.error('Error parking sale:', error);
        return NextResponse.json({ error: 'Error al poner en espera' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    try {
        await prisma.parkedSale.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 });
    }
}
