import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAuthEvent } from '@/lib/auth-logger';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get('token');

        if (!token) {
            return NextResponse.json({ error: 'TOKEN_REQUERIDO' }, { status: 400 });
        }

        const verificationToken = await prisma.verificationToken.findUnique({
            where: { token },
        });

        if (!verificationToken || verificationToken.expires < new Date()) {
            return NextResponse.json({ error: 'TOKEN_INVALIDO_O_EXPIRADO' }, { status: 400 });
        }

        // Find user by identifier (email) and update emailVerified
        const user = await prisma.user.update({
            where: { email: verificationToken.identifier },
            data: { emailVerified: new Date() },
        });

        // Delete the token after use
        await prisma.verificationToken.delete({
            where: { token },
        });

        await logAuthEvent(user.id, 'UPDATE', 'Correo electrónico verificado');

        return NextResponse.json({ message: 'CORREO_VERIFICADO' });
    } catch (error) {
        console.error('Email verification error:', error);
        return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
    }
}
