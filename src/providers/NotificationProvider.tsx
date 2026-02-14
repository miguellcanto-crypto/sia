'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface Notification {
    id: string;
    type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
    entityType?: string;
    entityId?: string;
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    fetchNotifications: () => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const { data: session } = useSession();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [lastNotifiedId, setLastNotifiedId] = useState<string | null>(null);
    const [currentToast, setCurrentToast] = useState<Notification | null>(null);

    const fetchNotifications = useCallback(async () => {
        if (!session?.user) return;
        try {
            const res = await fetch('/api/notifications');
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);

                // Show toast for new notifications
                if (data.length > 0) {
                    const latest = data[0];
                    if (latest.id !== lastNotifiedId) {
                        setCurrentToast(latest);
                        setLastNotifiedId(latest.id);
                        // Auto-hide toast after 5 seconds
                        setTimeout(() => setCurrentToast(null), 5000);
                    }
                }

                setUnreadCount(data.length);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    }, [session, lastNotifiedId]);

    const markAsRead = async (id: string) => {
        try {
            const res = await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });
            if (res.ok) {
                setNotifications(prev => prev.filter(n => n.id !== id));
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const res = await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ all: true }),
            });
            if (res.ok) {
                setNotifications([]);
                setUnreadCount(0);
            }
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    useEffect(() => {
        if (session?.user) {
            fetchNotifications();
            // Poll for notifications every 30 seconds (faster for better feel)
            const interval = setInterval(fetchNotifications, 30000);
            return () => clearInterval(interval);
        }
    }, [session, fetchNotifications]);

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            fetchNotifications,
            markAsRead,
            markAllAsRead
        }}>
            {children}

            {/* Simple Toast UI */}
            {currentToast && (
                <div className="fixed bottom-4 right-4 z-[200] max-w-sm animate-in slide-in-from-right-full duration-300">
                    <div className={`p-4 rounded-xl shadow-2xl border flex gap-3 backdrop-blur-md ${currentToast.type === 'SUCCESS' ? 'bg-green-50/90 border-green-200 text-green-900' :
                            currentToast.type === 'WARNING' ? 'bg-orange-50/90 border-orange-200 text-orange-900' :
                                currentToast.type === 'ERROR' ? 'bg-red-50/90 border-red-200 text-red-900' :
                                    'bg-blue-50/90 border-blue-200 text-blue-900'
                        }`}>
                        <div className="flex-1">
                            <h4 className="font-bold text-sm mb-1">{currentToast.title}</h4>
                            <p className="text-xs opacity-90 leading-relaxed">{currentToast.message}</p>
                        </div>
                        <button
                            onClick={() => setCurrentToast(null)}
                            className="text-current opacity-50 hover:opacity-100 transition-opacity"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
}
