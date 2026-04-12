import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const currentSession = await prisma.cashSession.findFirst({
        where: {
            userId: (session.user as any).id,
            status: 'OPEN'
        },
        include: {
            register: true,
            sales: true,
            movements: true
        }
    });

    if (!currentSession) {
        return NextResponse.json(null);
    }

    const totalSales = currentSession.sales
        .filter(sale => sale.paymentMethod !== 'CREDIT')
        .reduce((acc, sale) => acc + Number(sale.total), 0);
    
    const totalMovements = currentSession.movements.reduce((acc, mov) => {
        if (mov.type === 'CASH_IN' || mov.type === 'INITIAL') return acc + Number(mov.amount);
        if (mov.type === 'CASH_OUT') return acc - Number(mov.amount);
        return acc;
    }, 0);

    const expectedAmount = Number(currentSession.openingAmount) + totalSales + totalMovements;

    // Quitar movements y sales para no sobrecargar el payload
    const { sales, movements, ...sessionData } = currentSession;

    return NextResponse.json({
        ...sessionData,
        expectedAmount
    });
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();

        const { registerId, openingAmount, notes } = body;

        if (!registerId) {
            return NextResponse.json({ error: 'Caja no seleccionada' }, { status: 400 });
        }

        const userId = (session.user as any).id;
        if (!userId) {
            return NextResponse.json({ error: 'ID de usuario no encontrado en la sesión' }, { status: 401 });
        }

        // Verify user exists in database
        const userExists = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!userExists) {
            return NextResponse.json({
                error: 'Su sesión es inválida o el usuario ha sido eliminado. Por favor, cierre sesión e inicie nuevamente.',
                code: 'INVALID_SESSION'
            }, { status: 401 });
        }

        // Check if user already has an open session
        const existingSession = await prisma.cashSession.findFirst({
            where: {
                userId: userId,
                status: 'OPEN'
            }
        });

        if (existingSession) {
            return NextResponse.json({ error: 'Ya tienes una sesión abierta' }, { status: 400 });
        }

        // Check if register is already in use
        const registerInUse = await prisma.cashSession.findFirst({
            where: {
                registerId,
                status: 'OPEN'
            }
        });

        if (registerInUse) {
            return NextResponse.json({ error: 'Esta caja ya está en uso por otro usuario' }, { status: 400 });
        }

        const newSession = await prisma.cashSession.create({
            data: {
                registerId,
                userId: userId,
                openingAmount: Number(openingAmount) || 0,
                notes: notes || '',
                status: 'OPEN'
            }
        });

        return NextResponse.json(newSession, { status: 201 });
    } catch (error) {
        return NextResponse.json({
            error: 'Error al abrir la sesión',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
