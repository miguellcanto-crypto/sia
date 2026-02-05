import { PrismaClient, Prisma, MovementType } from '../src/generated/client/client'
import * as dotenv from 'dotenv'
import bcrypt from 'bcryptjs'
dotenv.config()

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DIRECT_URL,
        },
    },
})

async function main() {
    console.log('--- STARTING FULL SEED ---')
    try {
        // Cleanup
        await prisma.saleItem.deleteMany()
        await prisma.salePromotion.deleteMany()
        await prisma.sale.deleteMany()
        await prisma.promotionProduct.deleteMany()
        await prisma.promotionCategory.deleteMany()
        await prisma.promotion.deleteMany()
        await prisma.stockMovement.deleteMany()
        await prisma.priceHistory.deleteMany()
        await prisma.auditLog.deleteMany()
        await prisma.errorLog.deleteMany()
        await prisma.product.deleteMany()
        await prisma.category.deleteMany()
        await prisma.user.deleteMany()
        await prisma.role.deleteMany()
        await prisma.customer.deleteMany()

        // 1. Role
        const adminRole = await prisma.role.create({
            data: {
                name: 'ADMIN',
                description: 'Administrador',
                permissions: ['CREATE_SALE', 'VIEW_SALES', 'MANAGE_SETTINGS', 'MANAGE_PRODUCTS']
            }
        })

        // 2. User
        const hashedPassword = await bcrypt.hash('admin123', 10)
        const adminUser = await prisma.user.create({
            data: {
                name: 'Admin',
                email: 'admin@marisqueria.com',
                passwordHash: hashedPassword,
                roleId: adminRole.id,
                status: 'ACTIVE'
            }
        })

        // 3. Categories
        const catPescados = await prisma.category.create({
            data: { name: 'Pescados Frescos' }
        })
        const catMariscos = await prisma.category.create({
            data: { name: 'Mariscos' }
        })

        // 4. Products
        const products = [
            {
                code: 'HU-001',
                name: 'Huachinango Entero',
                price: new Prisma.Decimal(280.0),
                cost: new Prisma.Decimal(200.0),
                stock: new Prisma.Decimal(15.5),
                unit: 'kg',
                categoryId: catPescados.id,
                isFresh: true,
                isSeafood: false
            },
            {
                code: 'CAM-01',
                name: 'Camarón Pacotilla',
                price: new Prisma.Decimal(350.0),
                cost: new Prisma.Decimal(240.0),
                stock: new Prisma.Decimal(10.0),
                unit: 'kg',
                categoryId: catMariscos.id,
                isFresh: true,
                isSeafood: true
            },
            {
                code: 'MOJ-01',
                name: 'Mojarra Tilapia',
                price: new Prisma.Decimal(115.0),
                cost: new Prisma.Decimal(80.0),
                stock: new Prisma.Decimal(25.0),
                unit: 'kg',
                categoryId: catPescados.id,
                isFresh: true,
                isSeafood: false
            }
        ]

        for (const p of products) {
            const product = await prisma.product.create({ data: p })
            // Initial movement
            await prisma.stockMovement.create({
                data: {
                    productId: product.id,
                    type: 'INITIAL',
                    quantity: p.stock,
                    previousStock: new Prisma.Decimal(0),
                    newStock: p.stock,
                    userId: adminUser.id,
                    reason: 'Carga inicial'
                }
            })
        }

        // 5. Cash Registers
        await prisma.cashRegister.createMany({
            data: [
                { name: 'Caja Principal', code: 'CAJA-01', location: 'Mostrador' },
                { name: 'Caja Secundaria', code: 'CAJA-02', location: 'Entrada' }
            ]
        })

        console.log('--- SEED COMPLETED SUCCESSFULLY ---')
    } catch (e) {
        console.error('--- SEED FAILED ---')
        console.error(e)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

main()
