import { NextResponse } from 'next/server';
import { ProductService } from '@/services/ProductService';
import { CategoryService } from '@/services/CategoryService';
import { MovementType } from '@/generated/client';

export async function POST(request: Request) {
    try {
        const change = await request.json();
        const { entityType, entityId, action, data } = change;
        const userId = 'offline-sync-user';

        if (entityType === 'Product') {
            if (action === 'UPDATE' && data.stockAdjustment !== undefined) {
                // Enforce Server Wins via optimistic locking
                await ProductService.updateStock(
                    entityId,
                    data.stockAdjustment,
                    MovementType.ADJUSTMENT,
                    'Sync Offline',
                    userId,
                    data.version
                );
            }

            // Add other product actions here
        }

        if (entityType === 'Category') {
            // Handle category sync
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        if (error.message.includes('Concurrency conflict') || error.message.includes('version')) {
            return NextResponse.json({
                error: 'Conflict: Server version is different.',
                conflict: true
            }, { status: 409 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
