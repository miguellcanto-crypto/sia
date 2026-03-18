import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        
        // Verificación de Permisos
        const userRole = (session?.user as any)?.role;
        const userPermissions = (session?.user as any)?.permissions || [];
        const hasReportAccess = userRole === 'ADMIN' || userRole === 'MANAGER' || userPermissions.includes('VIEW_REPORTS');
        
        if (!session?.user || !hasReportAccess) {
            return NextResponse.json({ error: 'No autorizado para ver reportes' }, { status: 403 });
        }

        // Determinar "Hoy" (Start of Day to End of Day local)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // 1. Ejecutar las consultas en paralelo
        const [
            salesTodayResult,
            activeCashSessions,
            lowStockProductsCount
        ] = await Promise.all([
            // 1. Ventas del día
            prisma.sale.aggregate({
                where: {
                    date: {
                        gte: today,
                        lt: tomorrow
                    },
                    status: 'COMPLETED'
                },
                _sum: {
                    total: true
                },
                _count: {
                    id: true
                }
            }),
            
            // 2. Cajas Activas
            prisma.cashSession.count({
                where: {
                    status: 'OPEN'
                }
            }),

            // 3. Alertas de Stock Bajo
            // Raw query is sometimes needed because we are comparing two columns (stock <= minStock)
            // But Prisma allows this natively in some ways, or we can just fetch where stock is low.
            // Since Prisma doesn't support comparing two columns directly in the `where` clause easily,
            // we'll execute a raw query or just fetch those with stock <= critical threshold if it's static.
            // Actullay, Prisma preview feature 'fieldReference' allows it, but to be safe we'll use a db query.
            prisma.$queryRaw<{count: bigint}[]>`
                SELECT COUNT(*) as count 
                FROM "Product" 
                WHERE "isActive" = true 
                  AND "stock" <= "minStock"
            `
        ]);

        const lowStockCount = lowStockProductsCount.length > 0 ? Number(lowStockProductsCount[0].count) : 0;

        // 1. Calcular ingresos del día (Ventas + Abonos)
        const [todayPaymentsResult, totalPendingCredit] = await Promise.all([
            prisma.customerPayment.aggregate({
                where: {
                    date: { gte: today, lt: tomorrow }
                },
                _sum: { amount: true }
            }),
            prisma.customer.aggregate({
                _sum: { balance: true }
            })
        ]);

        const totalSalesToday = await prisma.sale.findMany({
            where: {
                date: { gte: today, lt: tomorrow },
                status: 'COMPLETED'
            },
            select: { total: true, paymentMethod: true }
        });

        let liquidSalesToday = 0;
        let creditSalesToday = 0;
        totalSalesToday.forEach(sale => {
            if (sale.paymentMethod === 'CREDIT') {
                creditSalesToday += Number(sale.total);
            } else {
                liquidSalesToday += Number(sale.total);
            }
        });

        const todayPayments = todayPaymentsResult._sum.amount ? Number(todayPaymentsResult._sum.amount) : 0;
        const liquidRevenue = liquidSalesToday + todayPayments;
        const totalPending = totalPendingCredit._sum.balance ? Number(totalPendingCredit._sum.balance) : 0;

        // Estructura garantizada (cero nulos)
        return NextResponse.json({
            sales: {
                todayRevenue: liquidRevenue, // Real cash flow
                todayReceivable: creditSalesToday, // New debt today
                todaySalesCount: totalSalesToday.length,
                totalPendingCredit: totalPending
            },
            cash: {
                activeSessionsCount: activeCashSessions || 0
            },
            inventory: {
                lowStockAlertsCount: lowStockCount
            }
        });

    } catch (error) {
        console.error('[API Reports Summary] Error:', error);
        return NextResponse.json(
            { error: 'Error interno obteniendo el resumen de reportes' }, 
            { status: 500 }
        );
    }
}
