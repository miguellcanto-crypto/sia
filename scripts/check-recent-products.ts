import { prisma } from '../src/lib/prisma';

async function checkRecentProducts() {
    console.log('--- Ultimos 20 productos en Prisma ---');
    const products = await prisma.product.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: { category: true }
    });

    if (products.length === 0) {
        console.log('No hay productos en la DB.');
        return;
    }

    products.forEach(p => {
        console.log(`[${p.isActive ? 'ACTIVO' : 'INACT'}] Created: ${p.createdAt.toISOString()} | Name: ${p.name} | Code: ${p.code} | ID: ${p.id}`);
    });
}

checkRecentProducts().catch(console.error);
