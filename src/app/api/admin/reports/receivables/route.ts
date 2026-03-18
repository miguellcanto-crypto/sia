import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        
        const userRole = (session?.user as any)?.role;
        const userPermissions = (session?.user as any)?.permissions || [];
        const hasReportAccess = userRole === 'ADMIN' || userRole === 'MANAGER' || userPermissions.includes('VIEW_REPORTS');
        
        if (!session?.user || !hasReportAccess) {
            return NextResponse.json({ error: 'No autorizado para ver reportes' }, { status: 403 });
        }

        // 1. Obtener todos los clientes con saldo pendiente > 0
        const customersWithDebt = await prisma.customer.findMany({
            where: {
                balance: { gt: 0 },
                isActive: true
            },
            select: {
                id: true,
                code: true,
                name: true,
                balance: true,
                creditLimit: true,
                updatedAt: true,
                phone: true
            },
            orderBy: {
                balance: 'desc'
            }
        });

        // 2. Calcular totales generales
        const totals = customersWithDebt.reduce((acc, current) => {
            return {
                totalDebt: acc.totalDebt + Number(current.balance),
                totalCustomers: acc.totalCustomers + 1
            };
        }, { totalDebt: 0, totalCustomers: 0 });

        // 3. Obtener ventas a crédito recientes (opcional, para contexto)
        const recentCreditSales = await prisma.sale.findMany({
            where: {
                paymentMethod: 'CREDIT',
                status: 'COMPLETED'
            },
            orderBy: { date: 'desc' },
            take: 20,
            include: {
                customer: { select: { name: true, code: true } }
            }
        });

        return NextResponse.json({
            summary: {
                totalPendingAmount: totals.totalDebt,
                debtorCount: totals.totalCustomers,
            },
            debtors: customersWithDebt.map(d => ({
                ...d,
                balance: Number(d.balance),
                creditLimit: Number(d.creditLimit),
                usagePercent: Number(d.creditLimit) > 0 ? (Number(d.balance) / Number(d.creditLimit)) * 100 : 0
            })),
            recentCreditSales: recentCreditSales.map(s => ({
                id: s.id,
                saleNumber: s.saleNumber,
                total: Number(s.total),
                date: s.date,
                customerName: s.customer?.name || 'Venta Express'
            }))
        });

    } catch (error) {
        console.error('[API Reports Receivables] Error:', error);
        return NextResponse.json(
            { error: 'Error interno obteniendo el reporte de cartera' }, 
            { status: 500 }
        );
    }
}
