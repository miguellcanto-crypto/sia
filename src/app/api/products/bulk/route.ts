import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuditService } from '@/services/AuditService';

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { ids, data } = body;
        const userId = 'system-admin';

        if (!ids || !Array.isArray(ids)) {
            return NextResponse.json({ error: 'Invalid IDs' }, { status: 400 });
        }

        const result = await prisma.$transaction(
            ids.map(id =>
                prisma.product.update({
                    where: { id },
                    data: {
                        ...data,
                        version: { increment: 1 }
                    }
                })
            )
        );

        // Audit for each
        await Promise.all(ids.map(id =>
            AuditService.log('UPDATE', 'Product', id, {
                newValues: data,
                metadata: { userId }
            })
        ));

        return NextResponse.json({ success: true, count: result.length });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
