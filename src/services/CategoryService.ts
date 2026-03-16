import { prisma } from '@/lib/prisma';
import { AuditService } from './AuditService';

export class CategoryService {
    private static MAX_DEPTH = 4;

    static async create(data: { name: string; description?: string; parentId?: string; order?: number }, userId: string) {
        // Validate depth if parentId is provided
        if (data.parentId) {
            const depth = await this.getDepth(data.parentId);
            if (depth >= this.MAX_DEPTH) {
                throw new Error(`Exceeded maximum category depth of ${this.MAX_DEPTH}`);
            }
        }

        const category = await prisma.category.create({
            data,
        });

        this.treeCache = null; // Invalidate


        await AuditService.log('CREATE', 'Category', category.id, {
            newValues: category,
            entityName: category.name,
            metadata: { userId },
        });

        return category;
    }

    static async delete(id: string, userId: string) {
        // Check for products
        const productCount = await prisma.product.count({
            where: { categoryId: id },
        });

        if (productCount > 0) {
            throw new Error('Cannot delete category with associated products. Reassign them first.');
        }

        // Check for subcategories
        const childrenCount = await prisma.category.count({
            where: { parentId: id },
        });

        if (childrenCount > 0) {
            throw new Error('Cannot delete category with subcategories.');
        }

        const category = await prisma.category.delete({
            where: { id },
        });

        await AuditService.log('DELETE', 'Category', id, {
            oldValues: category,
            entityName: category.name,
            metadata: { userId },
        });

        return category;
    }

    private static async getDepth(id: string): Promise<number> {
        let currentDepth = 1;
        let currentId: string | null = id;

        while (currentId) {
            const parent: any = await prisma.category.findUnique({
                where: { id: currentId },
                select: { parentId: true },
            });


            if (!parent || !parent.parentId) break;
            currentId = parent.parentId;
            currentDepth++;

            if (currentDepth > 10) break; // Circuit breaker
        }

        return currentDepth;
    }

    private static treeCache: { data: any[], timestamp: number } | null = null;
    private static CACHE_TTL = 5 * 60 * 1000;

    static async getTree() {
        if (this.treeCache && (Date.now() - this.treeCache.timestamp < this.CACHE_TTL)) {
            return this.treeCache.data;
        }

        const categories = await prisma.category.findMany({
            include: {
                _count: {
                    select: { products: true }
                }
            },
            orderBy: { order: 'asc' }
        });

        const buildTree = (parentId: string | null = null): any[] => {
            return categories
                .filter(c => c.parentId === parentId)
                .map(c => ({
                    ...c,
                    children: buildTree(c.id)
                }));
        };

        const tree = buildTree();
        this.treeCache = { data: tree, timestamp: Date.now() };
        return tree;
    }

    static async getAll() {
        return this.getTree();
    }

}
