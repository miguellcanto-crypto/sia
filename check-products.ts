import { PrismaClient } from './src/generated/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const products = await prisma.product.findMany({
            include: { category: true },
            take: 10
        });

        console.log('--- Product Diagnostics ---');
        products.forEach(p => {
            console.log(`Product: ${p.name}`);
            console.log(`- Code: ${p.code}`);
            console.log(`- isWeighable: ${p.isWeighable} (Type: ${typeof p.isWeighable})`);
            console.log(`- unit: ${p.unit}`);
            console.log('---------------------------');
        });
    } catch (error) {
        console.error('Error fetching products:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
