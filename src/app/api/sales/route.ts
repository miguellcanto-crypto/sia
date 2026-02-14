import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { NotificationService } from '@/services/NotificationService';
import { NotificationType, Prisma } from '@/generated/client';

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { items, paymentMethod, customerId, discount, tip, tipPercent, cashSessionId, notes } = body;

        if (!items || items.length === 0) {
            return NextResponse.json({ error: 'La venta debe contener al menos un producto' }, { status: 400 });
        }

        // Execute all operations in a single transaction
        const result = await prisma.$transaction(async (tx) => {
            // 1. Calculate totals and check stock
            let subtotal = 0;
            const saleItemsData = [];

            for (const item of items) {
                const product = await tx.product.findUnique({
                    where: { id: item.productId }
                });

                if (!product) throw new Error(`Producto no encontrado: ${item.productId}`);

                const itemQuantity = Number(item.quantity);
                const itemPrice = Number(product.price);
                const itemSubtotal = itemPrice * itemQuantity;

                // Check stock (unless product allows negative stock - though we'll stick to rules)
                if (Number(product.stock) < itemQuantity) {
                    throw new Error(`Stock insuficiente para ${product.name}. Disponible: ${product.stock}`);
                }

                subtotal += itemSubtotal;
                saleItemsData.push({
                    productId: product.id,
                    quantity: itemQuantity,
                    price: itemPrice,
                    subtotal: itemSubtotal
                });

                // 2. Update Product Stock
                const previousStock = Number(product.stock);
                const newStock = previousStock - itemQuantity;

                await tx.product.update({
                    where: { id: product.id },
                    data: { stock: newStock }
                });

                // 3. Log Stock Movement
                await tx.stockMovement.create({
                    data: {
                        productId: product.id,
                        type: 'SALE',
                        quantity: itemQuantity,
                        previousStock: previousStock,
                        newStock: newStock,
                        reason: `Venta POS`,
                        userId: (session.user as any).id
                    }
                });

                // Check critical stock
                const criticalStock = product.criticalStock ? new Prisma.Decimal(product.criticalStock) : new Prisma.Decimal(0);
                if (new Prisma.Decimal(newStock).lte(criticalStock)) {
                    await NotificationService.notify({
                        type: NotificationType.WARNING,
                        title: 'Stock Crítico',
                        message: `El stock de ${product.name} ha bajado a ${newStock} ${product.unit} tras la venta.`,
                        entityType: 'Product',
                        entityId: product.id
                    }, tx);
                }
            }

            const totalDiscount = Number(discount || 0);
            const total = subtotal - totalDiscount;

            // 4. Create Sale Record
            const sale = await tx.sale.create({
                data: {
                    saleNumber: `V-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                    subtotal,
                    discount: totalDiscount,
                    total,
                    paymentMethod: paymentMethod || 'CASH',
                    userId: (session.user as any).id,
                    customerId: customerId,
                    cashSessionId: cashSessionId,
                    tip: Number(tip || 0),
                    tipPercent: Number(tipPercent || 0),
                    notes: notes,
                    status: 'COMPLETED',
                    items: {
                        create: saleItemsData
                    }
                },
                include: {
                    items: {
                        include: {
                            product: true
                        }
                    }
                }
            });

            // 5. Global Notification for Sale
            await NotificationService.notify({
                type: NotificationType.SUCCESS,
                title: 'Venta Realizada',
                message: `Se ha procesado una venta por un total de $${total.toFixed(2)}.`,
                entityType: 'Sale',
                entityId: sale.id
            }, tx);

            return sale;
        });

        return NextResponse.json(result, { status: 201 });

    } catch (error: any) {
        console.error('Sale transaction error:', error);
        return NextResponse.json({
            error: error.message || 'Error al procesar la venta',
            details: error.code === 'P2002' ? 'Conflicto de ID único' : undefined
        }, { status: 500 });
    }
}
