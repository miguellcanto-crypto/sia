'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { 
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { 
    DollarSign, 
    ShoppingCart, 
    AlertTriangle, 
    Download,
    CreditCard,
    ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import { DateRangePicker } from '@/components/admin/reports/DateRangePicker';
import { startOfDay, endOfDay, subDays } from 'date-fns';
import { exportToCSVTyped, exportToPDF } from '@/lib/exportUtils';


interface TopProduct {
    id: string;
    name: string;
    code: string;
    quantitySold: number;
    revenue: number;
}

interface PaymentMethod {
    method: string;
    total: number;
    count: number;
}

interface SalesData {
    summary: {
        totalRevenue: number;
        totalSalesCount: number;
        totalDiscount: number;
        averageTicket: number;
    };
    paymentMethods: PaymentMethod[];
    topProducts: TopProduct[];
}

export default function SalesReportPage() {
    const [dateRange, setDateRange] = useState({
        from: startOfDay(subDays(new Date(), 7)),
        to: endOfDay(new Date())
    });
    
    const [data, setData] = useState<SalesData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSalesData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                startDate: dateRange.from.toISOString(),
                endDate: dateRange.to.toISOString()
            });
            const res = await fetch(`/api/admin/reports/sales?${params}`);
            if (!res.ok) throw new Error('Error al cargar reporte de ventas');
            const json = await res.json();
            setData(json);
            setError(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSalesData();
    }, [dateRange]);

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
    };

    const handleExportCSV = () => {
        if (!data || data.topProducts.length === 0) return;
        exportToCSVTyped(
            data.topProducts,
            [
                { header: 'Código', dataKey: 'code' },
                { header: 'Nombre', dataKey: 'name' },
                { header: 'Cantidad Vendida', dataKey: 'quantitySold' },
                { header: 'Ingresos MXN', dataKey: 'revenue' },
            ],
            'productos_top_ventas'
        );
    };

    const handleExportPDF = () => {
        if (!data || data.topProducts.length === 0) return;
        exportToPDF(
            data.topProducts,
            [
                { header: 'Código', dataKey: 'code' },
                { header: 'Nombre', dataKey: 'name' },
                { header: 'Cantidad Vendida', dataKey: 'quantitySold' },
                { header: 'Ingresos', dataKey: 'revenue', format: (val) => formatMoney(val) },
            ],
            'Reporte de Productos Más Vendidos',
            'productos_top_ventas',
            `Resumen del ${dateRange.from.toLocaleDateString()} al ${dateRange.to.toLocaleDateString()}`
        );
    };

    // Renderizado de Estado Vacío
    const EmptyState = ({ message }: { message: string }) => (
        <div className="flex flex-col items-center justify-center p-8 text-slate-500 bg-slate-900/50 rounded-lg border border-slate-800 border-dashed">
            <AlertTriangle className="w-10 h-10 mb-4 text-slate-600" />
            <p className="text-sm font-medium">{message}</p>
            <p className="text-xs mt-1">Intenta con un rango temporal distinto.</p>
        </div>
    );

    return (
        <div className="p-8 space-y-6 bg-slate-950 min-h-screen text-slate-100 pb-20">
            {/* Cabecera */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <Link href="/admin/reports" className="flex items-center text-sm text-blue-500 hover:text-blue-400 mb-2">
                        <ArrowLeft className="w-4 h-4 mr-1" /> Volver al Resumen
                    </Link>
                    <h1 className="text-3xl font-bold tracking-tight">Reporte de Ventas</h1>
                    <p className="text-slate-400 mt-1">Análisis de ingresos, métodos de pago y rendimiento de productos.</p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 items-end sm:items-center">
                    <DateRangePicker 
                        dateRange={dateRange} 
                        onDateRangeChange={setDateRange} 
                    />
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleExportCSV} disabled={loading || !data?.topProducts.length} className="bg-slate-900 border-slate-800">
                            <Download className="w-4 h-4 mr-2" /> CSV
                        </Button>
                        <Button variant="outline" onClick={handleExportPDF} disabled={loading || !data?.topProducts.length} className="bg-slate-900 border-slate-800 text-blue-400 border-blue-900/50 hover:bg-blue-900/20">
                            <Download className="w-4 h-4 mr-2" /> PDF
                        </Button>
                    </div>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/50 text-red-500 rounded-lg">
                    {error}
                </div>
            )}

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Ingresos Totales', value: formatMoney(data?.summary.totalRevenue || 0), icon: DollarSign, color: 'text-emerald-400' },
                    { label: 'Cant. de Ventas', value: data?.summary.totalSalesCount || 0, icon: ShoppingCart, color: 'text-blue-400' },
                    { label: 'Ticket Promedio', value: formatMoney(data?.summary.averageTicket || 0), icon: CreditCard, color: 'text-amber-400' },
                    { label: 'Descuentos Totales', value: formatMoney(data?.summary.totalDiscount || 0), icon: DollarSign, color: 'text-red-400' },
                ].map((kpi, idx) => (
                    <Card key={idx} className="bg-slate-900 border-slate-800">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-slate-400">{kpi.label}</CardTitle>
                            <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                        </CardHeader>
                        <CardContent>
                            {loading ? <Skeleton className="h-8 w-1/2 bg-slate-800" /> : (
                                <div className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="bg-slate-900 border-slate-800 lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-lg">Top 10 Productos Más Vendidos</CardTitle>
                        <CardDescription className="text-slate-400">Por volumen de unidades en el período seleccionado.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="space-y-4">
                                {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-10 w-full bg-slate-800" />)}
                            </div>
                        ) : data?.topProducts.length === 0 ? (
                            <EmptyState message="No se encontraron ventas de productos en este rango de fechas." />
                        ) : (
                            <div className="rounded-md border border-slate-800 overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-slate-950">
                                        <TableRow className="border-slate-800 hover:bg-transparent">
                                            <TableHead className="text-slate-400 font-bold uppercase text-xs">Producto</TableHead>
                                            <TableHead className="text-slate-400 font-bold uppercase text-xs text-right">Cant.</TableHead>
                                            <TableHead className="text-slate-400 font-bold uppercase text-xs text-right">Ingresos</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data?.topProducts.map((p) => (
                                            <TableRow key={p.id} className="border-slate-800 hover:bg-slate-800/50">
                                                <TableCell className="font-medium text-slate-300">
                                                    <div>{p.name}</div>
                                                    <div className="text-[10px] text-slate-500 font-mono">{p.code}</div>
                                                </TableCell>
                                                <TableCell className="text-right text-blue-400 font-bold">{p.quantitySold}</TableCell>
                                                <TableCell className="text-right text-emerald-400 font-medium">{formatMoney(p.revenue)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader>
                        <CardTitle className="text-lg">Desglose por Pago</CardTitle>
                        <CardDescription className="text-slate-400">Métodos más utilizados.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                             <div className="space-y-4">
                                {[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full bg-slate-800" />)}
                            </div>
                        ) : data?.paymentMethods.length === 0 ? (
                            <EmptyState message="Sin datos de pago" />
                        ) : (
                            <div className="space-y-4">
                                {data?.paymentMethods.sort((a,b)=> b.total - a.total).map((m) => (
                                    <div key={m.method} className="flex flex-col space-y-2 p-3 bg-slate-950 rounded-lg border border-slate-800">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-semibold uppercase text-slate-300">{m.method}</span>
                                            <span className="text-sm font-bold text-emerald-400">{formatMoney(m.total)}</span>
                                        </div>
                                        <div className="w-full bg-slate-800 rounded-full h-1.5">
                                            <div 
                                                className="bg-blue-500 h-1.5 rounded-full" 
                                                style={{ width: `${(m.total / (data.summary.totalRevenue || 1)) * 100}%` }}
                                            />
                                        </div>
                                        <div className="text-[10px] text-slate-500 text-right">{m.count} transacciones</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
