import { PrismaClient } from '../src/generated/client';
const prisma = new PrismaClient();

async function main() {
    const registers = await prisma.cashRegister.findMany();
    console.log('Cajas encontradas:', JSON.stringify(registers, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
