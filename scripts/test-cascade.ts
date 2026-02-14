import { prisma } from '../src/lib/prisma';

async function testCascade() {
    console.log('--- Iniciando Prueba de Cascada ---');

    // 1. Crear producto
    const product = await prisma.product.create({
        data: {
            code: 'TEST-CASCADE-001',
            name: 'Producto de Prueba Cascada',
            price: 100,
            cost: 50,
            categoryId: 'cmleemm9f0006u9tkbd53zrfm', // Valid ID from database (3 zeros)
            isActive: true,
            unit: 'kg'
        }
    });
    console.log(`Creado: ${product.id}`);

    // 2. Crear movimiento de stock
    const movement = await prisma.stockMovement.create({
        data: {
            productId: product.id,
            type: 'INITIAL',
            quantity: 10,
            previousStock: 0,
            newStock: 10,
            reason: 'Prueba de cascada'
        }
    });
    console.log(`Movimiento creado: ${movement.id}`);

    // 3. Borrar producto
    console.log('Borrando producto...');
    await prisma.product.delete({
        where: { id: product.id }
    });

    // 4. Verificar si el movimiento sigue existiendo
    const checkMovement = await prisma.stockMovement.findUnique({
        where: { id: movement.id }
    });

    if (!checkMovement) {
        console.log('✅ EXITO: El movimiento de stock se eliminó automáticamente.');
    } else {
        console.error('❌ FALLO: El movimiento de stock sigue existiendo.');
    }
}

testCascade().catch(console.error);
