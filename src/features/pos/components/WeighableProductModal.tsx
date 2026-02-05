'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scale, X, Check, Calculator } from 'lucide-react';

interface WeighableProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: any;
    onConfirm: (quantity: number) => void;
}

export function WeighableProductModal({ isOpen, onClose, product, onConfirm }: WeighableProductModalProps) {
    const [weight, setWeight] = useState('');
    const [isSimulating, setIsSimulating] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setWeight('');
            setIsSimulating(false);
        }
    }, [isOpen]);

    const handleSimulateScale = () => {
        setIsSimulating(true);
        setTimeout(() => {
            const randomWeight = (Math.random() * 2 + 0.5).toFixed(3);
            setWeight(randomWeight);
            setIsSimulating(false);
        }, 800);
    };

    const handleConfirm = () => {
        const q = parseFloat(weight);
        if (q > 0) {
            onConfirm(q);
        }
    };

    const currentTotal = product ? parseFloat(weight || '0') * Number(product.price) : 0;

    return (
        <AnimatePresence>
            {(isOpen && product) && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800"
                    >
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-3">
                                <div className="bg-blue-100 dark:bg-blue-900/30 p-2.5 rounded-2xl text-blue-600 dark:text-blue-400">
                                    <Scale className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold">{product.name}</h2>
                                    <p className="text-xs text-slate-500 uppercase font-black tracking-widest">Producto Pesable</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Precio / {product.unit}</p>
                                    <p className="text-xl font-black font-mono">${Number(product.price).toFixed(2)}</p>
                                </div>
                                <div className="p-5 bg-blue-50 dark:bg-blue-900/10 rounded-3xl border border-blue-100 dark:border-blue-800/20">
                                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Total Parcial</p>
                                    <p className="text-xl font-black font-mono text-blue-600 dark:text-blue-400">${currentTotal.toFixed(2)}</p>
                                </div>
                            </div>

                            <div className="relative">
                                <label className="block text-sm font-bold text-slate-500 mb-2">Peso ({product.unit})</label>
                                <input
                                    type="number"
                                    step="0.001"
                                    autoFocus
                                    value={weight}
                                    onChange={(e) => setWeight(e.target.value)}
                                    className="w-full bg-slate-100 dark:bg-slate-950 border-2 border-transparent focus:border-blue-500 rounded-2xl py-6 px-6 text-4xl font-black text-center font-mono transition-all"
                                    placeholder="0.000"
                                />
                                <button
                                    onClick={handleSimulateScale}
                                    className={`absolute right-4 top-[2.4rem] p-2 rounded-xl transition-all ${isSimulating ? 'bg-blue-600 text-white animate-pulse' : 'bg-white dark:bg-slate-800 text-slate-400 hover:text-blue-500 shadow-sm border border-slate-200 dark:border-slate-700'}`}
                                    title="Simular lectura de balanza (USB)"
                                >
                                    <Calculator className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex gap-3">
                                {[0.25, 0.5, 1.0, 2.0].map(val => (
                                    <button
                                        key={val}
                                        onClick={() => setWeight(val.toString())}
                                        className="flex-1 py-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-xs font-bold transition-all"
                                    >
                                        {val} {product.unit}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={handleConfirm}
                                disabled={!weight || parseFloat(weight) <= 0}
                                className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xl shadow-xl shadow-blue-500/25 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <Check className="w-6 h-6" /> Confirmar Peso
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
