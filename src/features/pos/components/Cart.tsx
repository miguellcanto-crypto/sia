'use client';

import { useCartStore } from '@/store/cartStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, Trash2, ShoppingBasket } from 'lucide-react';

export function Cart() {
    const { items, updateQuantity, removeItem, total } = useCartStore();

    if (items.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[2.5rem]">
                    <ShoppingBasket className="w-16 h-16 opacity-20" />
                </div>
                <div className="text-center">
                    <p className="font-bold">Tu carrito está vacío</p>
                    <p className="text-xs">Busca o escanea un producto para iniciar</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <motion.div layout className="space-y-4">
                    <AnimatePresence initial={false}>
                        {items.map((item) => (
                            <motion.div
                                key={item.id}
                                layout
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="group flex items-center p-4 bg-slate-50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 rounded-3xl border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all"
                            >
                                <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center shrink-0 shadow-sm relative overflow-hidden">
                                    {item.image ? (
                                        <img src={item.image} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-xs font-black text-slate-300">{item.code}</div>
                                    )}
                                </div>

                                <div className="ml-4 flex-1 min-w-0">
                                    <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">{item.name}</h4>
                                    <p className="text-xs text-slate-400 font-mono">${Number(item.price).toFixed(2)} / {item.unit}</p>
                                </div>

                                <div className="flex items-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-1 mx-4">
                                    <button
                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-500"
                                    >
                                        <Minus className="w-3.5 h-3.5" />
                                    </button>
                                    <span className="w-10 text-center font-black text-sm font-mono">{item.quantity}</span>
                                    <button
                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-500"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                <div className="text-right ml-2 min-w-[70px]">
                                    <p className="font-black text-slate-900 dark:text-white font-mono">${item.subtotal.toFixed(2)}</p>
                                    <button
                                        onClick={() => removeItem(item.id)}
                                        className="text-[10px] font-bold text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:underline"
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>
            </div>
        </div>
    );
}
