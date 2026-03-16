'use client';

import { useState, useEffect } from 'react';
import { useNotifications } from '@/providers/NotificationProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Bell,
    CheckCheck,
    Trash2,
    ChevronLeft,
    Clock,
    ShoppingBag,
    AlertTriangle,
    Info,
    CheckCircle2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';

export default function NotificationsPage() {
    const { unreadCount, markAsRead, markAllAsRead } = useNotifications();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/notifications?all=true');
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
            }
        } catch (error) {
            console.error('Failed to fetch history:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const handleMarkAsRead = async (id: string) => {
        await markAsRead(id);
        // Update local state
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    };

    const handleMarkAllAsRead = async () => {
        await markAllAsRead();
        // Update local state
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'SUCCESS': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
            case 'WARNING': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
            case 'ERROR': return <Trash2 className="w-5 h-5 text-red-500" />;
            default: return <Info className="w-5 h-5 text-blue-500" />;
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/inventory">
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ChevronLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Centro de Notificaciones</h1>
                        <p className="text-slate-500">Administra tus alertas y avisos del sistema.</p>
                    </div>
                </div>
                {unreadCount > 0 && (
                    <Button onClick={handleMarkAllAsRead} variant="outline" className="gap-2">
                        <CheckCheck className="w-4 h-4" />
                        Marcar todo como leído
                    </Button>
                )}
            </div>

            <div className="grid gap-4">
                {notifications.length === 0 ? (
                    <Card className="bg-slate-50/50 dark:bg-slate-900/50 border-dashed border-2">
                        <CardContent className="flex flex-col items-center justify-center py-20 text-slate-400">
                            <Bell className="w-12 h-12 mb-4 opacity-20" />
                            <p className="text-lg font-medium">No tienes notificaciones pendientes</p>
                            <p className="text-sm">¡Todo está al día!</p>
                        </CardContent>
                    </Card>
                ) : (
                    notifications.map((n) => (
                        <Card key={n.id} className={`transition-all hover:shadow-md ${n.isRead ? 'opacity-60' : 'border-l-4 border-l-blue-500'}`}>
                            <CardContent className="p-4 flex gap-4 items-start">
                                <div className="mt-1">
                                    {getTypeIcon(n.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                        <h3 className="font-bold text-slate-900 dark:text-slate-100 truncate">
                                            {n.title}
                                        </h3>
                                        <span className="text-[10px] text-slate-400 flex items-center gap-1 whitespace-nowrap">
                                            <Clock className="w-3 h-3" />
                                            {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: es })}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
                                        {n.message}
                                    </p>
                                    <div className="flex items-center gap-3">
                                        {!n.isRead && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleMarkAsRead(n.id)}
                                                className="h-7 text-[11px] px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                            >
                                                Marcar como leído
                                            </Button>
                                        )}
                                        {n.entityType && (
                                            <Badge variant="secondary" className="text-[10px] gap-1 px-1.5 py-0">
                                                <ShoppingBag className="w-3 h-3" />
                                                {n.entityType}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
