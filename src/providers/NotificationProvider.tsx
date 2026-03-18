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
    const [toasts, setToasts] = useState<Notification[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const fetchNotifications = useCallback(async () => {
        if (!session?.user) return;
        try {
            const res = await fetch('/api/notifications?t=' + new Date().getTime(), {
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                }
            });
            if (res.ok) {
                const data: Notification[] = await res.json();
                setNotifications(data);

                // Show toasts for new notifications ONLY if they are recent
                if (data.length > 0) {
                    const now = Date.now();
                    const newToasts: Notification[] = [];

                    // Identify which notifications are NEW and RECENT
                    for (const n of data) {
                        if (n.id === lastNotifiedId) break; // Reached already seen notifications

                        const createdAt = new Date(n.createdAt).getTime();
                        if ((now - createdAt) < 60000) {
                            newToasts.push(n);
                        }
                    }

                    if (newToasts.length > 0) {
                        setToasts(prev => {
                            const combined = [...newToasts.reverse(), ...prev];
                            const unique = Array.from(new Map(combined.map(t => [t.id, t])).values());
                            return unique.slice(0, 5);
                        });
                        setLastNotifiedId(data[0].id);

                        // Auto-hide each new toast after 5 seconds
                        newToasts.forEach(t => {
                            setTimeout(() => removeToast(t.id), 5000);
                        });
                    } else if (data[0].id !== lastNotifiedId) {
                        setLastNotifiedId(data[0].id);
                    }
                }

                setUnreadCount(data.length);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    }, [session, lastNotifiedId, removeToast]);

    const markAsRead = async (id: string) => {
        try {
            const res = await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                },
                body: JSON.stringify({ id }),
            });
            if (res.ok) {
                setNotifications(prev => prev.filter(n => n.id !== id));
                setUnreadCount(prev => Math.max(0, prev - 1));
                removeToast(id);
            }
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const res = await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                },
                body: JSON.stringify({ all: true }),
            });
            if (res.ok) {
                setNotifications([]);
                setUnreadCount(0);
                setToasts([]);
            }
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    useEffect(() => {
        if (session?.user) {
            fetchNotifications();

            // Poll every 5 seconds for better responsiveness
            const interval = setInterval(fetchNotifications, 5000);

            // Fetch immediately when window becomes visible
            const handleVisibilityChange = () => {
                if (document.visibilityState === 'visible') {
                    fetchNotifications();
                }
            };

            document.addEventListener('visibilitychange', handleVisibilityChange);

            return () => {
                clearInterval(interval);
                document.removeEventListener('visibilitychange', handleVisibilityChange);
            };
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

            {/* Stacked Toasts UI - Top Right */}
            <div className="fixed top-4 right-4 z-[200] flex flex-col gap-3 pointer-events-none w-full max-w-sm">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className="pointer-events-auto animate-in slide-in-from-right-full duration-300"
                    >
                        <div className={`p-4 rounded-xl shadow-2xl border flex gap-3 backdrop-blur-md ${toast.type === 'SUCCESS' ? 'bg-green-50/90 border-green-200 text-green-900' :
                            toast.type === 'WARNING' ? 'bg-orange-50/90 border-orange-200 text-orange-900' :
                                toast.type === 'ERROR' ? 'bg-red-50/90 border-red-200 text-red-900' :
                                    'bg-blue-50/90 border-blue-200 text-blue-900'
                            }`}>
                            <div className="flex-1">
                                <h4 className="font-bold text-sm mb-1">{toast.title}</h4>
                                <p className="text-xs opacity-90 leading-relaxed">{toast.message}</p>
                            </div>
                            <button
                                onClick={() => removeToast(toast.id)}
                                className="text-current opacity-50 hover:opacity-100 transition-opacity self-start mt-0.5"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                ))}
            </div>
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
