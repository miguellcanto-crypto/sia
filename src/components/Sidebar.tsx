'use client';

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
    History as HistoryIcon
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
            <div className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen border-r border-slate-800">
                <div className="p-6 flex items-center justify-between gap-3 animate-pulse">
                    <div className="w-10 h-10 bg-slate-800 rounded-xl"></div>
                    <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-800 rounded w-2/3"></div>
                        <div className="h-3 bg-slate-800 rounded w-1/2"></div>
                    </div>
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
        <div className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen border-r border-slate-800">
            <div className="p-6 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                        <Fish className="text-white w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-white font-bold text-lg leading-tight">Marisquería</h2>
                        <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">POS System</span>
                    </div>
                </div>
                <NotificationBell />
            </div>

            <nav className="flex-1 px-4 py-4 space-y-1">
                {filteredNavItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group",
                                isActive
                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/10"
                                    : "hover:bg-slate-800 hover:text-white"
                            )}
                        >
                            <item.icon className={cn(
                                "w-5 h-5 transition-colors",
                                isActive ? "text-white" : "text-slate-500 group-hover:text-slate-300"
                            )} />
                            <span className="font-medium">{item.name}</span>
                        </Link>
                    )
                })}
            </nav>

            <div className="p-4 mt-auto border-t border-slate-800">
                <div className="bg-slate-800/50 rounded-lg p-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white uppercase">
                        {session?.user?.name?.substring(0, 2) || 'US'}
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-semibold text-white truncate">{session?.user?.name || 'Usuario'}</p>
                        <p className="text-xs text-slate-500 truncate">{session?.user?.email || '...'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
