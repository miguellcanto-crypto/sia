'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, UserCircle2, X, Star } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';

export function CustomerSelector() {
    const { customer, setCustomer } = useCartStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (!searchTerm || searchTerm.length < 2) {
            setResults([]);
            return;
        }

        const fetchCustomers = async () => {
            setIsSearching(true);
            try {
                const res = await fetch(`/api/customers?search=${encodeURIComponent(searchTerm)}&limit=5`);
                if (res.ok) {
                    const data = await res.json();
                    setResults(data.customers || []);
                }
            } catch (err) {
                console.error('Error fetching customers', err);
            } finally {
                setIsSearching(false);
            }
        };

        const timeoutId = setTimeout(fetchCustomers, 400);
        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    if (customer) {
        return (
            <div className="mx-8 mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3 overflow-hidden">
                    <UserCircle2 className="w-8 h-8 text-blue-500 shrink-0" />
                    <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold text-slate-900 dark:text-white truncate">{customer.name}</span>
                        {customer.points !== undefined && (
                            <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                                <Star className="w-3 h-3 text-amber-500" /> {customer.points} pts
                            </span>
                        )}
                    </div>
                </div>
                <button 
                    onClick={() => setCustomer(null)}
                    className="p-1.5 hover:bg-white dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-red-500 transition-colors"
                    title="Remover cliente de la venta"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        );
    }

    return (
        <div className="mx-8 mb-4 relative" ref={wrapperRef}>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    placeholder="Asignar cliente (opcional)..."
                    className="w-full pl-9 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400"
                />
                {isSearching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                )}
            </div>

            {isOpen && searchTerm.length >= 2 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-50 overflow-hidden max-h-60 overflow-y-auto">
                    {results.length === 0 && !isSearching ? (
                        <div className="p-4 text-center text-sm text-slate-500">
                            No se encontraron clientes
                        </div>
                    ) : (
                        results.map(c => (
                            <button
                                key={c.id}
                                onClick={() => {
                                    setCustomer(c);
                                    setSearchTerm('');
                                    setIsOpen(false);
                                }}
                                className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700 border-b border-slate-100 dark:border-slate-700 last:border-0 text-left transition-colors"
                            >
                                <UserCircle2 className="w-8 h-8 text-slate-300" />
                                <div className="flex flex-col min-w-0">
                                    <span className="text-sm font-bold text-slate-900 dark:text-white truncate">{c.name}</span>
                                    <span className="text-xs text-slate-500">{c.code} {c.phone ? ` • ${c.phone}` : ''}</span>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
