import { PrismaClient } from '../src/generated/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Enabling unaccent extension...');
        // We use the direct URL for this operation to ensure we have sufficient permissions
        await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS unaccent;');
        console.log('Unaccent extension enabled successfully.');
    } catch (error) {
        if (error instanceof Error) {
            console.error('Error enabling unaccent extension:', error.message);
        } else {
            console.error('Error enabling unaccent extension:', error);
        }
    } finally {
        await prisma.$disconnect();
    }
}

main();
