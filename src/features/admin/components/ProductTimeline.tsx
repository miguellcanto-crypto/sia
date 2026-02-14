'use client';

import { useEffect, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
    Clock,
    TrendingUp,
    TrendingDown,
    Box,
    DollarSign,
    User
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function ProductTimeline({ productId, productName, isOpen, onOpenChange }: {
    productId: string;
    productName: string;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void
}) {
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && productId) {
            fetchHistory();
        }
    }, [isOpen, productId]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/products/${productId}/history`);
            const data = await res.json();
            setHistory(data);
        } catch (error) {
            console.error('Failed to fetch history:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <History className="w-5 h-5 text-blue-500" />
                        Historial de {productName}
                    </DialogTitle>
                </DialogHeader>

                <div className="py-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-40 space-y-2">
                            <Clock className="w-8 h-8 text-slate-300 animate-spin" />
                            <p className="text-slate-500">Cargando trazabilidad...</p>
                        </div>
                    ) : history.length === 0 ? (
                        <div className="text-center py-10 text-slate-500 border-2 border-dashed rounded-lg">
                            No hay movimientos registrados para este producto.
                        </div>
                    ) : (
                        <div className="relative space-y-6 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-slate-800 before:to-transparent">
                            {history.map((item, idx) => (
                                <div key={idx} className="relative flex items-start group">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 z-10 group-hover:border-blue-500 transition-colors">
                                        {item.type === 'PRICE' ? (
                                            <DollarSign className="w-5 h-5 text-emerald-500" />
                                        ) : (
                                            <Box className="w-5 h-5 text-blue-500" />
                                        )}
                                    </div>
                                    <div className="flex-1 ml-4 bg-slate-50/50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800/60 backdrop-blur-sm">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                                {item.actionLabel}
                                            </span>
                                            <time className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                                                {new Date(item.date).toLocaleString()}
                                            </time>
                                        </div>

                                        <div className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
                                            <p>{item.reason}</p>

                                            <div className="flex flex-wrap gap-2 items-center text-xs">
                                                {item.type === 'STOCK' && (
                                                    <Badge variant="outline" className={cn(
                                                        "bg-white/50",
                                                        item.quantity > 0 ? "text-green-600 border-green-200" : "text-red-600 border-red-200"
                                                    )}>
                                                        {item.quantity > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                                                        {item.quantity > 0 ? '+' : ''}{item.quantity} {item.unit}
                                                    </Badge>
                                                )}
                                                {item.type === 'PRICE' && (
                                                    <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50/30">
                                                        Nuevo Precio: ${item.newValue}
                                                    </Badge>
                                                )}
                                                <div className="flex items-center text-slate-400 ml-auto">
                                                    <User className="w-3 h-3 mr-1" />
                                                    {item.user || 'SIA Bot'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

import { History } from 'lucide-react';
