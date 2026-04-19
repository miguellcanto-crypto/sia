'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Barcode, X, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchProductsProps {
    onSelect: (product: any) => void;
}

export function SearchProducts({ onSelect }: SearchProductsProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Global keyboard listener for F3 focus
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'F3') {
                e.preventDefault();
                inputRef.current?.focus();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Click away to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Debounced search logic
    useEffect(() => {
        if (query.trim().length < 2) {
            setResults([]);
            setIsOpen(false);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        const timer = setTimeout(async () => {
            try {
                const res = await fetch(`/api/products/search?q=${encodeURIComponent(query)}`);
                if (!res.ok) throw new Error('Search failed');
                const data = await res.json();
                setResults(data);
                if (data.length > 0) setIsOpen(true);
            } catch (error) {
                console.error('Search error:', error);
                setResults([]);
            } finally {
                setIsLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    return (
        <div ref={containerRef} className="relative w-full">
            <div className="relative group">
                <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                    <Search className={`h-5 w-5 transition-colors ${isLoading ? 'text-accent animate-pulse' : 'text-slate-400 group-focus-within:text-accent'}`} />
                </div>
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full pl-14 pr-14 py-5 bg-card dark:bg-slate-900 border-2 border-border-subtle dark:border-slate-800 rounded-2xl focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all font-medium text-lg placeholder:text-muted"
                    placeholder="Buscar producto por nombre o código (F3)..."
                    onFocus={() => query.length >= 2 && results.length > 0 && setIsOpen(true)}
                />
                <div className="absolute inset-y-0 right-5 flex items-center gap-3">
                    {query && (
                        <button
                            onClick={() => {
                                setQuery('');
                                setResults([]);
                                setIsOpen(false);
                                inputRef.current?.focus();
                            }}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                        >
                            <X className="w-5 h-5 text-slate-400" />
                        </button>
                    )}
                    <Barcode className="w-6 h-6 text-slate-300" />
                </div>
            </div>

            <AnimatePresence>
                {isOpen && (results.length > 0 || isLoading) && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute z-50 w-full mt-3 bg-card dark:bg-slate-900 rounded-2xl shadow-2xl border border-border-subtle dark:border-slate-800 overflow-hidden max-h-[400px] overflow-y-auto"
                    >
                        {isLoading && results.length === 0 ? (
                            <div className="p-8 text-center text-muted flex flex-col items-center gap-2">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
                                <span className="text-sm font-medium">Buscando productos...</span>
                            </div>
                        ) : results.length > 0 ? (
                            results.map((product) => (
                                <button
                                    key={product.id}
                                    onClick={() => {
                                        onSelect(product);
                                        setQuery('');
                                        setResults([]);
                                        setIsOpen(false);
                                    }}
                                    className="w-full flex items-center p-4 hover:bg-accent/5 dark:hover:bg-accent/10 text-left transition-colors border-b border-border-subtle/50 dark:border-slate-800 last:border-0"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mr-4">
                                        <Package className="w-6 h-6 text-slate-500" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-bold text-foreground dark:text-white">{product.name}</div>
                                        <div className="text-xs text-muted uppercase flex items-center gap-2 mt-1">
                                            <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-muted dark:text-slate-400">{product.code}</span>
                                            <span>•</span>
                                            <span className="text-accent dark:text-blue-400 font-semibold">{product.stock} {product.unit} disponible</span>
                                        </div>
                                    </div>
                                    <div className="text-xl font-mono font-black text-accent dark:text-white ml-4">
                                        ${Number(product.price).toFixed(2)}
                                    </div>
                                </button>
                            ))
                        ) : (
                            <div className="p-8 text-center text-slate-400 text-sm">
                                No se encontraron resultados
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
