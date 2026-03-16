import { AuditService } from '../src/services/AuditService';
import { prisma } from '../src/lib/prisma';

async function testEntityName() {
    console.log('--- Iniciando prueba de entityName ---');

    const testId = 'test-' + Date.now();
    const testName = 'Producto de Prueba Verificación';

    await AuditService.logCreation('Product', testId, { price: 10 }, 'system', testName);

    const log = await prisma.auditLog.findFirst({
        where: { entityId: testId },
        orderBy: { createdAt: 'desc' }
    });

    if (log && log.entityName === testName) {
        console.log('✅ ÉXITO: El entityName se guardó correctamente:', log.entityName);
    } else {
        console.log('❌ ERROR: El entityName no coincide o no se guardó.', log);
    }
}

testEntityName()
    .catch(console.error)
    .finally(() => process.exit());
