import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { ConfigService } from '@/services/ConfigService';

export async function GET(request: NextRequest, { params }: { params: Promise<{ key: string }> }) {
    try {
        const { key } = await params;
        const session = await getServerSession(authOptions);
        const userPermissions = (session?.user as any)?.permissions || [];
        const userRole = (session?.user as any)?.role;

        // Strict protection as requested: Proteger ambos endpoints con MANAGE_SETTINGS
        if (!Array.isArray(userPermissions) || !userPermissions.includes('MANAGE_SETTINGS')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const value = await ConfigService.getByKey(key);

        if (value === null) {
            return NextResponse.json({ error: 'Not Found' }, { status: 404 });
        }

        return NextResponse.json({ key, value });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
