import { PrismaClient } from '../src/generated/client';
const prisma = new PrismaClient();

async function main() {
    console.log('--- Verificando Usuarios ---');
    const users = await prisma.user.findMany({
        select: { id: true, email: true, name: true }
    });
    console.log(JSON.stringify(users, null, 2));
    await prisma.$disconnect();
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
