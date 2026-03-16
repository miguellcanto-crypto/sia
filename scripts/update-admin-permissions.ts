import { PrismaClient, Permission } from '../src/generated/client'
import * as dotenv from 'dotenv'
dotenv.config()

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DIRECT_URL,
        },
    },
})

async function main() {
    console.log('--- UPDATING ADMIN PERMISSIONS ---')
    try {
        const fullPermissions: Permission[] = [
            'CREATE_SALE', 'VIEW_SALES', 'CANCEL_SALE', 'REFUND_SALE',
            'CREATE_PRODUCT', 'EDIT_PRODUCT', 'DELETE_PRODUCT', 'VIEW_PRODUCT',
            'ADJUST_STOCK', 'EDIT_PRICE', 'MANAGE_PRODUCTS', 'MANAGE_CATEGORIES',
            'CREATE_USER', 'EDIT_USER', 'DELETE_USER', 'VIEW_USERS',
            'CREATE_CUSTOMER', 'EDIT_CUSTOMER', 'DELETE_CUSTOMER', 'VIEW_CUSTOMERS',
            'CREATE_PROMOTION', 'EDIT_PROMOTION', 'DELETE_PROMOTION',
            'VIEW_AUDIT_LOG', 'VIEW_ERROR_LOG', 'VIEW_REPORTS', 'EXPORT_REPORTS',
            'MANAGE_SETTINGS'
        ]

        const updatedRole = await prisma.role.update({
            where: { name: 'ADMIN' },
            data: {
                permissions: fullPermissions
            }
        })

        console.log('ADMIN role updated successfully with all permissions.')
        console.log('Updated role:', updatedRole)
    } catch (e) {
        console.error('--- UPDATE FAILED ---')
        console.error(e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
