import { NextResponse } from 'next/server';
import { ProductService } from '@/services/ProductService';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { id } = await params;
        const body = await request.json();
        const userId = (session.user as any).id;

        const product = await ProductService.updateStock(
            id,
            body.adjustment,
            body.type,
            body.reason,
            userId,
            body.version
        );

        return NextResponse.json(product);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
