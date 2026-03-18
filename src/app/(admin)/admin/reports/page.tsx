'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { 
    DollarSign, 
    ShoppingCart, 
    AlertTriangle, 
    PiggyBank, 
    CreditCard, 
    Landmark,
    PackageSearch,
    Fish,
    ArrowRight
} from 'lucide-react';
import Link from 'next/link';


interface SummaryData {
    sales: {
        todayRevenue: number;
        todayReceivable: number;
        todaySalesCount: number;
        totalPendingCredit: number;
    };
    cash: {
        activeSessionsCount: number;
    };
    inventory: {
        lowStockAlertsCount: number;
    };
}

export default function ReportsDashboard() {
    const [data, setData] = useState<SummaryData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const res = await fetch('/api/admin/reports/summary');
                if (!res.ok) throw new Error('Error al cargar métricas del día');
                const json = await res.json();
                setData(json);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchSummary();
    }, []);

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
    };

    if (error) {
        return (
            <div className="p-8 text-center text-red-500 bg-slate-950 min-h-screen pt-20">
                <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
                <h2 className="text-xl font-bold">{error}</h2>
                <Button className="mt-4" onClick={() => window.location.reload()}>Reintentar</Button>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 bg-slate-950 min-h-screen text-slate-100 pb-20">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Panel de Reportes</h1>
                <p className="text-slate-400 mt-2">Visión general del estado del negocio en tiempo real.</p>
            </div>

            {/* KPIs Principales (Hoy) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-400">Hoy en Caja</CardTitle>
                        <DollarSign className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        {loading ? <Skeleton className="h-8 w-1/2 bg-slate-800" /> : (
                            <>
                                <div className="text-3xl font-bold text-emerald-400">{formatMoney(data?.sales.todayRevenue || 0)}</div>
                                <p className="text-xs text-slate-500 mt-1">Ingreso líquido real</p>
                            </>
                        )}
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-400">Venta a Crédito</CardTitle>
                        <Landmark className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        {loading ? <Skeleton className="h-8 w-1/2 bg-slate-800" /> : (
                            <>
                                <div className="text-3xl font-bold text-orange-400">{formatMoney(data?.sales.todayReceivable || 0)}</div>
                                <p className="text-xs text-slate-500 mt-1">Pendiente por cobrar</p>
                            </>
                        )}
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-400">Total por Cobrar</CardTitle>
                        <PiggyBank className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        {loading ? <Skeleton className="h-8 w-1/2 bg-slate-800" /> : (
                            <div className="text-3xl font-bold text-amber-400">{formatMoney(data?.sales.totalPendingCredit || 0)}</div>
                        )}
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-400">Tickets del Día</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        {loading ? <Skeleton className="h-8 w-1/2 bg-slate-800" /> : (
                            <div className="text-3xl font-bold text-blue-400">{data?.sales.todaySalesCount || 0}</div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Módulos de Reportes */}
            <h2 className="text-2xl font-semibold mt-10 mb-4 text-slate-200">Módulos Detallados</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* Ventas */}
                <Link href="/admin/reports/sales" className="group">
                    <Card className="bg-slate-900 border-slate-800 hover:border-blue-500/50 transition-colors h-full flex flex-col cursor-pointer">
                        <CardHeader>
                            <ShoppingCart className="w-8 h-8 text-blue-400 mb-2" />
                            <CardTitle className="text-lg text-white group-hover:text-blue-400 transition-colors">Ventas y Rendimiento</CardTitle>
                            <CardDescription className="text-slate-400">
                                Explora métricas de ventas, desglose por métodos de pago y analiza comparativas de períodos.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="mt-auto flex justify-end">
                            <Button variant="ghost" className="text-blue-400 p-0 hover:bg-transparent hover:text-blue-300">
                                Ver Reporte <ArrowRight className="ml-2 w-4 h-4" />
                            </Button>
                        </CardContent>
                    </Card>
                </Link>

                {/* Caja */}
                <Link href="/admin/reports/cash" className="group">
                    <Card className="bg-slate-900 border-slate-800 hover:border-emerald-500/50 transition-colors h-full flex flex-col cursor-pointer">
                        <CardHeader>
                            <PiggyBank className="w-8 h-8 text-emerald-400 mb-2" />
                            <CardTitle className="text-lg text-white group-hover:text-emerald-400 transition-colors">Arqueo y Flujo de Caja</CardTitle>
                            <CardDescription className="text-slate-400">
                                Monitorea los cortes diarios, ingresos, egresos manuales y discrepancias de cajeros.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="mt-auto flex justify-end">
                            <Button variant="ghost" className="text-emerald-400 p-0 hover:bg-transparent hover:text-emerald-300">
                                Ver Arqueos <ArrowRight className="ml-2 w-4 h-4" />
                            </Button>
                        </CardContent>
                    </Card>
                </Link>

                {/* Inventario */}
                <Link href="/admin/reports/inventory" className="group">
                    <Card className="bg-slate-900 border-slate-800 hover:border-amber-500/50 transition-colors h-full flex flex-col cursor-pointer">
                        <CardHeader>
                            <PackageSearch className="w-8 h-8 text-amber-400 mb-2" />
                            <CardTitle className="text-lg text-white group-hover:text-amber-400 transition-colors">Inventario y Stock</CardTitle>
                            <CardDescription className="text-slate-400">
                                Analiza el valor total del almacén, distribución por categoría y alertas tempranas de desabastecimiento.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="mt-auto flex justify-end">
                            <Button variant="ghost" className="text-amber-400 p-0 hover:bg-transparent hover:text-amber-300">
                                Ver Stock <ArrowRight className="ml-2 w-4 h-4" />
                            </Button>
                        </CardContent>
                    </Card>
                </Link>

                {/* Especial Mariscos */}
                <Link href="/admin/reports/seafood" className="group">
                    <Card className="bg-slate-900 border-slate-800 hover:border-indigo-500/50 transition-colors h-full flex flex-col cursor-pointer">
                        <CardHeader>
                            <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center mb-2">
                                <Fish className="w-5 h-5 text-indigo-400" />
                            </div>
                            <CardTitle className="text-lg text-white group-hover:text-indigo-400 transition-colors">Rotación de Mariscos</CardTitle>
                            <CardDescription className="text-slate-400">
                                Reportes específicos de perecederos: detección de stock inactivo y productos de baja rotación en riesgo.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="mt-auto flex justify-end">
                            <Button variant="ghost" className="text-indigo-400 p-0 hover:bg-transparent hover:text-indigo-300">
                                Analizar Rotación <ArrowRight className="ml-2 w-4 h-4" />
                            </Button>
                        </CardContent>
                    </Card>
                </Link>

                {/* Cartera Vencida (Cuentas por Cobrar) */}
                <Link href="/admin/reports/receivables" className="group">
                    <Card className="bg-slate-900 border-slate-800 hover:border-orange-500/50 transition-colors h-full flex flex-col cursor-pointer">
                        <CardHeader>
                            <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center mb-2">
                                <PiggyBank className="w-5 h-5 text-orange-400" />
                            </div>
                            <CardTitle className="text-lg text-white group-hover:text-orange-400 transition-colors">Cartera Vencida (Cxc)</CardTitle>
                            <CardDescription className="text-slate-400">
                                Monitorea saldos pendientes de clientes, límites de crédito y antigüedad de deudas.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="mt-auto flex justify-end">
                            <Button variant="ghost" className="text-orange-400 p-0 hover:bg-transparent hover:text-orange-300">
                                Gestionar Cartera <ArrowRight className="ml-2 w-4 h-4" />
                            </Button>
                        </CardContent>
                    </Card>
                </Link>

                {/* Acceso Rápido: Corte del Día */}
                <Link href="/admin/reports/cash/daily-cutoff" className="group">
                    <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 hover:border-white/20 transition-colors h-full flex flex-col cursor-pointer shadow-lg shadow-black/40">
                        <CardHeader>
                            <DollarSign className="w-8 h-8 text-white mb-2" />
                            <CardTitle className="text-lg text-white">Generar Corte Diario</CardTitle>
                            <CardDescription className="text-slate-300">
                                Exporta al instante el desglose de ventas de la caja actual para cierre de turno nocturno.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="mt-auto flex justify-end">
                            <Button variant="outline" className="text-white border-white/20 bg-white/5 hover:bg-white/10">
                                Ver Corte de Hoy  <ArrowRight className="ml-2 w-4 h-4" />
                            </Button>
                        </CardContent>
                    </Card>
                </Link>

            </div>
        </div>
    );
}
