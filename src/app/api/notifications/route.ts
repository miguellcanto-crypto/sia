import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NotificationService } from '@/services/NotificationService';

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const userId = (session.user as any).id;
        console.log('[API/Notifications] Fetching for user:', userId);
        const notifications = await NotificationService.getUnread(userId);
        console.log('[API/Notifications] Found:', notifications.length);
        return NextResponse.json(notifications);
    } catch (error: any) {
        console.error('[API/Notifications] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { id, all } = await request.json();
        const userId = (session.user as any).id;

        if (all) {
            await NotificationService.markAllAsRead(userId);
            return NextResponse.json({ success: true });
        }

        if (id) {
            await NotificationService.markAsRead(id);
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Notification ID or "all" flag required' }, { status: 400 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
