import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { ConfigService } from '@/services/ConfigService';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const userPermissions = (session?.user as any)?.permissions || [];

        // Check permissions
        if (!Array.isArray(userPermissions) || !userPermissions.includes('MANAGE_SETTINGS')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category') || undefined;

        const configs = await ConfigService.getAll(category);

        // Group by category for frontend convenience
        const grouped = configs.reduce((acc, current) => {
            const cat = current.category || 'OTHER';
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(current);
            return acc;
        }, {} as Record<string, typeof configs>);

        return NextResponse.json({ configs: grouped });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const userPermissions = (session?.user as any)?.permissions || [];
        const userId = (session?.user as any)?.id;

        // Check permissions
        if (!Array.isArray(userPermissions) || !userPermissions.includes('MANAGE_SETTINGS')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { configs } = body;

        if (!Array.isArray(configs)) {
            return NextResponse.json({ error: 'configs must be an array' }, { status: 400 });
        }

        const ipAddress = request.headers.get('x-forwarded-for') || '127.0.0.1';
        const userAgent = request.headers.get('user-agent') || 'Unknown';
        
        // Pass to service. Since it validates types, it might throw an Error.
        // We catch it to return 422
        try {
            const result = await ConfigService.batchUpdate(
                configs,
                userId,
                undefined, // no direct access to session token ID here easily unless from cookie
                ipAddress,
                userAgent
            );
            return NextResponse.json(result);
        } catch (validationError: any) {
            // Validation errors thrown manually in ConfigService
            if (validationError.message.includes('Invalid value')) {
                return NextResponse.json({ error: validationError.message }, { status: 422 });
            }
            throw validationError; // Will be caught by outer catch
        }

    } catch (error: any) {
        console.error('Batch Update Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
