'use client';

import React from 'react';
import Link from 'next/link';
import { Bell, X, CheckCheck } from 'lucide-react';
import { useNotifications } from '@/providers/NotificationProvider';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export function NotificationBell() {
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger className="relative outline-none">
                <div className="relative p-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer group">
                    <Bell className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                    {unreadCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 bg-red-500 border-2 border-slate-900 text-[10px] pointer-events-none">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                    )}
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                side="right"
                align="start"
                sideOffset={12}
                className="w-80 p-0 shadow-2xl border-slate-200/60 dark:border-slate-800/60 overflow-hidden backdrop-blur-md bg-white/95 dark:bg-slate-900/95 z-[100]"
            >
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                    <div>
                        <h3 className="font-bold text-slate-900 dark:text-slate-100">Notificaciones</h3>
                        <p className="text-xs text-slate-500">{unreadCount} pendientes</p>
                    </div>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                markAllAsRead();
                            }}
                            className="text-[10px] h-7 px-2 hover:text-blue-600 font-semibold"
                        >
                            <CheckCheck className="w-3 h-3 mr-1" />
                            Marcar todo
                        </Button>
                    )}
                </div>

                <div className="h-[350px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                    <div className="p-2 space-y-1">
                        {notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                                <Bell className="w-8 h-8 mb-2 opacity-20" />
                                <p className="text-sm font-medium">Sin nuevas alertas</p>
                            </div>
                        ) : (
                            notifications.map((n) => (
                                <div
                                    key={n.id}
                                    className={cn(
                                        "p-3 rounded-lg flex gap-3 group transition-all duration-200 cursor-default",
                                        "hover:bg-slate-50 dark:hover:bg-slate-800",
                                        "border border-transparent hover:border-slate-100 dark:hover:border-slate-700"
                                    )}
                                >
                                    <div className={cn(
                                        "w-2 h-2 rounded-full mt-1.5 shrink-0",
                                        n.type === 'WARNING' ? "bg-orange-500" :
                                            n.type === 'ERROR' ? "bg-red-500" : "bg-blue-500"
                                    )} />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-1">
                                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate leading-none mb-1">
                                                {n.title}
                                            </p>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-200 dark:hover:bg-slate-700"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    markAsRead(n.id);
                                                }}
                                            >
                                                <X className="w-3 h-3 text-slate-500" />
                                            </Button>
                                        </div>
                                        <p className="text-xs text-slate-500 line-clamp-2 mb-2 leading-relaxed">
                                            {n.message}
                                        </p>
                                        <p className="text-[10px] text-slate-400 font-medium">
                                            {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: es })}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="p-3 border-t border-slate-100 dark:border-slate-800 text-center bg-slate-50/50 dark:bg-slate-800/50">
                    <Link href="/notifications">
                        <Button variant="ghost" size="sm" className="w-full text-xs font-semibold hover:text-blue-600 transition-colors">
                            Ver historial completo
                        </Button>
                    </Link>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
