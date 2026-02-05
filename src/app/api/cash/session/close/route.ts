import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const { sessionId, closingAmount, closingNotes } = body;

        const currentSession = await prisma.cashSession.findUnique({
            where: { id: sessionId },
            include: {
                sales: true,
                movements: true
            }
        });

        if (!currentSession || currentSession.status !== 'OPEN') {
            return NextResponse.json({ error: 'Sesión no encontrada o ya cerrada' }, { status: 404 });
        }

        // Calculate expected amount
        const totalSales = currentSession.sales.reduce((acc, sale) => acc + Number(sale.total), 0);
        const totalMovements = currentSession.movements.reduce((acc, mov) => {
            if (mov.type === 'CASH_IN' || mov.type === 'INITIAL') return acc + Number(mov.amount);
            if (mov.type === 'CASH_OUT') return acc - Number(mov.amount);
            return acc;
        }, 0);

        const expectedAmount = Number(currentSession.openingAmount) + totalSales + totalMovements;
        const actualClosing = Number(closingAmount);
        const difference = actualClosing - expectedAmount;

        const updatedSession = await prisma.cashSession.update({
            where: { id: sessionId },
            data: {
                closingAmount: actualClosing,
                expectedAmount,
                difference,
                closingNotes,
                status: 'CLOSED',
                closedAt: new Date()
            }
        });

        return NextResponse.json(updatedSession);
    } catch (error) {
        return NextResponse.json({ error: 'Error al cerrar la sesión' }, { status: 500 });
    }
}
