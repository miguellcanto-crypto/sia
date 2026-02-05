'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutGrid, Landmark, Wallet, X } from 'lucide-react';

interface CashSessionModalProps {
    isOpen: boolean;
    onSessionCreated: (session: any) => void;
}

export function CashSessionModal({ isOpen, onSessionCreated }: CashSessionModalProps) {
    const [registers, setRegisters] = useState<any[]>([]);
    const [selectedRegister, setSelectedRegister] = useState('');
    const [openingAmount, setOpeningAmount] = useState('0');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetch('/api/cash/registers')
                .then(res => res.json())
                .then(setRegisters);
        }
    }, [isOpen]);

    const handleOpenSession = async () => {
        if (!selectedRegister) return;
        setIsLoading(true);
        try {
            const res = await fetch('/api/cash/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    registerId: selectedRegister,
                    openingAmount: parseFloat(openingAmount)
                })
            });
            const data = await res.json();
            if (res.ok) {
                onSessionCreated(data);
            } else {
                alert(data.error);
            }
        } catch (error) {
            console.error('Error opening session:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800"
                >
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Apertura de Caja</h2>
                            <p className="text-slate-500 mt-1">Configure su sesión de trabajo</p>
                        </div>
                        <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-2xl">
                            <Landmark className="text-blue-600 dark:text-blue-400 w-6 h-6" />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Seleccione su Caja</label>
                            <div className="grid grid-cols-1 gap-3">
                                {registers.map(reg => (
                                    <button
                                        key={reg.id}
                                        onClick={() => setSelectedRegister(reg.id)}
                                        className={`flex items-center p-4 rounded-2xl border transition-all ${selectedRegister === reg.id
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20'
                                                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                                            }`}
                                    >
                                        <div className={`p-2 rounded-xl mr-4 ${selectedRegister === reg.id ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                                            <LayoutGrid className="w-5 h-5" />
                                        </div>
                                        <div className="text-left">
                                            <div className="font-semibold">{reg.name}</div>
                                            <div className="text-sm opacity-70">{reg.location || 'Sin ubicación'}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 font-display">Monto Inicial en Efectivo</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Wallet className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    type="number"
                                    value={openingAmount}
                                    onChange={(e) => setOpeningAmount(e.target.value)}
                                    className="block w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all text-lg font-mono"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleOpenSession}
                            disabled={!selectedRegister || isLoading}
                            className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-bold text-lg shadow-xl shadow-blue-500/20 disabled:opacity-50 transition-all flex items-center justify-center transform active:scale-[0.98]"
                        >
                            {isLoading ? 'Abriendo...' : 'Comenzar Turno'}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
