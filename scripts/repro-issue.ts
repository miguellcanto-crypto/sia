
import { PrismaClient } from '../src/generated/client';

const prisma = new PrismaClient();

async function reproduce() {
    process.stdout.write('--- REPRODUCTION START ---\n');

    try {
        const product = await prisma.product.findUnique({
            where: { code: 'MAR-CAM-P' }
        });

        if (!product) {
            process.stdout.write('Product not found. Please run seed first.\n');
            return;
        }

        const initialStock = product.stock.toString();
        const criticalStock = product.criticalStock.toString();
        process.stdout.write(`Initial Product: ${product.name}, Stock: ${initialStock}, Critical: ${criticalStock}\n`);

        const isInitialCritical = Number(product.stock) <= Number(product.criticalStock);
        process.stdout.write(`Initial isCritical: ${isInitialCritical}\n`);

        const newStockVal = 10.5;
        process.stdout.write(`Updating stock to: ${newStockVal}\n`);

        const updatedProduct = await prisma.product.update({
            where: { id: product.id },
            data: {
                stock: newStockVal,
                version: { increment: 1 }
            }
        });

        const finalStock = updatedProduct.stock.toString();
        process.stdout.write(`Updated Product: ${updatedProduct.name}, Stock: ${finalStock}, Critical: ${criticalStock}\n`);

        const isFinalCritical = Number(updatedProduct.stock) <= Number(updatedProduct.criticalStock);
        process.stdout.write(`Final isCritical: ${isFinalCritical}\n`);

        if (!isFinalCritical) {
            process.stdout.write('SUCCESS: Product is no longer critical.\n');
        } else {
            process.stdout.write('FAILURE: Product is still critical!\n');
        }

        // Reset
        await prisma.product.update({
            where: { id: product.id },
            data: {
                stock: product.stock,
                version: { increment: 1 }
            }
        });
    } catch (err: any) {
        process.stdout.write(`ERROR: ${err.message}\n`);
    } finally {
        await prisma.$disconnect();
        process.stdout.write('--- REPRODUCTION END ---\n');
    }
}

reproduce();
