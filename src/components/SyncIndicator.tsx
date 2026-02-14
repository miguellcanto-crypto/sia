'use client';

import { useEffect, useState } from 'react';
import { Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { db } from '@/services/SyncService';
import { useLiveQuery } from 'dexie-react-hooks';
import { cn } from '@/lib/utils';

export function SyncIndicator() {
    const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
    const pendingChanges = useLiveQuery(() => db.changes.count()) || 0;

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return (
        <div className={cn(
            "fixed bottom-6 right-6 flex items-center gap-2 px-4 py-2 rounded-full shadow-lg backdrop-blur-md transition-all duration-300 border",
            isOnline
                ? "bg-emerald-50/80 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-400"
                : "bg-orange-50/80 border-orange-200 text-orange-700 dark:bg-orange-950/40 dark:border-orange-800 dark:text-orange-400"
        )}>
            {isOnline ? (
                pendingChanges > 0 ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                    <Cloud className="w-4 h-4" />
                )
            ) : (
                <CloudOff className="w-4 h-4" />
            )}

            <span className="text-xs font-bold tracking-tight">
                {isOnline
                    ? (pendingChanges > 0 ? `Sincronizando ${pendingChanges}...` : 'Conectado')
                    : 'Modo Offline'}
            </span>
        </div>
    );
}
