import { NextResponse } from 'next/server';
import { ProductService } from '@/services/ProductService';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const skip = parseInt(searchParams.get('skip') || '0');
    const take = parseInt(searchParams.get('take') || '20');
    const catId = searchParams.get('categoryId');

    const showAll = searchParams.get('all') === 'true';

    try {
        const where: any = catId ? { categoryId: catId } : {};
        if (!showAll) {
            where.isActive = true;
        }

        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                skip,
                take,
                orderBy: { name: 'asc' },
                include: { category: true }
            }),
            prisma.product.count({ where })
        ]);

        return NextResponse.json({ products, total });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const userId = (session.user as any).id;

        const product = await ProductService.create(body, userId);
        return NextResponse.json(product, { status: 201 });
    } catch (error: any) {
        console.error('[PRODUCTS_API_ERROR] Error creating product:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
