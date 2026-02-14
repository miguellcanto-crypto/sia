import { prisma } from '@/lib/prisma';
import { AuditService } from './AuditService';
import { MovementType, Prisma } from '@/generated/client';

export class ProductService {
    static async create(data: any, userId: string) {
        return await prisma.$transaction(async (tx) => {
            const product = await tx.product.create({
                data: {
                    ...data,
                    version: 0,
                },
            });

            // Record initial movement if stock > 0
            const stockValue = product.stock ? new Prisma.Decimal(product.stock) : new Prisma.Decimal(0);
            if (stockValue.gt(0)) {
                await tx.stockMovement.create({
                    data: {
                        productId: product.id,
                        type: MovementType.INITIAL,
                        quantity: stockValue,
                        previousStock: new Prisma.Decimal(0),
                        newStock: stockValue,
                        userId,
                        reason: 'Initial load',
                    },
                });
            }

            await AuditService.log('CREATE', 'Product', product.id, {
                newValues: product,
                metadata: { userId },
            });

            return product;
        });
    }

    static async updateStock(
        id: string,
        adjustment: number,
        type: MovementType,
        reason: string,
        userId: string,
        currentVersion: number
    ) {
        const product = await prisma.product.findUnique({ where: { id } });
        if (!product) throw new Error('Product not found');

        // Optimistic concurrency check
        if (product.version !== currentVersion) {
            throw new Error('Concurrency conflict: The product has been updated by another user.');
        }

        const previousStock = new Prisma.Decimal(product.stock);
        const newStock = previousStock.plus(adjustment);

        if (newStock.lt(0)) {
            throw new Error('Negative stock is not allowed.');
        }

        const updatedProduct = await prisma.product.update({
            where: {
                id,
                version: currentVersion // Extra safety
            },
            data: {
                stock: newStock,
                version: { increment: 1 },
            },
        });

        await prisma.stockMovement.create({
            data: {
                productId: id,
                type,
                quantity: adjustment,
                previousStock,
                newStock,
                reason,
                userId,
            },
        });

        await AuditService.log('STOCK_ADJUSTED', 'Product', id, {
            oldValues: { stock: previousStock },
            newValues: { stock: newStock },
            metadata: { userId },
        });

        return updatedProduct;
    }

    static async updatePrice(id: string, newPrice: number, newCost: number, reason: string, userId: string) {
        const product = await prisma.product.findUnique({ where: { id } });
        if (!product) throw new Error('Product not found');

        const oldPrice = product.price;
        const oldCost = product.cost;

        const updatedProduct = await prisma.product.update({
            where: { id },
            data: {
                price: newPrice,
                cost: newCost,
                version: { increment: 1 },
            },
        });

        await prisma.priceHistory.create({
            data: {
                productId: id,
                oldPrice,
                newPrice,
                oldCost,
                newCost,
                reason,
                userId,
            },
        });

        await AuditService.log('PRICE_CHANGED', 'Product', id, {
            oldValues: { price: oldPrice, cost: oldCost },
            newValues: { price: newPrice, cost: newCost },
            metadata: { userId },
        });

        return updatedProduct;
    }
}
