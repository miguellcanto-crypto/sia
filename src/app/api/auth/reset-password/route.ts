import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { logAuthEvent } from '@/lib/auth-logger';

export async function POST(request: Request) {
    try {
        const { token, password } = await request.json();

        if (!token || !password) {
            return NextResponse.json({ error: 'TOKEN_Y_CONTRASENA_REQUERIDOS' }, { status: 400 });
        }

        const resetToken = await prisma.passwordResetToken.findUnique({
            where: { token },
            include: { user: true },
        });

        if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
            return NextResponse.json({ error: 'TOKEN_INVALIDO_O_EXPIRADO' }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Update user password and invalidate token
        await prisma.$transaction([
            prisma.user.update({
                where: { id: resetToken.userId },
                data: {
                    passwordHash: hashedPassword,
                    failedAttempts: 0,
                    lockoutUntil: null,
                },
            }),
            prisma.passwordResetToken.update({
                where: { id: resetToken.id },
                data: { used: true },
            }),
            // Optionally invalidate all user sessions here (for security)
            prisma.session.deleteMany({
                where: { userId: resetToken.userId },
            }),
        ]);

        await logAuthEvent(resetToken.userId, 'UPDATE', 'Contraseña restablecida mediante token');

        return NextResponse.json({ message: 'CONTRASENA_RESTABLECIDA' });
    } catch (error) {
        console.error('Reset password error:', error);
        return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
    }
}
