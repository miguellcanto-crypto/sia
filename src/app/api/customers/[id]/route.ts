import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { customerSchema } from '@/lib/validations/customer';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const userPermissions = (session.user as any).permissions || [];
        const userRole = (session.user as any).role;

        if (userRole !== 'ADMIN' && userRole !== 'MANAGER' && !userPermissions.includes('VIEW_CUSTOMERS')) {
            return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
        }

        const customer = await prisma.customer.findUnique({
            where: { id: params.id },
            include: {
                pointHistory: {
                    orderBy: { createdAt: 'desc' },
                    take: 5, // Últimos 5 movimientos de puntos
                    include: { user: { select: { name: true } } }
                }
            }
        });

        if (!customer) {
            return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
        }

        return NextResponse.json(customer);

    } catch (error) {
        console.error('Error fetching customer details:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor al obtener detalles del cliente' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const userPermissions = (session.user as any).permissions || [];
        const userRole = (session.user as any).role;

        if (userRole !== 'ADMIN' && userRole !== 'MANAGER' && !userPermissions.includes('EDIT_CUSTOMER')) {
            return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
        }

        const body = await request.json();
        const validationResult = customerSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                { error: 'Datos de cliente inválidos', details: validationResult.error.errors },
                { status: 400 }
            );
        }

        const data = validationResult.data;

        // Comprobar que no estemos duplicando email o RFC con otro cliente distino a este
        if (data.email) {
            const existingEmail = await prisma.customer.findFirst({
                where: { email: data.email, NOT: { id: params.id } }
            });
            if (existingEmail) {
                return NextResponse.json({ error: 'El correo electrónico ya está registrado en otro cliente' }, { status: 409 });
            }
        }

        if (data.taxId) {
            const existingTaxId = await prisma.customer.findFirst({
                where: { taxId: data.taxId, NOT: { id: params.id } }
            });
            if (existingTaxId) {
                return NextResponse.json({ error: 'El RFC ya está registrado en otro cliente' }, { status: 409 });
            }
        }
        
        // Comprobar el código si fue provisto
        if (data.code) {
             const existingCode = await prisma.customer.findFirst({
                where: { code: data.code, NOT: { id: params.id } }
            });
            if (existingCode) {
                return NextResponse.json({ error: 'Ese código de cliente ya está registrado en otro cliente' }, { status: 409 });
            }
        }

        const updatedCustomer = await prisma.customer.update({
            where: { id: params.id },
            data: {
                name: data.name,
                code: data.code || undefined,
                email: data.email || null,
                phone: data.phone || null,
                company: data.company || null,
                taxId: data.taxId || null,
                notes: data.notes || null,
                creditLimit: data.creditLimit,
            }
        });

        return NextResponse.json(updatedCustomer);

    } catch (error) {
        console.error('Error updating customer:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor al actualizar cliente' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const userPermissions = (session.user as any).permissions || [];
        const userRole = (session.user as any).role;

        if (userRole !== 'ADMIN' && userRole !== 'MANAGER' && !userPermissions.includes('DELETE_CUSTOMER')) {
            return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
        }

        const customer = await prisma.customer.findUnique({
            where: { id: params.id },
            include: {
                sales: { take: 1 },
            }
        });

        if (!customer) {
            return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
        }

        // Bloquear desactivación parcial si el cliente tiene saldo pendiente
        // Convertimos de Decimal de Prisma a Number de Javascript de forma segura
        if (Number(customer.balance || 0) > 0) {
            return NextResponse.json(
                { error: 'No se puede eliminar un cliente con saldo pendiente de crédito. Cancele el saldo primero.' },
                { status: 409 }
            );
        }

        // Soft delete (desactivación): Oculta el cliente pero preserva la integridad en ventas viejas
        await prisma.customer.update({
            where: { id: params.id },
            data: { isActive: false }
        });

        return NextResponse.json({ message: 'Cliente deshabilitado exitosamente' });

    } catch (error) {
        console.error('Error deleting customer:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor al desactivar cliente' },
            { status: 500 }
        );
    }
}
