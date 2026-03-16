import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { startOfDay, endOfDay, parseISO, subDays } from 'date-fns';

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
        }

        const userRole = (session.user as any).role;
        const userPermissions = (session.user as any).permissions || [];
        const hasReportAccess = userRole === 'ADMIN' || userRole === 'MANAGER' || userPermissions.includes('VIEW_REPORTS');

        // Solo permitir si tiene permisos de reporte explícitos, para corte de su propia caja hay otro endpoint
        if (!hasReportAccess) {
            return NextResponse.json({ error: 'No autorizado para ver el historial general de caja' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        
        const startDateStr = searchParams.get('startDate');
        const endDateStr = searchParams.get('endDate');

        const endDate = endDateStr ? endOfDay(parseISO(endDateStr)) : endOfDay(new Date());
        const startDate = startDateStr ? startOfDay(parseISO(startDateStr)) : startOfDay(subDays(endDate, 30));

        const dateFilter = {
            openedAt: {
                gte: startDate,
                lte: endDate
            }
        };

        const sessions = await prisma.cashSession.findMany({
            where: dateFilter,
            include: {
                user: { select: { name: true } },
                register: { select: { name: true } },
                _count: {
                    select: { sales: true }
                }
            },
            orderBy: { openedAt: 'desc' }
        });

        const totalSessionsCount = sessions.length;
        let totalExpected = 0;
        let totalClosed = 0;
        let totalDiscrepancy = 0;
        let discrepanciesCount = 0;

        const sessionsList = sessions.map(s => {
            const expected = Number(s.expectedAmount || 0);
            const closed = Number(s.closingAmount || 0);
            const diff = Number(s.difference || 0);

            if (s.status === 'CLOSED' || s.status === 'RECONCILED') {
                totalExpected += expected;
                totalClosed += closed;
                totalDiscrepancy += Math.abs(diff);
                if (Math.abs(diff) > 0.01) discrepanciesCount++;
            }

            return {
                id: s.id,
                openedAt: s.openedAt,
                closedAt: s.closedAt,
                status: s.status,
                cashierName: s.user.name,
                registerName: s.register.name,
                openingAmount: Number(s.openingAmount),
                expectedAmount: expected,
                closingAmount: closed,
                difference: diff,
                salesCount: s._count.sales
            };
        });

        const responseData = {
            overview: {
                totalSessionsCount,
                totalExpected,
                totalClosed,
                totalDiscrepancy,
                averageDiscrepancy: discrepanciesCount > 0 ? (totalDiscrepancy / discrepanciesCount) : 0,
                discrepancieSessionsCount: discrepanciesCount
            },
            sessions: sessionsList
        };

        return NextResponse.json(responseData);

    } catch (error) {
        console.error('[API Reports Cash] Error:', error);
        return NextResponse.json(
            { error: 'Error obteniendo historial general de caja' },
            { status: 500 }
        );
    }
}
