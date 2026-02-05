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
            register: true
        }
    });

    return NextResponse.json(currentSession);
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const { registerId, openingAmount, notes } = body;

        // Check if user already has an open session
        const existingSession = await prisma.cashSession.findFirst({
            where: {
                userId: (session.user as any).id,
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
                userId: (session.user as any).id,
                openingAmount: Number(openingAmount),
                notes,
                status: 'OPEN'
            }
        });

        return NextResponse.json(newSession, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Error al abrir la sesión' }, { status: 500 });
    }
}
