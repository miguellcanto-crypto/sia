import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// Caché en memoria para el inventario (se asume que es una vista macro de reporte, no en tiempo real crítico)
const CACHE = { data: null as any, timestamp: 0 };
const CACHE_TTL = 30 * 60 * 1000; // 30 minutos

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        
        const userRole = (session?.user as any)?.role;
        const userPermissions = (session?.user as any)?.permissions || [];
        const hasReportAccess = userRole === 'ADMIN' || userRole === 'MANAGER' || userPermissions.includes('VIEW_REPORTS');
        
        if (!session?.user || !hasReportAccess) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
        }

        // Devolver caché si es válido
        if (CACHE.data && (Date.now() - CACHE.timestamp < CACHE_TTL)) {
            return NextResponse.json(CACHE.data);
        }

        // Consultamos productos activos para las métricas de valoración y distribución
        const activeProducts = await prisma.product.findMany({
            where: { isActive: true },
            select: {
                id: true,
                name: true,
                code: true,
                stock: true,
                minStock: true,
                cost: true,
                price: true,
                categoryId: true
            }
        });

        // 1. Valoración de Stock
        let totalCostValuation = 0;
        let totalPriceValuation = 0;
        let totalItemsInStock = 0;

        // 2. Alertas de bajo stock
        const lowStockItems: any[] = [];

        // 3. Distribución por Categoría
        const categoryMap = new Map<string, { count: number, stock: number }>();

        activeProducts.forEach(p => {
            const stock = Number(p.stock || 0);
            const cost = Number(p.cost || 0);
            const price = Number(p.price || 0);

            if (stock > 0) {
                totalCostValuation += (stock * cost);
                totalPriceValuation += (stock * price);
                totalItemsInStock += stock;
            }

            if (stock <= Number(p.minStock)) {
                lowStockItems.push({
                    id: p.id,
                    name: p.name,
                    code: p.code,
                    stock: stock,
                    minStock: Number(p.minStock)
                });
            }

            const catId = p.categoryId;
            const catStats = categoryMap.get(catId) || { count: 0, stock: 0 };
            catStats.count++;
            catStats.stock += stock;
            categoryMap.set(catId, catStats);
        });

        // Completamos los nombres de categorías
        const categoryIds = Array.from(categoryMap.keys());
        const categories = await prisma.category.findMany({
            where: { id: { in: categoryIds } },
            select: { id: true, name: true }
        });

        const categoryDistribution = categories.map(c => ({
            id: c.id,
            name: c.name,
            productsCount: categoryMap.get(c.id)?.count || 0,
            totalStock: categoryMap.get(c.id)?.stock || 0
        })).sort((a, b) => b.totalStock - a.totalStock); // Top stock categories first

        const responseData = {
            valuation: {
                totalCostValuation,
                totalPriceValuation,
                potentialProfit: totalPriceValuation - totalCostValuation,
                totalItemsInStock
            },
            lowStockItems: lowStockItems.sort((a, b) => a.stock - b.stock).slice(0, 50), // Limitamos a 50
            categoryDistribution
        };

        // Guardar en caché
        CACHE.data = responseData;
        CACHE.timestamp = Date.now();

        return NextResponse.json(responseData);

    } catch (error) {
        console.error('[API Reports Inventory] Error:', error);
        return NextResponse.json(
            { error: 'Error obteniendo reporte de inventario' },
            { status: 500 }
        );
    }
}
