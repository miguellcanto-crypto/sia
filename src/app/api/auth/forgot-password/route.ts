import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '@/lib/mail';

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: 'EMAIL_REQUERIDO' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email },
        });

        // We return success even if user not found for security (stop email enumeration)
        if (!user) {
            return NextResponse.json({ message: 'SOLICITUD_PROCESADA' });
        }

        // Generate token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 3600000); // 1 hour

        // Deactivate previous tokens for this user
        await prisma.passwordResetToken.updateMany({
            where: { userId: user.id, used: false },
            data: { used: true },
        });

        // Create new token
        await prisma.passwordResetToken.create({
            data: {
                token,
                userId: user.id,
                expiresAt,
            },
        });

        // Send email
        await sendPasswordResetEmail(user.email, token);

        return NextResponse.json({ message: 'SOLICITUD_PROCESADA' });
    } catch (error) {
        console.error('Forgot password error:', error);
        return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
    }
}
