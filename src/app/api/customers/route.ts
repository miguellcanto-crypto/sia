import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { customerSchema } from '@/lib/validations/customer';

export async function GET(request: Request) {
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

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
        const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '50')));
        const skip = (page - 1) * limit;

        const whereClause: any = {
            isActive: true,
            ...(search ? {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { code: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                    { phone: { contains: search, mode: 'insensitive' } },
                ]
            } : {})
        };

        const [customers, total] = await Promise.all([
            prisma.customer.findMany({
                where: whereClause,
                skip,
                take: limit,
                orderBy: { name: 'asc' },
            }),
            prisma.customer.count({ where: whereClause })
        ]);

        return NextResponse.json({
            customers,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Error fetching customers:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor al obtener clientes' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const userPermissions = (session.user as any).permissions || [];
        const userRole = (session.user as any).role;

        if (userRole !== 'ADMIN' && userRole !== 'MANAGER' && !userPermissions.includes('CREATE_CUSTOMER')) {
            return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
        }

        const body = await request.json();
        
        // Validación con Zod
        const validationResult = customerSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                { error: 'Datos de cliente inválidos', details: validationResult.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const data = validationResult.data;

        // Comprobar duplicados de email
        if (data.email) {
            const existingEmail = await prisma.customer.findUnique({
                where: { email: data.email }
            });
            if (existingEmail) {
                return NextResponse.json({ error: 'El correo electrónico ya está registrado en otro cliente' }, { status: 409 });
            }
        }

        // Comprobar duplicados de RFC (taxId)
        if (data.taxId) {
            const existingTaxId = await prisma.customer.findUnique({
                where: { taxId: data.taxId }
            });
            if (existingTaxId) {
                return NextResponse.json({ error: 'El RFC ya está registrado en otro cliente' }, { status: 409 });
            }
        }

        let customerCode = data.code;
        if (!customerCode) {
            // Generación automática de código seguro si no se proporcionó uno
            const count = await prisma.customer.count();
            customerCode = `CLI-${String(count + 1).padStart(5, '0')}`;
            
            // Asegurarnos de que el código autogenerado no exista
            let codeExists = true;
            let attempt = count + 1;
            while(codeExists) {
                const check = await prisma.customer.findUnique({ where: { code: customerCode } });
                if(check) {
                    attempt++;
                    customerCode = `CLI-${String(attempt).padStart(5, '0')}`;
                } else {
                    codeExists = false;
                }
            }
        } else {
            // Verificar si el código provisto manualmente ya existe
            const existingCode = await prisma.customer.findUnique({
                where: { code: customerCode }
            });
            if (existingCode) {
                return NextResponse.json({ error: 'El código de cliente ya está en uso' }, { status: 409 });
            }
        }

        // Crear al nuevo cliente
        const newCustomer = await prisma.customer.create({
            data: {
                name: data.name,
                code: customerCode,
                email: data.email || null,
                phone: data.phone || null,
                company: data.company || null,
                taxId: data.taxId || null,
                notes: data.notes || null,
                creditLimit: data.creditLimit || 0,
                tier: 'BRONZE', // Tier inicial por defecto
                points: 0,
                balance: 0,
            }
        });

        return NextResponse.json(newCustomer, { status: 201 });

    } catch (error) {
        console.error('Error creating customer:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor al crear cliente' },
            { status: 500 }
        );
    }
}
