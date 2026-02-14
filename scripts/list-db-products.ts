import { prisma } from '../src/lib/prisma';

async function listProducts() {
    console.log('--- Consultando Base de Datos (Prisma) ---');
    const products = await prisma.product.findMany({
        select: {
            id: true,
            name: true,
            isActive: true,
            code: true
        }
    });

    console.log(`Total productos encontrados: ${products.length}`);
    products.forEach(p => {
        console.log(`[${p.isActive ? 'ACTIVO' : 'INACT'}] ID: ${p.id} | Code: ${p.code} | Name: ${p.name}`);
    });
}

listProducts().catch(console.error);
