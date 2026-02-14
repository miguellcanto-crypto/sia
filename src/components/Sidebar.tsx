'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    Users,
    BarChart3,
    Settings,
    Fish
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
    { name: 'Terminal POS', icon: ShoppingCart, href: '/pos' },
    { name: 'Inventario', icon: Package, href: '/inventory' },
    { name: 'Productos', icon: Fish, href: '/products' },
    { name: 'Clientes', icon: Users, href: '/customers' },
    { name: 'Reportes', icon: BarChart3, href: '/reports' },
    { name: 'Configuración', icon: Settings, href: '/settings' },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen border-r border-slate-800">
            <div className="p-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                    <Fish className="text-white w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-white font-bold text-lg leading-tight">Marisquería</h2>
                    <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">POS System</span>
                </div>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-1">
                {navItems.map((item) => {
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
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white">
                        AD
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-white">Admin Principal</p>
                        <p className="text-xs text-slate-500">marisqueria@sia.com</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
