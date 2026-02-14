import { prisma } from '../src/lib/prisma';

async function debugCategory() {
    const category = await prisma.category.findFirst();
    if (category) {
        console.log(`ID: "${category.id}"`);
        console.log(`Length: ${category.id.length}`);
        console.log(`Hex: ${Buffer.from(category.id).toString('hex')}`);
    } else {
        console.log('No categories found.');
    }
}

debugCategory().catch(console.error);
