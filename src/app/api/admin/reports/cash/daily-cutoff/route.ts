import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { startOfDay, endOfDay } from 'date-fns';

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const sessionIdQuery = searchParams.get('sessionId');

        let targetSessionId = sessionIdQuery;

        // Si no se envía ID de sesión, buscar la última sesión abierta o cerrada de HOY para este usuario (o cualquiera si es admin)
        if (!targetSessionId) {
            const today = new Date();
            const start = startOfDay(today);
            const end = endOfDay(today);

            const latestSession = await prisma.cashSession.findFirst({
                where: {
                    openedAt: { gte: start, lte: end },
                    // Si el usuario no es admin/manager, solo ve SU propia sesión
                    ...(!['ADMIN', 'MANAGER'].includes((session.user as any).role) ? { userId: (session.user as any).id } : {})
                },
                orderBy: { openedAt: 'desc' }
            });

            if (!latestSession) {
                return NextResponse.json({ error: 'No se encontró ninguna sesión de caja para hoy' }, { status: 404 });
            }
            targetSessionId = latestSession.id;
        }

        // Obtener la sesión con todos los detalles
        const cashSession = await prisma.cashSession.findUnique({
            where: { id: targetSessionId! },
            include: {
                user: { select: { name: true, email: true } },
                register: { select: { name: true } },
                movements: {
                    orderBy: { createdAt: 'asc' }
                },
                sales: {
                    where: { status: 'COMPLETED' },
                    select: {
                        paymentMethod: true,
                        total: true,
                        discount: true,
                        id: true
                    }
                }
            }
        });

        if (!cashSession) {
            return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 });
        }

        // El encargado solo puede ver su propio corte a menos que sea Admin/Manager
        const userRole = (session.user as any).role;
        if (userRole !== 'ADMIN' && userRole !== 'MANAGER' && cashSession.userId !== (session.user as any).id) {
            return NextResponse.json({ error: 'No tienes permiso para ver cortes de caja de otros usuarios' }, { status: 403 });
        }

        // Agrupar ventas por método de pago
        const salesByMethod: Record<string, { total: number, count: number }> = {
            CASH: { total: 0, count: 0 },
            CARD: { total: 0, count: 0 },
            TRANSFER: { total: 0, count: 0 },
            OTHER: { total: 0, count: 0 }
        };

        let totalSalesCount = 0;
        let totalRevenue = 0;

        cashSession.sales.forEach(sale => {
            const method = sale.paymentMethod;
            const amount = Number(sale.total);
            
            if (salesByMethod[method]) {
                salesByMethod[method].total += amount;
                salesByMethod[method].count += 1;
            }
            
            totalRevenue += amount;
            totalSalesCount++;
        });

        const cashInMovements = cashSession.movements.filter(m => m.type === 'CASH_IN').reduce((acc, curr) => acc + Number(curr.amount), 0);
        const cashOutMovements = cashSession.movements.filter(m => m.type === 'CASH_OUT').reduce((acc, curr) => acc + Number(curr.amount), 0);

        const responseData = {
            sessionId: cashSession.id,
            status: cashSession.status,
            openedAt: cashSession.openedAt,
            closedAt: cashSession.closedAt,
            cashier: cashSession.user,
            register: cashSession.register.name,
            
            // Saldos
            openingAmount: Number(cashSession.openingAmount),
            expectedAmount: Number(cashSession.expectedAmount || 0),
            closingAmount: Number(cashSession.closingAmount || 0),
            difference: Number(cashSession.difference || 0),
            
            notes: cashSession.notes,
            closingNotes: cashSession.closingNotes,

            // Movimientos manuales
            movements: {
                totalCashIn: cashInMovements,
                totalCashOut: cashOutMovements,
                details: cashSession.movements.map(m => ({
                    type: m.type,
                    amount: Number(m.amount),
                    reason: m.reason,
                    time: m.createdAt
                }))
            },

            // Resumen Ventas
            sales: {
                totalRevenue,
                totalSalesCount,
                byMethod: salesByMethod
            }
        };

        return NextResponse.json(responseData);

    } catch (error) {
        console.error('[API Reports Daily Cutoff] Error:', error);
        return NextResponse.json(
            { error: 'Error obteniendo corte de caja diario' },
            { status: 500 }
        );
    }
}
