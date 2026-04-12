'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Banknote, Landmark, Tags, X, CheckCircle2 } from 'lucide-react';
import { TipCalculator } from './TipCalculator';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    total: number;
    onSubmit: (data: any) => Promise<any>;
}

import { useCartStore } from '@/store/cartStore';
import { playSaleSound } from '@/lib/audio-alerts';

export function PaymentModal({ isOpen, onClose, total, onSubmit }: PaymentModalProps) {
    const { customer } = useCartStore();
    const [method, setMethod] = useState<'CASH' | 'CARD' | 'TRANSFER' | 'CREDIT'>('CASH');
    const [manualDiscount, setManualDiscount] = useState('0');
    const [pointsToUse, setPointsToUse] = useState(0);
    const [receivedAmount, setReceivedAmount] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [success, setSuccess] = useState(false);

    const [tipAmount, setTipAmount] = useState(0);
    const [tipPercent, setTipPercent] = useState(0);

    const pointDiscount = pointsToUse * 1; // 1 punto = $1
    const totalDiscount = parseFloat(manualDiscount || '0') + pointDiscount;
    const finalTotal = Math.max(0, total - totalDiscount + tipAmount);
    const change = parseFloat(receivedAmount || '0') - finalTotal;

    const availableCredit = customer ? Number(customer.creditLimit) - Number(customer.balance) : 0;
    const isCreditValid = method !== 'CREDIT' || (customer && availableCredit >= finalTotal);

    const handleSubmit = async () => {
        setIsProcessing(true);
        const result = await onSubmit({
            method,
            discount: totalDiscount,
            pointsUsed: pointsToUse, // Send the points used so backend can deduct them
            tip: tipAmount,
            tipPercent: tipPercent,
            amountPaid: method === 'CASH' ? parseFloat(receivedAmount || '0') : finalTotal
        });

        if (result.success) {
            setSuccess(true);
            playSaleSound();
            setTimeout(() => {
                setSuccess(false);
                setPointsToUse(0);
                setManualDiscount('0');
                setReceivedAmount('');
                onClose();
            }, 2000);
        } else {
            alert(result.error);
        }
        setIsProcessing(false);
    };

    useEffect(() => {
        if (isOpen) {
            setMethod('CASH');
            setManualDiscount('0');
            setPointsToUse(0);
            setReceivedAmount('');
            setTipAmount(0);
            setTipPercent(0);
            setIsProcessing(false);
            setSuccess(false);
        }
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden relative"
                >
                    {success && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute inset-0 bg-white/90 dark:bg-slate-900/90 z-20 flex flex-col items-center justify-center"
                        >
                            <CheckCircle2 className="w-24 h-24 text-green-500 mb-4" />
                            <h3 className="text-3xl font-bold">¡Venta Completada!</h3>
                            <p className="text-slate-500 mt-2">Imprimiendo ticket...</p>
                        </motion.div>
                    )}

                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">Finalizar Venta</h2>
                            <p className="text-slate-500 mt-1">Seleccione método y procese el pago</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        <div className="space-y-8">
                            <div>
                                <label className="block text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">Método de Pago</label>
                                <div className="grid grid-cols-1 gap-3">
                                    {[
                                        { id: 'CASH', label: 'Efectivo', icon: Banknote, color: 'emerald' },
                                        { id: 'CARD', label: 'Tarjeta', icon: CreditCard, color: 'blue' },
                                        { id: 'TRANSFER', label: 'Transferencia', icon: Landmark, color: 'indigo' },
                                        { id: 'CREDIT', label: 'Crédito', icon: Landmark, color: 'orange' }
                                    ].map((m) => (
                                        <button
                                            key={m.id}
                                            onClick={() => setMethod(m.id as any)}
                                            className={`flex items-center p-4 rounded-2xl border-2 transition-all ${method === m.id
                                                ? `border-${m.color}-500 bg-${m.color}-50 dark:bg-${m.color}-900/10`
                                                : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30'
                                                }`}
                                        >
                                            <m.icon className={`w-6 h-6 mr-4 ${method === m.id ? `text-${m.color}-500` : 'text-slate-400'}`} />
                                            <span className={`font-bold ${method === m.id ? `text-${m.color}-700 dark:text-${m.color}-300` : 'text-slate-600 dark:text-slate-400'}`}>{m.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">Descuento Manual</label>
                                <div className="relative">
                                    <Tags className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                    <input
                                        type="number"
                                        value={manualDiscount}
                                        onChange={(e) => setManualDiscount(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 font-mono text-lg text-slate-900 dark:text-white"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            {customer && customer.points > 0 && (
                                <div>
                                    <label className="block text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4 flex justify-between">
                                        <span>Canjear Puntos</span>
                                        <span className="text-blue-500">{customer.points} disponibles</span>
                                    </label>
                                    <div className="flex gap-4 items-center">
                                        <input
                                            type="range"
                                            min="0"
                                            max={Math.min(customer.points, Math.floor(total - parseFloat(manualDiscount || '0') + tipAmount))}
                                            value={pointsToUse}
                                            onChange={(e) => setPointsToUse(Number(e.target.value))}
                                            className="flex-1"
                                        />
                                        <span className="font-mono font-bold w-16 text-right">${pointDiscount.toFixed(2)}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2">1 punto = $1 de descuento extra</p>
                                </div>
                            )}

                            <TipCalculator total={total} onTipChange={(amount: number, percent: number) => {
                                setTipAmount(amount);
                                setTipPercent(percent);
                            }} />
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] p-8 flex flex-col justify-between border border-slate-200 dark:border-slate-700">
                            <div className="space-y-6">
                                <div className="flex justify-between items-center text-slate-500">
                                    <span>Subtotal</span>
                                    <span className="font-mono text-lg">${total.toFixed(2)}</span>
                                </div>
                                {parseFloat(manualDiscount || '0') > 0 && (
                                    <div className="flex justify-between items-center text-red-500">
                                        <span>Descuento Manual</span>
                                        <span className="font-mono text-lg">-${parseFloat(manualDiscount || '0').toFixed(2)}</span>
                                    </div>
                                )}
                                {pointDiscount > 0 && (
                                    <div className="flex justify-between items-center text-red-500">
                                        <span>Descuento por Puntos ({pointsToUse} pts)</span>
                                        <span className="font-mono text-lg">-${pointDiscount.toFixed(2)}</span>
                                    </div>
                                )}
                                {tipAmount > 0 && (
                                    <div className="flex justify-between items-center text-emerald-500">
                                        <span>Propina</span>
                                        <span className="font-mono text-lg">+${tipAmount.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="h-px bg-slate-200 dark:bg-slate-700" />
                                <div className="flex justify-between items-end">
                                    <span className="text-xl font-bold">Total a Pagar</span>
                                    <span className="text-4xl font-black text-blue-600 dark:text-blue-400 font-mono">${finalTotal.toFixed(2)}</span>
                                </div>

                                {method === 'CASH' && (
                                    <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-700">
                                        <label className="block text-sm font-bold text-slate-500 mb-2">Entregado</label>
                                        <input
                                            type="number"
                                            autoFocus
                                            value={receivedAmount}
                                            onChange={(e) => setReceivedAmount(e.target.value)}
                                            className="w-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-2xl py-4 px-6 text-3xl font-black text-center font-mono focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-900 dark:text-white"
                                            placeholder="0.00"
                                        />
                                        {change >= 0 && (
                                            <div className="mt-4 p-4 bg-emerald-100 dark:bg-emerald-900/20 rounded-2xl flex justify-between items-center">
                                                <span className="text-emerald-700 dark:text-emerald-300 font-bold">Cambio</span>
                                                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">${change.toFixed(2)}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                                
                                {method === 'CREDIT' && (
                                    <div className={`mt-4 p-4 rounded-2xl ${
                                        !customer ? 'bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200' :
                                        !isCreditValid ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200' :
                                        'bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200'
                                    }`}>
                                        <div className="flex items-center gap-2 mb-2 font-bold text-sm">
                                            <Landmark className="w-4 h-4" />
                                            <span>Estado del Crédito</span>
                                        </div>
                                        
                                        {!customer ? (
                                            <p className="text-xs">Debe seleccionar un cliente antes de procesar una venta a crédito.</p>
                                        ) : (
                                            <>
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span>Disponible:</span>
                                                    <span className={`font-bold ${isCreditValid ? 'text-green-600' : 'text-red-600'}`}>
                                                        ${availableCredit.toFixed(2)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between text-xs">
                                                    <span>Límite:</span>
                                                    <span className="font-semibold">${Number(customer.creditLimit).toFixed(2)}</span>
                                                </div>
                                                {!isCreditValid && (
                                                    <p className="text-[10px] mt-2 font-bold text-red-600 uppercase animate-pulse italic">
                                                        Límite excedido o no disponible
                                                    </p>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={handleSubmit}
                                disabled={isProcessing || (method === 'CASH' && change < 0) || !isCreditValid}
                                className="w-full mt-8 py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xl shadow-xl shadow-blue-500/25 disabled:opacity-50 transition-all active:scale-[0.98]"
                            >
                                {isProcessing ? 'Procesando...' : 'Confirmar Pago'}
                            </button>
                            {method === 'CREDIT' && !isCreditValid && (
                                <p className="text-red-500 text-sm mt-2 text-center">Crédito insuficiente o no autorizado.</p>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
            )}
        </AnimatePresence>
    );
}
