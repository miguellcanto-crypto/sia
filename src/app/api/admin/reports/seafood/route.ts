import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { subDays, startOfDay, endOfDay } from 'date-fns';

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        
        const userRole = (session?.user as any)?.role;
        const userPermissions = (session?.user as any)?.permissions || [];
        const hasReportAccess = userRole === 'ADMIN' || userRole === 'MANAGER' || userPermissions.includes('VIEW_REPORTS');
        
        if (!session?.user || !hasReportAccess) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const days = parseInt(searchParams.get('days') || '7'); // Default 7 días
        
        const endDate = endOfDay(new Date());
        const startDate = startOfDay(subDays(endDate, days));

        // 1. Obtener todos los productos activos
        const activeProducts = await prisma.product.findMany({
            where: { isActive: true },
            select: {
                id: true,
                name: true,
                code: true,
                stock: true,
                price: true,
                cost: true
            }
        });

        // 2. Obtener movimientos de ventas agregados en ese rango de fechas
        const salesItemsGrouped = await prisma.saleItem.groupBy({
            by: ['productId'],
            where: {
                sale: {
                    date: { gte: startDate, lte: endDate },
                    status: 'COMPLETED'
                }
            },
            _sum: {
                quantity: true
            }
        });

        // Diccionario de cantidades vendidas para acceso rápido O(1)
        const salesMap = new Map<string, number>();
        salesItemsGrouped.forEach(item => {
            salesMap.set(item.productId, Number(item._sum.quantity || 0));
        });

        const inactiveProducts: any[] = [];
        const lowRotationProducts: any[] = [];
        const THRESHOLD = 5; // Menos de 5 unidades vendidas se considera baja rotación (configurable en el futuro)

        activeProducts.forEach(product => {
            const quantitySold = salesMap.get(product.id) || 0;
            const currentStock = Number(product.stock || 0);

            // Analizamos solo si hay stock en bodega que se está echando a perder
            if (currentStock > 0) {
                if (quantitySold === 0) {
                    inactiveProducts.push({
                        ...product,
                        stock: currentStock,
                        quantitySold,
                        potentialLoss: currentStock * Number(product.cost || 0)
                    });
                } else if (quantitySold < THRESHOLD) {
                    lowRotationProducts.push({
                        ...product,
                        stock: currentStock,
                        quantitySold,
                        rotationRisk: 'HIGH'
                    });
                }
            }
        });

        const responseData = {
            period: {
                days,
                startDate,
                endDate
            },
            inactive: {
                count: inactiveProducts.length,
                items: inactiveProducts.sort((a, b) => b.potentialLoss - a.potentialLoss) // Ordenar por pérdida potencial
            },
            lowRotation: {
                count: lowRotationProducts.length,
                threshold: THRESHOLD,
                items: lowRotationProducts.sort((a, b) => a.quantitySold - b.quantitySold) 
            }
        };

        return NextResponse.json(responseData);

    } catch (error) {
        console.error('[API Reports Seafood] Error:', error);
        return NextResponse.json(
            { error: 'Error obteniendo reporte de rotación de mariscos' },
            { status: 500 }
        );
    }
}
