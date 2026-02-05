'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Coins, Heart } from 'lucide-react';

interface TipCalculatorProps {
    total: number;
    onTipChange: (tipAmount: number, tipPercent: number) => void;
}

export function TipCalculator({ total, onTipChange }: TipCalculatorProps) {
    const [selectedPercent, setSelectedPercent] = useState<number | null>(null);
    const [customTip, setCustomTip] = useState('');

    const handlePercentSelect = (percent: number) => {
        setSelectedPercent(percent);
        setCustomTip('');
        const amount = total * (percent / 100);
        onTipChange(amount, percent);
    };

    const handleCustomChange = (value: string) => {
        setCustomTip(value);
        setSelectedPercent(null);
        const amount = parseFloat(value) || 0;
        onTipChange(amount, 0);
    };

    return (
        <div className="space-y-4 bg-slate-50 dark:bg-slate-800/30 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-2">
                <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Añadir Propina</span>
            </div>

            <div className="grid grid-cols-4 gap-2">
                {[5, 10, 15, 20].map((p) => (
                    <button
                        key={p}
                        onClick={() => handlePercentSelect(p)}
                        className={`py-3 rounded-2xl font-bold transition-all border-2 ${selectedPercent === p
                                ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/30'
                                : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-blue-200'
                            }`}
                    >
                        {p}%
                    </button>
                ))}
            </div>

            <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <Coins className="h-4 w-4 text-slate-400" />
                </div>
                <input
                    type="number"
                    value={customTip}
                    onChange={(e) => handleCustomChange(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-mono text-sm"
                    placeholder="Monto personalizado..."
                />
            </div>

            {selectedPercent && (
                <p className="text-[10px] text-center text-slate-400 font-medium italic">
                    Propina calculada: ${(total * (selectedPercent / 100)).toFixed(2)}
                </p>
            )}
        </div>
    );
}
