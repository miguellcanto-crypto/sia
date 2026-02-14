import { PrismaClient } from '../src/generated/client'

const prisma = new PrismaClient()

async function main() {
    const products = await prisma.product.findMany({
        include: { category: true }
    })
    console.log('Total Products:', products.length)
    products.forEach(p => {
        console.log(`- [${p.code}] ${p.name} ($${p.price}) [Active: ${p.isActive}]`)
    })
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
