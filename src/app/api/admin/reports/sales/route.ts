import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { startOfDay, endOfDay, parseISO, isBefore, subDays } from 'date-fns';

// In-memory simple cache for historical queries
const CACHE = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutos en caché

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        
        const userRole = (session?.user as any)?.role;
        const userPermissions = (session?.user as any)?.permissions || [];
        const hasReportAccess = userRole === 'ADMIN' || userRole === 'MANAGER' || userPermissions.includes('VIEW_REPORTS');
        
        if (!session?.user || !hasReportAccess) {
            return NextResponse.json({ error: 'No autorizado para ver reportes' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        
        let startDateStr = searchParams.get('startDate');
        let endDateStr = searchParams.get('endDate');

        // Si no mandan fechas, default a los últimos 30 días
        const endDate = endDateStr ? endOfDay(parseISO(endDateStr)) : endOfDay(new Date());
        const startDate = startDateStr ? startOfDay(parseISO(startDateStr)) : startOfDay(subDays(endDate, 30));

        // Clave de caché
        const cacheKey = `sales_${startDate.toISOString()}_${endDate.toISOString()}`;
        
        // Si la solicitud es histórica (ej. más de hace 1 día) podemos cachearla más agresivamente
        // Validamos si está en caché
        const cached = CACHE.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
            return NextResponse.json(cached.data);
        }

        const dateRangeFilter = {
            date: {
                gte: startDate,
                lte: endDate
            },
            status: 'COMPLETED' as const
        };

        // 1. Totales Agregados
        const totalsResult = await prisma.sale.aggregate({
            where: dateRangeFilter,
            _sum: {
                total: true,
                subtotal: true,
                discount: true,
                tax: true
            },
            _count: {
                id: true
            }
        });

        const totalRevenue = Number(totalsResult._sum.total || 0);
        const totalSalesCount = totalsResult._count.id;
        const totalDiscount = Number(totalsResult._sum.discount || 0);
        const averageTicket = totalSalesCount > 0 ? totalRevenue / totalSalesCount : 0;

        // 2. Por Método de Pago
        const paymentMethodsGroup = await prisma.sale.groupBy({
            by: ['paymentMethod'],
            where: dateRangeFilter,
            _sum: { total: true },
            _count: { id: true }
        });

        const paymentMethods = paymentMethodsGroup.map(pm => ({
            method: pm.paymentMethod,
            total: Number(pm._sum.total || 0),
            count: pm._count.id
        }));

        // 3. Productos Top (Más vendidos en ese rango)
        // Agrupamos SaleItem que pertenezcan a las ventas completadas en ese rango
        const topProductsItems = await prisma.saleItem.groupBy({
            by: ['productId'],
            where: {
                sale: dateRangeFilter
            },
            _sum: {
                quantity: true,
                subtotal: true
            },
            orderBy: {
                _sum: {
                    quantity: 'desc'
                }
            },
            take: 10
        });

        // Completar la info de los productos top
        const topProductIds = topProductsItems.map(tp => tp.productId);
        const productsInfo = await prisma.product.findMany({
            where: { id: { in: topProductIds } },
            select: { id: true, name: true, code: true }
        });

        const topProducts = topProductsItems.map(tp => {
            const prod = productsInfo.find(p => p.id === tp.productId);
            return {
                id: tp.productId,
                name: prod?.name || 'Desconocido',
                code: prod?.code || '-',
                quantitySold: Number(tp._sum.quantity || 0),
                revenue: Number(tp._sum.subtotal || 0)
            };
        });

        const responseData = {
            summary: {
                totalRevenue,
                totalSalesCount,
                totalDiscount,
                averageTicket
            },
            paymentMethods,
            topProducts,
            // Proveer siempre la estructura, si no hay info, serán ceros o arrays vacíos
        };

        // Solo cachear si hay datos históricos significativos 
        // Si abarca hoy, podría cambiar, pero lo cacheamos por corto tiempo (definido en TTL)
        CACHE.set(cacheKey, { data: responseData, timestamp: Date.now() });

        return NextResponse.json(responseData);

    } catch (error) {
        console.error('[API Reports Sales] Error:', error);
        return NextResponse.json(
            { error: 'Error interno obteniendo el reporte de ventas' }, 
            { status: 500 }
        );
    }
}
