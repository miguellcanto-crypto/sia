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
    PackageOpen, 
    AlertTriangle, 
    Download,
    Tags,
    ArrowLeft,
    TrendingUp,
    FileJson
} from 'lucide-react';
import Link from 'next/link';
import { exportToCSVTyped, exportToPDF } from '@/lib/exportUtils';


interface CategoryDist {
    id: string;
    name: string;
    productsCount: number;
    totalStock: number;
}

interface LowStockItem {
    id: string;
    name: string;
    code: string;
    stock: number;
    minStock: number;
}

interface InventoryData {
    valuation: {
        totalCostValuation: number;
        totalPriceValuation: number;
        potentialProfit: number;
        totalItemsInStock: number;
    };
    categoryDistribution: CategoryDist[];
    lowStockItems: LowStockItem[];
}

export default function InventoryReportPage() {
    const [data, setData] = useState<InventoryData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchInventoryData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/reports/inventory');
            if (!res.ok) throw new Error('Error al cargar reporte de inventario');
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
        fetchInventoryData();
    }, []);

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
    };

    const handleExportAlertsCSV = () => {
        if (!data || data.lowStockItems.length === 0) return;
        exportToCSVTyped(
            data.lowStockItems,
            [
                { header: 'Código', dataKey: 'code' },
                { header: 'Nombre', dataKey: 'name' },
                { header: 'Stock Actual', dataKey: 'stock' },
                { header: 'Mínimo Permitido', dataKey: 'minStock' },
            ],
            'alertas_stock_bajo'
        );
    };

    const handleExportAlertsPDF = () => {
        if (!data || data.lowStockItems.length === 0) return;
        exportToPDF(
            data.lowStockItems,
            [
                { header: 'Código', dataKey: 'code' },
                { header: 'Nombre', dataKey: 'name' },
                { header: 'Stock Actual', dataKey: 'stock' },
                { header: 'Stock Mínimo', dataKey: 'minStock' },
            ],
            'Reporte de Alertas de Stock Bajo',
            'alertas_stock_bajo',
            'Productos por debajo de su umbral de seguridad'
        );
    };

    const EmptyState = ({ message }: { message: string }) => (
        <div className="flex flex-col items-center justify-center p-8 text-slate-500 bg-slate-900/50 rounded-lg border border-slate-800 border-dashed">
            <PackageOpen className="w-10 h-10 mb-4 text-slate-600" />
            <p className="text-sm font-medium">{message}</p>
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
                    <h1 className="text-3xl font-bold tracking-tight">Reporte de Inventario</h1>
                    <p className="text-slate-400 mt-1">Valoración económica del almacén y alertas de desabastecimiento.</p>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/50 text-red-500 rounded-lg">
                    {error}
                </div>
            )}

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-400">Total Artículos Físicos</CardTitle>
                        <PackageOpen className="h-4 w-4 text-blue-400" />
                    </CardHeader>
                    <CardContent>
                        {loading ? <Skeleton className="h-8 w-1/2 bg-slate-800" /> : (
                            <div className="text-2xl font-bold text-blue-400">{data?.valuation.totalItemsInStock || 0}</div>
                        )}
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-400">Costo Almacenado</CardTitle>
                        <TrendingUp className="h-4 w-4 text-orange-400" />
                    </CardHeader>
                    <CardContent>
                        {loading ? <Skeleton className="h-8 w-1/2 bg-slate-800" /> : (
                            <div className="text-2xl font-bold text-orange-400">{formatMoney(data?.valuation.totalCostValuation || 0)}</div>
                        )}
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-400">Valor de Venta Comercial</CardTitle>
                        <TrendingUp className="h-4 w-4 text-emerald-400" />
                    </CardHeader>
                    <CardContent>
                        {loading ? <Skeleton className="h-8 w-1/2 bg-slate-800" /> : (
                            <div className="text-2xl font-bold text-emerald-400">{formatMoney(data?.valuation.totalPriceValuation || 0)}</div>
                        )}
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800 opacity-80">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-400">Rentabilidad Potencial Bruta</CardTitle>
                        <TrendingUp className="h-4 w-4 text-purple-400" />
                    </CardHeader>
                    <CardContent>
                        {loading ? <Skeleton className="h-8 w-1/2 bg-slate-800" /> : (
                            <div className="text-2xl font-bold text-purple-400">{formatMoney(data?.valuation.potentialProfit || 0)}</div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Alertas de Stock */}
                <Card className="bg-slate-900 border-slate-800 lg:col-span-2 flex flex-col">
                    <CardHeader className="flex flex-row items-start justify-between">
                        <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-red-500" />
                                Alertas de Stock Bajo
                            </CardTitle>
                            <CardDescription className="text-slate-400">Productos por debajo de su umbral configurado.</CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={handleExportAlertsCSV} disabled={loading || !data?.lowStockItems.length} className="text-slate-400 hover:text-white">
                                <FileJson className="w-4 h-4 mr-1" /> CSV
                            </Button>
                            <Button variant="ghost" size="sm" onClick={handleExportAlertsPDF} disabled={loading || !data?.lowStockItems.length} className="text-red-400 hover:bg-red-950/30">
                                <Download className="w-4 h-4 mr-1" /> PDF
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1">
                        {loading ? (
                            <div className="space-y-4">
                                {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-10 w-full bg-slate-800" />)}
                            </div>
                        ) : data?.lowStockItems.length === 0 ? (
                            <EmptyState message="¡Excelente! No hay productos con stock bajo en este momento." />
                        ) : (
                            <div className="rounded-md border border-slate-800 overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-slate-950">
                                        <TableRow className="border-slate-800 hover:bg-transparent">
                                            <TableHead className="text-slate-400 font-bold uppercase text-xs">Producto</TableHead>
                                            <TableHead className="text-slate-400 font-bold uppercase text-xs text-right">Mínimo</TableHead>
                                            <TableHead className="text-slate-400 font-bold uppercase text-xs text-right text-red-400">Actual</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data?.lowStockItems.map((p) => (
                                            <TableRow key={p.id} className="border-slate-800 hover:bg-slate-800/50">
                                                <TableCell className="font-medium text-slate-300">
                                                    <div>{p.name}</div>
                                                    <div className="text-[10px] text-slate-500 font-mono">{p.code}</div>
                                                </TableCell>
                                                <TableCell className="text-right text-slate-400 font-medium">{p.minStock}</TableCell>
                                                <TableCell className="text-right text-red-400 font-bold">{p.stock}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Distribución de Categorías */}
                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Tags className="w-5 h-5 text-blue-400" />
                            Distribución Comercial
                        </CardTitle>
                        <CardDescription className="text-slate-400">Stock físico por categoría principal.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                             <div className="space-y-4">
                                {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full bg-slate-800" />)}
                            </div>
                        ) : data?.categoryDistribution.length === 0 ? (
                            <EmptyState message="Sin distribución de categorías registradas." />
                        ) : (
                            <div className="space-y-4">
                                {data?.categoryDistribution.map((c) => (
                                    <div key={c.id} className="flex flex-col space-y-2 p-3 bg-slate-950 rounded-lg border border-slate-800">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-semibold text-slate-300">{c.name}</span>
                                            <span className="text-sm font-bold text-blue-400">{c.totalStock} u.</span>
                                        </div>
                                        <div className="w-full bg-slate-800 rounded-full h-1.5">
                                            <div 
                                                className="bg-indigo-500 h-1.5 rounded-full" 
                                                style={{ width: `${(c.totalStock / (data.valuation.totalItemsInStock || 1)) * 100}%` }}
                                            />
                                        </div>
                                        <div className="text-[10px] text-slate-500 text-right">{c.productsCount} productos distintos</div>
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
