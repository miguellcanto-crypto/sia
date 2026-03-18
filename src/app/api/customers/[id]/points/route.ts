import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { customerPointAdjustmentSchema } from '@/lib/validations/customer';

// Helper function to calculate the tier based on points
function calculateTier(points: number): string {
    if (points >= 2000) return 'GOLD';
    if (points >= 500) return 'SILVER';
    return 'BRONZE';
}

export async function POST(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    const params = await context.params;
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || !(session.user as any).id) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const userPermissions = (session.user as any).permissions || [];
        const userRole = (session.user as any).role;

        if (userRole !== 'ADMIN' && userRole !== 'MANAGER' && !userPermissions.includes('EDIT_CUSTOMER')) {
            return NextResponse.json({ error: 'Permisos insuficientes para ajustar puntos' }, { status: 403 });
        }

        const body = await request.json();
        const validationResult = customerPointAdjustmentSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                { error: 'Datos de ajuste inválidos', details: validationResult.error.format() },
                { status: 400 }
            );
        }

        const data = validationResult.data;

        // Inicia transacción para que tanto el log de historial como el balance general del cliente se modifiquen
        const updatedCustomer = await prisma.$transaction(async (tx) => {
            const customer = await tx.customer.findUnique({
                where: { id: params.id }
            });

            if (!customer) {
                throw new Error('CLIENTE_NO_ENCONTRADO');
            }

            // Calculamos nuevos puntos y asignamos el nuevo tier automáticamente
            const newTotalPoints = Math.max(0, customer.points + data.points);
            const newTier = calculateTier(newTotalPoints);

            // 1. Guardar el movimiento en el historial
            await tx.customerPointHistory.create({
                data: {
                    customerId: customer.id,
                    points: data.points,
                    type: 'MANUAL_ADJUSTMENT',
                    reason: data.reason,
                    userId: (session.user as any).id
                }
            });

            // 2. Actualizar el cliente
            return await tx.customer.update({
                where: { id: customer.id },
                data: {
                    points: newTotalPoints,
                    tier: newTier
                }
            });
        });

        return NextResponse.json({
            message: 'Puntos ajustados exitosamente',
            customer: updatedCustomer
        });

    } catch (error: any) {
        console.error('Error adjusting customer points:', error);
        if (error.message === 'CLIENTE_NO_ENCONTRADO') {
            return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
        }
        return NextResponse.json(
            { error: 'Error interno del servidor al ajustar puntos del cliente' },
            { status: 500 }
        );
    }
}
