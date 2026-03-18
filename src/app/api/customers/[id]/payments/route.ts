import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { AuditService } from '@/services/AuditService';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        const resolvedParams = await params;
        const payments = await prisma.customerPayment.findMany({
            where: { customerId: resolvedParams.id },
            include: {
                user: { select: { name: true } }
            },
            orderBy: { date: 'desc' }
        });

        return NextResponse.json(payments);
    } catch (error) {
        console.error('Error fetching payments:', error);
        return NextResponse.json({ error: 'Error al obtener pagos' }, { status: 500 });
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { amount, paymentMethod, notes } = body;

        if (!amount || amount <= 0) {
            return NextResponse.json({ error: 'El monto debe ser mayor a cero' }, { status: 400 });
        }

        const resolvedParams = await params;
        const result = await prisma.$transaction(async (tx) => {
            const customer = await tx.customer.findUnique({
                where: { id: resolvedParams.id }
            });

            if (!customer) throw new Error('Cliente no encontrado');

            // 1. Create payment record
            const payment = await tx.customerPayment.create({
                data: {
                    customerId: resolvedParams.id,
                    amount: Number(amount),
                    paymentMethod: paymentMethod || 'CASH',
                    notes: notes,
                    userId: (session.user as any).id
                }
            });

            // 2. Update customer balance (reduce debt)
            const newBalance = Number(customer.balance) - Number(amount);
            
            await tx.customer.update({
                where: { id: resolvedParams.id },
                data: { balance: newBalance }
            });

            // 3. Log Audit
            await AuditService.log('UPDATE', 'Customer', resolvedParams.id, {
                newValues: { balance: newBalance, lastPaymentId: payment.id, paymentAmount: amount },
                entityName: customer.name,
                metadata: {
                    action: 'CUSTOMER_PAYMENT_REGISTERED',
                    details: `Registro de abono por $${amount} via ${paymentMethod || 'CASH'}`,
                    userId: (session.user as any).id
                }
            });

            return payment;
        });

        return NextResponse.json(result, { status: 201 });
    } catch (error: any) {
        console.error('Error processing payment:', error);
        return NextResponse.json({ error: error.message || 'Error al procesar el pago' }, { status: 500 });
    }
}
