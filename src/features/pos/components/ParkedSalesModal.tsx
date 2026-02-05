'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { History, X, Play, Trash2, Clock, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface ParkedSalesModalProps {
    isOpen: boolean;
    onClose: () => void;
    parkedSales: any[];
    onResume: (sale: any) => void;
    onDelete: (id: string) => void;
}

export function ParkedSalesModal({ isOpen, onClose, parkedSales, onResume, onDelete }: ParkedSalesModalProps) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800"
                >
                    <div className="flex justify-between items-start mb-8">
                        <div className="flex items-center gap-4">
                            <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-2xl">
                                <History className="text-orange-600 dark:text-orange-400 w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Ventas en Espera</h2>
                                <p className="text-slate-500 mt-1">Recupere o elimine ventas pausadas</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {parkedSales.length === 0 ? (
                            <div className="py-20 text-center text-slate-400 italic bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                                No hay ventas en espera actualmente
                            </div>
                        ) : (
                            parkedSales.map((sale) => (
                                <motion.div
                                    key={sale.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="p-6 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-3xl group hover:border-orange-500/30 transition-all flex items-center justify-between"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className="font-bold text-lg text-slate-900 dark:text-white">
                                                {sale.name}
                                            </span>
                                            <span className="text-xs font-black bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-lg border border-orange-500/20">
                                                ${Number(sale.subtotal).toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-slate-500">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {formatDistanceToNow(new Date(sale.createdAt), { addSuffix: true, locale: es })}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <User className="w-3 h-3" />
                                                {(sale.items as any[]).length} productos
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => onResume(sale)}
                                            className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 font-bold text-sm"
                                        >
                                            <Play className="w-4 h-4 fill-white" /> Continuar
                                        </button>
                                        <button
                                            onClick={() => onDelete(sale.id)}
                                            className="p-3 bg-white dark:bg-slate-800 text-red-500 border border-red-500/20 rounded-xl hover:bg-red-50 transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
