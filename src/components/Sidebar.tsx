'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    Users,
    BarChart3,
    Settings,
    Fish,
    History as HistoryIcon,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NotificationBell } from './notifications/NotificationBell';

const navItems = [
    { name: 'Terminal POS', icon: ShoppingCart, href: '/pos' },
    { name: 'Catálogo e Inventario', icon: Package, href: '/inventory' },
    { name: 'Clientes', icon: Users, href: '/customers' },
    { name: 'Reportes', icon: BarChart3, href: '/admin/reports' },
    { name: 'Auditoría', icon: HistoryIcon, href: '/admin/audit' },
    { name: 'Configuración', icon: Settings, href: '/settings' },
];

export function Sidebar() {
    const pathname = usePathname();
    const { data: session, status } = useSession();
    const [isCollapsed, setIsCollapsed] = useState(false);

    const userRole = (session?.user as any)?.role;
    const userPermissions = (session?.user as any)?.permissions || [];

    const hasReportAccess = userRole === 'ADMIN' || userRole === 'MANAGER' || (Array.isArray(userPermissions) ? userPermissions.includes('VIEW_REPORTS') : false);

    const filteredNavItems = navItems.filter(item => {
        if (item.name === 'Reportes') return hasReportAccess;
        if (item.name === 'Auditoría') return userRole === 'ADMIN';
        if (item.name === 'Configuración') return Array.isArray(userPermissions) ? userPermissions.includes('MANAGE_SETTINGS') : false;
        return true;
    });

    if (status === 'loading') {
        return (
            <div className={cn("bg-sidebar text-slate-200 flex flex-col h-screen border-r border-slate-800 transition-all duration-300", isCollapsed ? "w-20" : "w-64")}>
                <div className={cn("p-6 flex items-center gap-3 animate-pulse", isCollapsed ? "justify-center" : "justify-between")}>
                    <div className="w-10 h-10 bg-slate-800 rounded-xl shrink-0"></div>
                    {!isCollapsed && (
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-slate-800 rounded w-2/3"></div>
                            <div className="h-3 bg-slate-800 rounded w-1/2"></div>
                        </div>
                    )}
                </div>
                <div className="flex-1 px-4 py-4 space-y-2 animate-pulse">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-12 bg-slate-800 rounded-lg w-full"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className={cn("bg-sidebar text-slate-200 flex flex-col h-screen border-r border-sidebar relative transition-all duration-300", isCollapsed ? "w-20" : "w-64")}>
            
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute -right-3.5 top-8 bg-card border border-border-subtle rounded-full p-1 shadow-md text-muted hover:text-accent z-50 transition-colors"
                title={isCollapsed ? "Expandir" : "Colapsar"}
            >
                {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>

            <div className={cn("p-6 flex gap-3", isCollapsed ? "justify-center flex-col items-center" : "items-center justify-between")}>
                <div className="flex items-center gap-3 w-full">
                    <div className={cn("flex justify-center shrink-0 transition-all", isCollapsed ? "w-full" : "w-10")}>
                        <img src="/Logo_Marisqueria.png" alt="Logo" className="w-10 h-10 object-contain drop-shadow-md" />
                    </div>
                    {!isCollapsed && (
                        <div className="overflow-hidden">
                            <h2 className="text-white font-bold text-lg leading-tight truncate">Marisquería</h2>
                            <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold truncate block">POS System</span>
                        </div>
                    )}
                </div>
                {!isCollapsed && <NotificationBell />}
            </div>

            <nav className="flex-1 px-3 py-4 space-y-2">
                {filteredNavItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            title={isCollapsed ? item.name : undefined}
                            className={cn(
                                "flex items-center gap-3 py-3 rounded-lg transition-all duration-200 group overflow-hidden",
                                isActive
                                    ? "bg-accent text-white shadow-lg shadow-accent/10"
                                    : "hover:bg-slate-800 hover:text-white",
                                isCollapsed ? "justify-center px-0" : "px-4"
                            )}
                        >
                            <item.icon className={cn(
                                "w-5 h-5 shrink-0 transition-colors",
                                isActive ? "text-white" : "text-muted group-hover:text-slate-200"
                            )} />
                            {!isCollapsed && (
                                <span className="font-medium truncate">{item.name}</span>
                            )}
                        </Link>
                    )
                })}
            </nav>

            <div className="p-4 mt-auto border-t border-slate-800">
                <div className={cn("bg-slate-800/50 rounded-lg flex items-center gap-3", isCollapsed ? "p-2 justify-center" : "p-4")}>
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0 text-xs font-bold text-white uppercase">
                        {session?.user?.name?.substring(0, 2) || 'US'}
                    </div>
                    {!isCollapsed && (
                        <div className="overflow-hidden">
                            <p className="text-sm font-semibold text-white truncate">{session?.user?.name || 'Usuario'}</p>
                            <p className="text-xs text-slate-500 truncate">{session?.user?.email || '...'}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
