'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Calculator, AlertCircle, CheckCircle2, X } from 'lucide-react';

interface CloseSessionModalProps {
    isOpen: boolean;
    onClose: () => void;
    expectedAmount: number;
    onConfirm: (actualAmount: number, notes: string) => Promise<void>;
}

export function CloseSessionModal({ isOpen, onClose, expectedAmount, onConfirm }: CloseSessionModalProps) {
    const [actualAmount, setActualAmount] = useState('');
    const [notes, setNotes] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const difference = parseFloat(actualAmount || '0') - expectedAmount;

    const handleSubmit = async () => {
        setIsProcessing(true);
        await onConfirm(parseFloat(actualAmount || '0'), notes);
        setIsProcessing(false);
        onClose();
    };

    useEffect(() => {
        if (isOpen) {
            setActualAmount('');
            setNotes('');
            setIsProcessing(false);
        }
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800"
                >
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-3">
                            <div className="bg-red-100 dark:bg-red-900/30 p-2.5 rounded-2xl text-red-600 dark:text-red-400">
                                <Lock className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold">Cierre de Caja</h2>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="space-y-6">
                        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Efectivo Esperado</p>
                            <p className="text-3xl font-black text-slate-900 dark:text-white font-mono">${expectedAmount.toFixed(2)}</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-500 mb-2">Efectivo Real en Caja</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                        <Calculator className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input
                                        type="number"
                                        autoFocus
                                        value={actualAmount}
                                        onChange={(e) => setActualAmount(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-mono text-xl font-black text-center"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            {actualAmount !== '' && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`p-4 rounded-2xl flex items-center justify-between ${Math.abs(difference) < 0.01
                                            ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                                            : 'bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        {Math.abs(difference) < 0.01 ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                        <span className="text-xs font-bold uppercase">{Math.abs(difference) < 0.01 ? 'Cuadrado' : 'Diferencia'}</span>
                                    </div>
                                    <span className="font-mono font-black">${difference.toFixed(2)}</span>
                                </motion.div>
                            )}

                            <div>
                                <label className="block text-sm font-bold text-slate-500 mb-2">Notas de Cierre</label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="w-full p-4 bg-white dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-2xl focus:border-blue-500 transition-all text-sm resize-none"
                                    rows={3}
                                    placeholder="Motivo de diferencia, retiro parcial, etc..."
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={isProcessing || actualAmount === ''}
                            className="w-full py-5 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-lg transition-all active:scale-[0.98] disabled:opacity-50"
                        >
                            {isProcessing ? 'Cerrando...' : 'Finalizar Turno'}
                        </button>
                    </div>
                </motion.div>
            </div>
            )}
        </AnimatePresence>
    );
}
