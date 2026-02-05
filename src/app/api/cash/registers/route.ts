import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const registers = await prisma.cashRegister.findMany({
            where: { isActive: true }
        });
        return NextResponse.json(registers);
    } catch (error) {
        return NextResponse.json({ error: 'Error al obtener cajas' }, { status: 500 });
    }
}
