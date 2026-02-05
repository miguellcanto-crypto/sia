'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, RefreshCw } from 'lucide-react';

export function RevenueTicker() {
    const [revenue, setRevenue] = useState(12450.75);
    const [lastUpdate, setLastUpdate] = useState(new Date());
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setIsUpdating(true);
            setTimeout(() => {
                setRevenue(prev => prev + (Math.random() * 50 + 10));
                setLastUpdate(new Date());
                setIsUpdating(false);
            }, 500);
        }, 15000); // Update every 15s to simulate real-time sales

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 px-5 py-2 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex flex-col">
                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                    <TrendingUp className="w-2.5 h-2.5" /> Ventas Hoy (Live)
                </span>
                <AnimatePresence mode="wait">
                    <motion.span
                        key={revenue}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="text-lg font-black text-slate-900 dark:text-white font-mono leading-none"
                    >
                        ${revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </motion.span>
                </AnimatePresence>
            </div>

            <div className={`p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 transition-all ${isUpdating ? 'animate-spin' : ''}`}>
                <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            </div>
        </div>
    );
}
