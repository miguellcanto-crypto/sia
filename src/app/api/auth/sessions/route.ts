import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAuthEvent } from '@/lib/auth-logger';

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return NextResponse.json({ error: 'NO_AUTORIZADO' }, { status: 401 });
    }

    try {
        const sessions = await prisma.session.findMany({
            where: { userId: (session.user as any).id },
            orderBy: { expires: 'desc' },
        });

        return NextResponse.json(sessions);
    } catch (error) {
        return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return NextResponse.json({ error: 'NO_AUTORIZADO' }, { status: 401 });
    }

    try {
        const { sessionId } = await request.json();

        if (!sessionId) {
            return NextResponse.json({ error: 'ID_DE_SESION_REQUERIDO' }, { status: 400 });
        }

        // Delete specific session
        await prisma.session.delete({
            where: {
                id: sessionId,
                userId: (session.user as any).id // Security check
            },
        });

        await logAuthEvent((session.user as any).id, 'LOGOUT', `Sesión ${sessionId} revocada`);

        return NextResponse.json({ message: 'SESION_REVOCADA' });
    } catch (error) {
        return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
    }
}
