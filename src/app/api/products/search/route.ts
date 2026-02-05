import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
        return NextResponse.json([]);
    }

    // Limpiar query de signos especiales redundantes para búsqueda flexible
    const sanitizedQuery = query
        .trim()
        .replace(/[^\w\sáéíóúüñÁÉÍÓÚÜÑ]/gi, '') // Elimina signos especiales excepto letras, números y tildes
        .split(/\s+/) // Separa por espacios
        .filter(word => word.length > 0)
        .join(' ');

    if (!sanitizedQuery) {
        return NextResponse.json([]);
    }

    try {
        // Intentamos usar unaccent para búsqueda insensible a tildes (PostgreSQL)
        // Usamos alias explícitos con comillas para preservar camelCase en raw query
        const products = await prisma.$queryRaw`
            SELECT 
                p.*, 
                p."isWeighable" as "isWeighable",
                p."pricePerUnit" as "pricePerUnit",
                p."tareWeight" as "tareWeight",
                p."isFresh" as "isFresh",
                p."isSeafood" as "isSeafood",
                c.name as "categoryName"
            FROM "Product" p
            LEFT JOIN "Category" c ON p."categoryId" = c.id
            WHERE (
                unaccent(p.name) ILIKE unaccent(${`%${sanitizedQuery}%`}) OR
                p.code ILIKE ${`%${sanitizedQuery}%`} OR
                unaccent(c.name) ILIKE unaccent(${`%${sanitizedQuery}%`})
            ) AND p."isActive" = true
            LIMIT 20
        `;

        return NextResponse.json(products);
    } catch (error) {
        console.error('Unaccent search failed, falling back to standard search:', error);
        // Fallback a Prisma estándar si unaccent no está disponible
        const products = await prisma.product.findMany({
            where: {
                OR: [
                    { name: { contains: sanitizedQuery, mode: 'insensitive' } },
                    { code: { contains: sanitizedQuery, mode: 'insensitive' } },
                    { category: { name: { contains: sanitizedQuery, mode: 'insensitive' } } }
                ],
                isActive: true
            },
            include: {
                category: true
            },
            take: 20
        });

        return NextResponse.json(products);
    }
}
