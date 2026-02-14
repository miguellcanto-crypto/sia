import { PrismaClient } from '../src/generated/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Testing unaccent function directly...');
        // Test with a word that has accents
        const testWord = 'camarón';
        const result: any[] = await prisma.$queryRawUnsafe(`SELECT unaccent('${testWord}') as unaccented;`);
        console.log(`Original: ${testWord}`);
        console.log(`Unaccented: ${result[0].unaccented}`);

        if (result[0].unaccented === 'camaron') {
            console.log('SUCCESS: unaccent function is working correctly!');
        } else {
            console.error('FAILURE: unaccent function returned unexpected result.');
        }
    } catch (error) {
        if (error instanceof Error) {
            console.error('Error testing unaccent function:', error.message);
        } else {
            console.error('Error testing unaccent function:', error);
        }
    } finally {
        await prisma.$disconnect();
    }
}

main();
