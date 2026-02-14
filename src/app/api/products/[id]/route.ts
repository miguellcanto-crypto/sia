import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AuditService } from '@/services/AuditService';
import { NotificationService } from '@/services/NotificationService';
import { NotificationType } from '@/generated/client';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const { id } = await params;

        const product = await prisma.product.update({
            where: { id },
            data: {
                ...body,
                version: { increment: 1 }
            }
        });

        await AuditService.log('UPDATE', 'Product', id, {
            newValues: product,
            metadata: { userId: (session.user as any).id }
        });

        await NotificationService.notify({
            type: NotificationType.INFO,
            title: 'Producto Actualizado',
            message: `El producto ${product.name} ha sido modificado.`,
            entityType: 'Product',
            entityId: id
        });

        return NextResponse.json(product);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { id } = await params;

        // Hard delete from database
        await prisma.product.delete({
            where: { id }
        });

        await AuditService.log('DELETE', 'Product', id, {
            metadata: {
                userId: (session.user as any).id,
                action: 'HARD_DELETE',
                details: 'Eliminación permanente de la base de datos'
            }
        });

        return NextResponse.json({ success: true, message: 'Producto eliminado permanentemente' });
    } catch (error: any) {
        // Handle common deletion errors (like existing relations)
        if (error.code === 'P2003') {
            return NextResponse.json({
                error: 'No se puede eliminar el producto porque tiene historial de ventas o movimientos. Use "Desactivar" en su lugar.'
            }, { status: 400 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
