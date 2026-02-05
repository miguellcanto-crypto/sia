'use client';

import { motion } from 'framer-motion';
import { Package, Fish, Waves, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductCardProps {
    product: any;
    onAddToCart: (product: any) => void;
    className?: string;
}

export function ProductCard({ product, onAddToCart, className }: ProductCardProps) {
    return (
        <motion.button
            whileHover={{ y: -6, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onAddToCart(product)}
            className={cn(
                "group relative bg-white dark:bg-slate-900 rounded-[2rem] p-5 shadow-sm hover:shadow-2xl hover:shadow-blue-500/10 border border-slate-100 dark:border-slate-800 transition-all text-left flex flex-col overflow-hidden",
                className
            )}
        >
            {/* Visual Header */}
            <div className="relative aspect-[4/3] w-full rounded-2xl bg-slate-50 dark:bg-slate-800/50 mb-4 flex items-center justify-center overflow-hidden group-hover:bg-blue-50 dark:group-hover:bg-blue-900/10 transition-colors">
                {product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                    product.isSeafood ? <Waves className="w-12 h-12 text-blue-400 opacity-40" /> : <Package className="w-12 h-12 text-slate-300" />
                )}

                {/* Floating Add Button */}
                <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                    <div className="bg-blue-600 text-white p-3 rounded-2xl shadow-xl shadow-blue-500/40">
                        <Plus className="w-5 h-5" />
                    </div>
                </div>

                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                    {product.isFresh && (
                        <span className="bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded-lg shadow-lg shadow-emerald-500/20 uppercase tracking-tighter">
                            Fresco
                        </span>
                    )}
                </div>
            </div>

            {/* Info */}
            <div className="space-y-1.5 flex-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-blue-500/60 transition-colors">
                    {product.category?.name || 'Varios'}
                </p>
                <h3 className="font-bold text-slate-900 dark:text-white leading-tight line-clamp-2">
                    {product.name}
                </h3>
            </div>

            {/* Price Footer */}
            <div className="mt-4 flex items-end justify-between">
                <div>
                    <p className="text-[10px] text-slate-400 font-medium">Precio / {product.unit || 'und'}</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tighter">
                        ${Number(product.price).toFixed(2)}
                    </p>
                </div>
                {product.stock <= 5 && (
                    <span className="text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-lg border border-red-500/10">
                        Solo {product.stock}
                    </span>
                )}
            </div>
        </motion.button>
    );
}
