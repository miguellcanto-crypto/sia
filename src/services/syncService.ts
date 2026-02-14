import Dexie, { Table } from 'dexie';

export interface LocalChange {
    id?: number;
    entityType: 'Product' | 'Category';
    entityId: string;
    action: 'CREATE' | 'UPDATE' | 'DELETE';
    data: any;
    timestamp: number;
}

export class OfflineDb extends Dexie {
    changes!: Table<LocalChange>;

    constructor() {
        super('SiaOfflineDb');
        this.version(1).stores({
            changes: '++id, entityType, entityId, timestamp'
        });
    }
}

export const db = new OfflineDb();

export class SyncService {
    static async queueChange(change: Omit<LocalChange, 'timestamp'>) {
        await db.changes.add({
            ...change,
            timestamp: Date.now()
        });
        // Trigger sync if online
        if (navigator.onLine) {
            this.sync();
        }
    }

    static async sync() {
        const changes = await db.changes.toArray();
        if (changes.length === 0) return;

        console.log(`Syncing ${changes.length} changes...`);

        for (const change of changes) {
            try {
                const res = await fetch(`/api/sync`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(change)
                });

                if (res.ok) {
                    // Success OR Conflict (Server Wins)
                    // If server wins, we just delete our local intent because we are out of sync anyway
                    await db.changes.delete(change.id!);
                } else {
                    const error = await res.json();
                    if (error.conflict) {
                        console.warn('Conflict detected: Server Wins. Local change discarded.');
                        await db.changes.delete(change.id!);
                    }
                }
            } catch (e) {
                console.error('Sync failed for item', change.id, e);
                break; // Stop and retry later
            }
        }
    }
}
