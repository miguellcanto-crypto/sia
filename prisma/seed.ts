import { PrismaClient, Prisma, MovementType } from '../src/generated/client'
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
    console.log('--- STARTING COMPREHENSIVE SEED ---')
    try {
        // 1. Cleanup in correct order
        console.log('Cleaning up database...')
        await prisma.salePromotion.deleteMany()
        await prisma.saleItem.deleteMany()
        await prisma.refundItem.deleteMany()
        await prisma.orderItem.deleteMany()
        await prisma.promotionProduct.deleteMany()
        await prisma.promotionCategory.deleteMany()

        await prisma.saleDiscount.deleteMany()
        await prisma.sale.deleteMany()
        await prisma.refund.deleteMany()
        await prisma.order.deleteMany()
        await prisma.parkedSale.deleteMany()

        await prisma.stockMovement.deleteMany()
        await prisma.priceHistory.deleteMany()
        await prisma.auditLog.deleteMany()
        await prisma.errorLog.deleteMany()
        await prisma.cashMovement.deleteMany()
        await prisma.cashSession.deleteMany()
        await prisma.cashRegister.deleteMany()

        await prisma.product.deleteMany()
        await prisma.promotion.deleteMany()
        await prisma.category.deleteMany()

        await prisma.account.deleteMany()
        await prisma.session.deleteMany()
        await prisma.passwordResetToken.deleteMany()
        await prisma.user.deleteMany()
        await prisma.role.deleteMany()
        await prisma.customer.deleteMany()

        // 2. Roles
        console.log('Creating Roles...')
        const adminRole = await prisma.role.create({
            data: {
                name: 'ADMIN',
                description: 'Administrador total',
                permissions: [
                    'CREATE_SALE', 'VIEW_SALES', 'CANCEL_SALE', 'REFUND_SALE',
                    'CREATE_PRODUCT', 'EDIT_PRODUCT', 'DELETE_PRODUCT', 'VIEW_PRODUCT',
                    'ADJUST_STOCK', 'EDIT_PRICE', 'MANAGE_PRODUCTS', 'MANAGE_CATEGORIES',
                    'CREATE_USER', 'EDIT_USER', 'DELETE_USER', 'VIEW_USERS',
                    'CREATE_CUSTOMER', 'EDIT_CUSTOMER', 'DELETE_CUSTOMER', 'VIEW_CUSTOMERS',
                    'CREATE_PROMOTION', 'EDIT_PROMOTION', 'DELETE_PROMOTION',
                    'VIEW_AUDIT_LOG', 'VIEW_ERROR_LOG', 'VIEW_REPORTS', 'EXPORT_REPORTS',
                    'MANAGE_SETTINGS'
                ]
            }
        })

        const cashierRole = await prisma.role.create({
            data: {
                name: 'CASHIER',
                description: 'Personal de ventas',
                permissions: ['CREATE_SALE', 'VIEW_SALES', 'VIEW_PRODUCT']
            }
        })

        // 3. User
        console.log('Creating Admin User...')
        const hashedPassword = await bcrypt.hash('admin123', 10)
        const adminUser = await prisma.user.create({
            data: {
                name: 'Admin SIA',
                email: 'admin@marisqueria.com',
                passwordHash: hashedPassword,
                roleId: adminRole.id
            }
        })

        // 4. Cash Registers
        console.log('Creating Cash Registers...')
        await prisma.cashRegister.createMany({
            data: [
                { name: 'Caja Principal', code: 'CAJA-01', isActive: true },
                { name: 'Caja Secundaria', code: 'CAJA-02', isActive: true },
            ]
        })

        // 5. Categories (Hierarchy)
        console.log('Creating CategoriesTree...')
        const catPescados = await prisma.category.create({
            data: { name: 'Pescados Frescos', order: 1 }
        })

        const catMariscos = await prisma.category.create({
            data: { name: 'Mariscos', order: 2 }
        })

        const subcatEnteros = await prisma.category.create({
            data: { name: 'Pescados Enteros', parentId: catPescados.id, order: 1 }
        })

        const subcatFiletes = await prisma.category.create({
            data: { name: 'Filetes y Lonjas', parentId: catPescados.id, order: 2 }
        })

        // 5. Products
        console.log('Creating Products...')
        const sampleProducts = [
            {
                code: 'PES-HUA-E',
                name: 'Huachinango Entero',
                price: new Prisma.Decimal(285.0),
                cost: new Prisma.Decimal(190.0),
                stock: new Prisma.Decimal(25.500),
                criticalStock: new Prisma.Decimal(5.0),
                unit: 'kg',
                categoryId: subcatEnteros.id,
                isFresh: true,
                isSeafood: false,
                isWeighable: true,
                version: 1
            },
            {
                code: 'PES-TIL-F',
                name: 'Filete de Tilapia',
                price: new Prisma.Decimal(145.0),
                cost: new Prisma.Decimal(95.0),
                stock: new Prisma.Decimal(12.000),
                criticalStock: new Prisma.Decimal(3.0),
                unit: 'kg',
                categoryId: subcatFiletes.id,
                isFresh: true,
                isSeafood: false,
                isWeighable: true,
                version: 1
            },
            {
                code: 'MAR-CAM-P',
                name: 'Camarón Pacotilla',
                price: new Prisma.Decimal(360.0),
                cost: new Prisma.Decimal(240.0),
                stock: new Prisma.Decimal(1.500), // Below critical
                criticalStock: new Prisma.Decimal(2.0),
                unit: 'kg',
                categoryId: catMariscos.id,
                isFresh: true,
                isSeafood: true,
                isWeighable: true,
                version: 1
            }
        ]

        for (const pData of sampleProducts) {
            const p = await prisma.product.create({ data: pData })

            // Initial Stock Movement
            await prisma.stockMovement.create({
                data: {
                    productId: p.id,
                    type: MovementType.INITIAL,
                    quantity: pData.stock,
                    previousStock: new Prisma.Decimal(0),
                    newStock: pData.stock,
                    reason: 'Carga inicial de sistema',
                    userId: adminUser.id
                }
            })
        }

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
