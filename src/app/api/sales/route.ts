import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { NotificationService } from '@/services/NotificationService';
import { NotificationType, Prisma } from '@/generated/client';
import { AuditService } from '@/services/AuditService';

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { items, paymentMethod, customerId, discount, pointsUsed, tip, tipPercent, cashSessionId, notes } = body;

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

            // 5. Customer Logic: Credit & Points
            if (customerId) {
                const customer = await tx.customer.findUnique({ where: { id: customerId } });
                if (!customer) throw new Error('Cliente no encontrado');

                // Variables for updating
                let newBalance = Number(customer.balance);
                let newPoints = customer.points;

                // 1. Validate and apply CREDIT sale
                if (paymentMethod === 'CREDIT') {
                    newBalance += total; // Add to debt
                    const availableCredit = Number(customer.creditLimit) - Number(customer.balance);
                    // Add buffer to allow frontend-backend math differences (e.g. 0.01)
                    if (total > availableCredit + 0.1) {
                        throw new Error('Límite de crédito excedido para este cliente.');
                    }
                }

                // 2. Validate and apply POINTS deduction
                if (pointsUsed && pointsUsed > 0) {
                    if (pointsUsed > customer.points) {
                        throw new Error('Puntos insuficientes para redimir');
                    }
                    newPoints -= pointsUsed;

                    await tx.customerPointHistory.create({
                        data: {
                            customerId: customerId,
                            points: -pointsUsed,
                            type: 'REDEEMED',
                            reason: `Canje en venta ${sale.saleNumber}`,
                            userId: (session.user as any).id,
                            saleId: sale.id
                        }
                    });
                }

                // 3. Acumular Puntos de Lealtad (1 punto por cada $10 gastados, sobre el Total pagado)
                const pointsEarned = Math.floor(Math.max(0, total) / 10);
                if (pointsEarned > 0) {
                    newPoints += pointsEarned;
                    await tx.customerPointHistory.create({
                        data: {
                            customerId: customerId,
                            points: pointsEarned,
                            type: 'EARNED',
                            reason: `Venta ${sale.saleNumber}`,
                            userId: (session.user as any).id,
                            saleId: sale.id
                        }
                    });
                }

                // 4. Update Customer State
                const newTier = newPoints >= 2000 ? 'GOLD' : newPoints >= 500 ? 'SILVER' : 'BRONZE';
                
                await tx.customer.update({
                    where: { id: customerId },
                    data: { points: newPoints, tier: newTier, balance: newBalance }
                });
            }

            // 6. Notification for Sale (targeted to current user)
            await NotificationService.notify({
                type: NotificationType.SUCCESS,
                title: 'Venta Realizada',
                message: `Se ha procesado una venta por un total de $${total.toFixed(2)}.`,
                userId: (session.user as any).id,
                entityType: 'Sale',
                entityId: sale.id
            }, tx);

            // 6. Auditoría de Venta
            await AuditService.log('SALE_CREATED', 'Sale', sale.id, {
                newValues: sale,
                entityName: sale.saleNumber,
                metadata: {
                    userId: (session.user as any).id,
                    ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
                }
            });

            return sale;
        });

        return NextResponse.json(result, { status: 201 });

    } catch (error: any) {
        console.error('Sale transaction error:', error);

        // Auditoría de Venta Fallida
        const session = await getServerSession(authOptions);
        if (session?.user) {
            await AuditService.log('SALE_CREATED', 'Sale', 'FAILED', {
                metadata: {
                    userId: (session.user as any).id,
                    resultStatus: 'FAILED',
                    details: error.message
                }
            });
        }

        return NextResponse.json({
            error: error.message || 'Error al procesar la venta',
            details: error.code === 'P2002' ? 'Conflicto de ID único' : undefined
        }, { status: 500 });
    }
}
