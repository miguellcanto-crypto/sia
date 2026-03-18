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
    const [isLoading, setIsLoading] = useState(true);
    
    // Ajuste manual de puntos
    const [adjustPoints, setAdjustPoints] = useState(0);
    const [adjustReason, setAdjustReason] = useState('');
    const [isAdjusting, setIsAdjusting] = useState(false);

    const fetchCustomer = async () => {
        if (!customerId) return;
        
        try {
            const [custRes, salesRes] = await Promise.all([
                fetch(`/api/customers/${customerId}`),
                fetch(`/api/customers/${customerId}/sales?limit=20`)
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
        } catch (error) {
            toast.error('Error al cargar datos del cliente');
        } finally {
            setIsLoading(false);
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
                        <h3 className="font-bold flex items-center gap-2 mb-4">
                            <Star className="w-5 h-5 text-amber-500" />
                            Programa de Lealtad (Puntos)
                        </h3>
                        <div className="flex justify-between items-end mb-6">
                            <div>
                                <span className="text-3xl font-black text-blue-600">{customer.points}</span>
                                <span className="text-sm text-slate-500 ml-1">pts acumulados</span>
                            </div>
                            <Badge className={`${getTierColor(customer.tier)} font-bold`}>{customer.tier}</Badge>
                        </div>
                        
                        <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 bg-slate-50 dark:bg-slate-800/50">
                            <h4 className="text-xs font-bold uppercase text-slate-500 mb-3">Ajuste Manual</h4>
                            <form onSubmit={handleAdjustPoints} className="space-y-3">
                                <div className="flex gap-2">
                                    <input 
                                        type="number" 
                                        value={adjustPoints} 
                                        onChange={(e) => setAdjustPoints(Number(e.target.value))}
                                        className="w-24 px-3 py-2 text-sm border rounded-md dark:bg-slate-900 dark:border-slate-700"
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

                        {/* Historial rápido de puntos */}
                        <div className="mt-6">
                            <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">Últimos Movimientos</h4>
                            <div className="space-y-3">
                                {customer.pointHistory?.length === 0 ? (
                                    <p className="text-xs text-slate-500 italic">No hay historial</p>
                                ) : (
                                    customer.pointHistory?.map((ph: any) => (
                                        <div key={ph.id} className="flex justify-between text-sm py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                                            <div>
                                                <p className="font-medium dark:text-slate-300 line-clamp-1">{ph.reason}</p>
                                                <p className="text-[10px] text-slate-500">{new Date(ph.createdAt).toLocaleDateString()}</p>
                                            </div>
                                            <span className={`font-bold ${ph.points >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                {ph.points > 0 ? '+' : ''}{ph.points}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Panel Derecho: Historial y Detalles Contacto */}
                <div className="md:col-span-2 space-y-6">
                    {/* Detalles de contacto en Grid mini */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                            <span className="text-slate-500 text-xs block mb-1">Email</span>
                            <span className="font-medium dark:text-slate-200">{customer.email || 'N/A'}</span>
                        </div>
                        <div>
                            <span className="text-slate-500 text-xs block mb-1">Teléfono</span>
                            <span className="font-medium dark:text-slate-200">{customer.phone || 'N/A'}</span>
                        </div>
                        <div>
                            <span className="text-slate-500 text-xs block mb-1">Empresa</span>
                            <span className="font-medium dark:text-slate-200">{customer.company || 'N/A'}</span>
                        </div>
                        <div>
                            <span className="text-slate-500 text-xs block mb-1">RFC / ID Fisc.</span>
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
                            Historial de Compras Recientes
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
                                            <th className="pb-3">Artículos</th>
                                            <th className="pb-3">Estado</th>
                                            <th className="pb-3 text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {sales.map(s => (
                                            <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                <td className="py-3 font-semibold">{s.saleNumber}</td>
                                                <td className="py-3 text-slate-500">{formatDate(s.createdAt || s.date)}</td>
                                                <td className="py-3 text-slate-500">{s.items?.length || 0} prod.</td>
                                                <td className="py-3">
                                                    <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 border-none pointer-events-none">
                                                        {s.status}
                                                    </Badge>
                                                </td>
                                                <td className="py-3 font-bold text-right dark:text-white">
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
        </div>
    );
}
