import { prisma } from '../src/lib/prisma';

async function findCategory() {
    const category = await prisma.category.findFirst();
    if (category) {
        console.log(`CATEGORY_ID: ${category.id}`);
    } else {
        console.log('No categories found.');
    }
}

findCategory().catch(console.error);
