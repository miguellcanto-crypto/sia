import { db, Sale } from '@/db/dexie';

export class SyncService {
    private isSyncing = false;

    async sync() {
        if (this.isSyncing || !navigator.onLine) return;

        try {
            this.isSyncing = true;
            const pendingSales = await db.sales.where('status').equals('PENDING_SYNC').toArray();

            if (pendingSales.length === 0) return;

            console.log(`Syncing ${pendingSales.length} sales...`);

            for (const sale of pendingSales) {
                try {
                    const response = await fetch('/api/sales', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(sale),
                    });

                    if (response.ok) {
                        // Update local status to COMPLETED or delete if we don't need history locally
                        await db.sales.update(sale.id!, { status: 'COMPLETED' });
                    } else {
                        console.error('Failed to sync sale', sale.id);
                    }
                } catch (error) {
                    console.error('Error syncing sale', sale.id, error);
                }
            }
        } catch (error) {
            console.error('Sync failed', error);
        } finally {
            this.isSyncing = false;
        }
    }

    startAutoSync(intervalMs = 10000) {
        // Initial sync
        this.sync();

        // Listener for online event
        window.addEventListener('online', () => this.sync());

        // Periodic sync
        setInterval(() => {
            this.sync();
        }, intervalMs);
    }
}

export const syncService = new SyncService();
