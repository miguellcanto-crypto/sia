'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, UserCircle2, Star, History, CreditCard, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function CustomerDetailPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const resolvedParams = useParams<{ id: string }>();
    const customerId = resolvedParams?.id || params?.id;
    const [customer, setCustomer] = useState<any>(null);
    const [sales, setSales] = useState<any[]>([]);
    const [payments, setPayments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Abonos
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('CASH');
    const [paymentNotes, setPaymentNotes] = useState('');
    const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

    // Ajuste manual de puntos
    const [adjustPoints, setAdjustPoints] = useState(0);
    const [adjustReason, setAdjustReason] = useState('');
    const [isAdjusting, setIsAdjusting] = useState(false);

    const fetchCustomer = async () => {
        if (!customerId) return;
        
        try {
            const [custRes, salesRes, paymentsRes] = await Promise.all([
                fetch(`/api/customers/${customerId}`),
                fetch(`/api/customers/${customerId}/sales?limit=20`),
                fetch(`/api/customers/${customerId}/payments`)
            ]);
            
            if (custRes.ok) {
                setCustomer(await custRes.json());
            } else if (custRes.status === 404) {
                toast.error('Cliente no encontrado');
                router.push('/customers');
            }
            
            if (salesRes.ok) {
                const data = await salesRes.json();
                setSales(data.sales || data);
            }

            if (paymentsRes.ok) {
                setPayments(await paymentsRes.json());
            }
        } catch (error) {
            toast.error('Error al cargar datos del cliente');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegisterPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(paymentAmount);
        if (isNaN(amount) || amount <= 0) {
            toast.error('Monto inválido');
            return;
        }

        setIsSubmittingPayment(true);
        try {
            const res = await fetch(`/api/customers/${customerId}/payments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount,
                    paymentMethod,
                    notes: paymentNotes
                })
            });

            if (res.ok) {
                toast.success('Abono registrado correctamente');
                setIsPaymentModalOpen(false);
                setPaymentAmount('');
                setPaymentNotes('');
                fetchCustomer();
            } else {
                const data = await res.json();
                toast.error(data.error || 'Error al registrar abono');
            }
        } catch (error) {
            toast.error('Error de red');
        } finally {
            setIsSubmittingPayment(false);
        }
    };

    useEffect(() => {
        fetchCustomer();
    }, [customerId]);

    const handleAdjustPoints = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!adjustReason || adjustReason.length < 5) {
            toast.error('El motivo debe ser más descriptivo');
            return;
        }

        setIsAdjusting(true);
        try {
            const res = await fetch(`/api/customers/${customerId}/points`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ points: adjustPoints, reason: adjustReason })
            });

            if (res.ok) {
                toast.success('Puntos actualizados correctamente');
                setAdjustPoints(0);
                setAdjustReason('');
                fetchCustomer(); // Reload to see new point history
            } else {
                const data = await res.json();
                toast.error(data.error || 'Error al ajustar puntos');
            }
        } catch (error) {
            toast.error('Error de red al enviar el ajuste');
        } finally {
            setIsAdjusting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Button variant="ghost" onClick={() => router.push('/customers')}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Volver
                </Button>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1 space-y-6"><Skeleton className="h-64 w-full" /></div>
                    <div className="md:col-span-2 space-y-6"><Skeleton className="h-64 w-full" /><Skeleton className="h-64 w-full" /></div>
                </div>
            </div>
        );
    }

    if (!customer) return null;

    const getTierColor = (tier: string) => {
        if (tier === 'GOLD') return 'bg-amber-500 text-white';
        if (tier === 'SILVER') return 'bg-slate-300 text-slate-800';
        return 'bg-orange-700 text-white';
    };

    return (
        <div className="space-y-6">
            <Button variant="ghost" onClick={() => router.push('/customers')} className="pl-0 hover:bg-transparent">
                <ArrowLeft className="w-4 h-4 mr-2" /> Volver al listado
            </Button>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Panel Izquierdo: Info General */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 flex flex-col items-center text-center relative overflow-hidden">
                        <div className={`absolute top-0 left-0 w-full h-2 ${getTierColor(customer.tier)}`} />
                        <UserCircle2 className="w-20 h-20 text-slate-300 mb-4" />
                        <h2 className="text-xl font-bold dark:text-white capitalize">{customer.name}</h2>
                        <span className="text-sm font-semibold text-slate-500 uppercase flex items-center gap-1 mt-1">
                            {customer.code}
                        </span>
                        
                        <div className="flex gap-2 mt-4 w-full">
                            <div className="flex-1 bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                                <span className="text-xs text-slate-500 uppercase font-semibold">Saldo (MXN)</span>
                                <p className={`text-lg font-bold ${Number(customer.balance) > 0 ? 'text-red-500' : 'text-slate-700 dark:text-slate-300'}`}>
                                    {formatCurrency(Number(customer.balance))}
                                </p>
                            </div>
                            <div className="flex-1 bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                                <span className="text-xs text-slate-500 uppercase font-semibold">Crédito (Max)</span>
                                <p className="text-lg font-bold text-slate-700 dark:text-slate-300">
                                    {formatCurrency(Number(customer.creditLimit))}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-orange-500" />
                                Gestión de Deuda
                            </h3>
                            <Button 
                                size="sm" 
                                onClick={() => setIsPaymentModalOpen(true)}
                                className="bg-orange-600 hover:bg-orange-700 text-white h-8"
                            >
                                Registrar Abono
                            </Button>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-xs mb-1 font-semibold uppercase tracking-wider text-slate-500">
                                    <span>Uso de Crédito</span>
                                    <span>{((Number(customer.balance) / Number(customer.creditLimit)) * 100).toFixed(0)}%</span>
                                </div>
                                <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
                                    <div 
                                        className={`h-full transition-all duration-500 ${
                                            (Number(customer.balance) / Number(customer.creditLimit)) >= 0.8 ? 'bg-red-500' : 'bg-orange-500'
                                        }`}
                                        style={{ width: `${Math.min(100, (Number(customer.balance) / Number(customer.creditLimit)) * 100)}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-[10px] mt-1 text-slate-400 font-mono">
                                    <span>$0.00</span>
                                    <span>{formatCurrency(Number(customer.creditLimit))}</span>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                                <h4 className="text-xs font-bold uppercase text-slate-500 mb-3">Historial de Abonos</h4>
                                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                                    {payments.length === 0 ? (
                                        <p className="text-xs text-slate-500 italic">No hay abonos registrados</p>
                                    ) : (
                                        payments.map((p: any) => (
                                            <div key={p.id} className="flex justify-between items-center text-sm py-2 border-b border-slate-50 dark:border-slate-800 last:border-0">
                                                <div>
                                                    <p className="font-bold text-emerald-600">{formatCurrency(Number(p.amount))}</p>
                                                    <p className="text-[10px] text-slate-500">{new Date(p.date).toLocaleDateString()} • {p.paymentMethod}</p>
                                                </div>
                                                {p.notes && (
                                                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded italic truncate max-w-[100px]" title={p.notes}>
                                                        {p.notes}
                                                    </span>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                        <h3 className="font-bold flex items-center gap-2 mb-4">
                            <Star className="w-5 h-5 text-amber-500" />
                            Programa de Lealtad (Puntos)
                        </h3>
                        {/* ... (rest of points logic is similar) */}
                        <div className="flex justify-between items-end mb-6">
                            <div>
                                <span className="text-3xl font-black text-blue-600">{customer.points}</span>
                                <span className="text-sm text-slate-500 ml-1">pts acumulados</span>
                            </div>
                            <Badge className={`${getTierColor(customer.tier)} font-bold`}>{customer.tier}</Badge>
                        </div>
                        
                        <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 bg-slate-50 dark:bg-slate-800/50">
                            <h4 className="text-xs font-bold uppercase text-slate-500 mb-3">Ajuste Manual de Puntos</h4>
                            <form onSubmit={handleAdjustPoints} className="space-y-3">
                                <div className="flex gap-2">
                                    <input 
                                        type="number" 
                                        value={adjustPoints} 
                                        onChange={(e) => setAdjustPoints(Number(e.target.value))}
                                        className="w-24 px-3 py-2 text-sm border rounded-md dark:bg-slate-900 dark:border-slate-700 font-mono"
                                        placeholder="+/-"
                                        required
                                    />
                                    <input 
                                        type="text" 
                                        value={adjustReason} 
                                        onChange={(e) => setAdjustReason(e.target.value)}
                                        className="flex-1 px-3 py-2 text-sm border rounded-md dark:bg-slate-900 dark:border-slate-700"
                                        placeholder="Motivo..."
                                        maxLength={100}
                                        required
                                    />
                                </div>
                                <Button type="submit" size="sm" className="w-full bg-slate-900 text-white" disabled={isAdjusting}>
                                    {isAdjusting ? 'Ajuntando...' : 'Aplicar Ajuste'}
                                </Button>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Panel Derecho: Historial y Detalles Contacto */}
                <div className="md:col-span-2 space-y-6">
                    {/* Detalles de contacto en Grid mini */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                            <span className="text-slate-500 text-xs block mb-1 uppercase font-bold tracking-tighter">Email</span>
                            <span className="font-medium dark:text-slate-200 truncate block">{customer.email || 'N/A'}</span>
                        </div>
                        <div>
                            <span className="text-slate-500 text-xs block mb-1 uppercase font-bold tracking-tighter">Teléfono</span>
                            <span className="font-medium dark:text-slate-200">{customer.phone || 'N/A'}</span>
                        </div>
                        <div>
                            <span className="text-slate-500 text-xs block mb-1 uppercase font-bold tracking-tighter">Empresa</span>
                            <span className="font-medium dark:text-slate-200 truncate block">{customer.company || 'N/A'}</span>
                        </div>
                        <div>
                            <span className="text-slate-500 text-xs block mb-1 uppercase font-bold tracking-tighter">RFC / ID Fisc.</span>
                            <span className="font-medium dark:text-slate-200 uppercase">{customer.taxId || 'N/A'}</span>
                        </div>
                    </div>

                    {/* Notas */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 border-l-4 border-l-blue-500">
                        <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-2">Notas del Cliente</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-line">
                            {customer.notes || 'Sin notas registradas.'}
                        </p>
                    </div>

                    {/* Historial de Compras */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                        <h3 className="font-bold flex items-center gap-2 mb-6 text-lg">
                            <History className="w-5 h-5 text-blue-500" />
                            Ventas a Crédito y Recientes
                        </h3>
                        {sales.length === 0 ? (
                            <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                <h4 className="font-bold text-slate-600 dark:text-slate-400">Sin compras registradas</h4>
                                <p className="text-sm text-slate-500 mt-1">Este cliente no ha realizado transacciones aún.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-slate-500 uppercase border-b border-slate-200 dark:border-slate-800">
                                        <tr>
                                            <th className="pb-3 text-left">Ticket</th>
                                            <th className="pb-3">Fecha</th>
                                            <th className="pb-3 text-center">Método</th>
                                            <th className="pb-3 text-center">Estado</th>
                                            <th className="pb-3 text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {sales.map(s => (
                                            <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="py-3 font-semibold">{s.saleNumber}</td>
                                                <td className="py-3 text-slate-500">{formatDate(s.createdAt || s.date)}</td>
                                                <td className="py-3 text-center">
                                                    <Badge variant="outline" className={`font-bold border-none ${s.paymentMethod === 'CREDIT' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'}`}>
                                                        {s.paymentMethod}
                                                    </Badge>
                                                </td>
                                                <td className="py-3 text-center">
                                                    <span className={`text-[10px] font-bold uppercase ${s.status === 'COMPLETED' ? 'text-green-600' : 'text-slate-400'}`}>
                                                        {s.status}
                                                    </span>
                                                </td>
                                                <td className="py-3 font-bold text-right dark:text-white font-mono">
                                                    {formatCurrency(Number(s.total))}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal de Abono */}
            {isPaymentModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800">
                        <h2 className="text-2xl font-bold mb-6">Registrar Abono</h2>
                        <form onSubmit={handleRegisterPayment} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-500 mb-1">Monto a abonar</label>
                                <input 
                                    type="number" 
                                    step="0.01"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl font-black text-2xl text-center font-mono focus:border-orange-500 focus:ring-0 outline-none"
                                    placeholder="0.00"
                                    autoFocus
                                    required
                                />
                                <p className="text-xs text-slate-400 mt-2">Saldo pendiente: {formatCurrency(Number(customer.balance))}</p>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-bold text-slate-500 mb-1">Método</label>
                                <select 
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                                >
                                    <option value="CASH">Efectivo</option>
                                    <option value="CARD">Tarjeta</option>
                                    <option value="TRANSFER">Transferencia</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-500 mb-1">Notas (Opcional)</label>
                                <textarea 
                                    value={paymentNotes}
                                    onChange={(e) => setPaymentNotes(e.target.value)}
                                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm h-20"
                                    placeholder="Ej: Pago parcial febrero"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button 
                                    type="button" 
                                    variant="ghost" 
                                    onClick={() => setIsPaymentModalOpen(false)}
                                    className="flex-1"
                                >
                                    Cancelar
                                </Button>
                                <Button 
                                    type="submit" 
                                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                                    disabled={isSubmittingPayment}
                                >
                                    {isSubmittingPayment ? 'Procesando...' : 'Confirmar Abono'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
