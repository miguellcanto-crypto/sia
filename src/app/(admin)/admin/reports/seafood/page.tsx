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
    Fish, 
    AlertOctagon, 
    TrendingDown,
    ArrowLeft,
    Download
} from 'lucide-react';
import Link from 'next/link';
import { exportToCSVTyped, exportToPDF } from '@/lib/exportUtils';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SeafoodProduct {
    id: string;
    name: string;
    code: string;
    stock: number;
    price: string;
    cost: string;
    quantitySold: number;
    potentialLoss?: number;
    rotationRisk?: string;
}

interface SeafoodData {
    period: {
        days: number;
        startDate: string;
        endDate: string;
    };
    inactive: {
        count: number;
        items: SeafoodProduct[];
    };
    lowRotation: {
        count: number;
        threshold: number;
        items: SeafoodProduct[];
    };
}

export default function SeafoodReportPage() {
    const [days, setDays] = useState('7');
    const [data, setData] = useState<SeafoodData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSeafoodData = async (d: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/reports/seafood?days=${d}`);
            if (!res.ok) throw new Error('Error al cargar reporte de rotación de mariscos');
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
        fetchSeafoodData(days);
    }, [days]);

    const formatMoney = (amount: number | string) => {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(amount));
    };

    const handleExportCSV = (type: 'inactive' | 'low') => {
        if (!data) return;
        const items = type === 'inactive' ? data.inactive.items : data.lowRotation.items;
        if (items.length === 0) return;
        
        exportToCSVTyped(
            items,
            [
                { header: 'Código', dataKey: 'code' },
                { header: 'Nombre', dataKey: 'name' },
                { header: 'Stock Básico', dataKey: 'stock' },
                { header: 'Vendidos', dataKey: 'quantitySold' },
                { header: 'Pérdida/Riesgo', dataKey: type === 'inactive' ? 'potentialLoss' : 'rotationRisk' },
            ],
            type === 'inactive' ? 'mariscos_sin_movimiento' : 'mariscos_baja_rotacion'
        );
    };

    const EmptyState = ({ message }: { message: string }) => (
        <div className="flex flex-col items-center justify-center p-8 text-slate-500 bg-slate-900/50 rounded-lg border border-slate-800 border-dashed">
            <Fish className="w-10 h-10 mb-4 text-emerald-600/50" />
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
                    <h1 className="text-3xl font-bold tracking-tight">Rotación de Mariscos y Perecederos</h1>
                    <p className="text-slate-400 mt-1">Detección estructurada de mermas potenciales y artículos sin flujo.</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-500 uppercase">Período Límite:</span>
                    <Select value={days} onValueChange={setDays}>
                        <SelectTrigger className="w-[180px] bg-slate-900 border-slate-800 text-slate-100">
                            <SelectValue placeholder="Rango de días" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                            <SelectItem value="3">Últimos 3 días</SelectItem>
                            <SelectItem value="7">Últimos 7 días</SelectItem>
                            <SelectItem value="15">Últimos 15 días</SelectItem>
                            <SelectItem value="30">Últimos 30 días</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/50 text-red-500 rounded-lg">
                    {error}
                </div>
            )}

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-slate-900 border-rose-900/50">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-400">Stock Crítico o Sin Mover (Rotación Cero)</CardTitle>
                        <AlertOctagon className="h-4 w-4 text-rose-500" />
                    </CardHeader>
                    <CardContent>
                        {loading ? <Skeleton className="h-8 w-1/3 bg-slate-800" /> : (
                            <div className="text-3xl font-bold text-rose-400">{data?.inactive.count || 0} productos</div>
                        )}
                        <p className="text-xs text-slate-500 mt-1">Riesgo inminente de pérdida física.</p>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-amber-900/50">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-400">Rotación Lenta (Menos de {data?.lowRotation.threshold || 5} unidades)</CardTitle>
                        <TrendingDown className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        {loading ? <Skeleton className="h-8 w-1/3 bg-slate-800" /> : (
                            <div className="text-3xl font-bold text-amber-400">{data?.lowRotation.count || 0} productos</div>
                        )}
                        <p className="text-xs text-slate-500 mt-1">Se recomienda impulsar mediante promociones u ofertas flash.</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Tabla Inactivos */}
                <Card className="bg-slate-900 border-red-900/50 shadow-[0_0_15px_rgba(225,29,72,0.1)]">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div>
                            <CardTitle className="text-lg text-rose-400">Productos Estancados</CardTitle>
                            <CardDescription className="text-slate-400">No han vendido nada en el período.</CardDescription>
                        </div>
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white" onClick={() => handleExportCSV('inactive')} disabled={loading || !data?.inactive.count}>
                            <Download className="w-4 h-4" />
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="space-y-4">
                                {[1,2,3,4].map(i => <Skeleton key={i} className="h-10 w-full bg-slate-800" />)}
                            </div>
                        ) : data?.inactive.items.length === 0 ? (
                            <EmptyState message="Buen flujo: Todos los productos se movieron al menos 1 unidad." />
                        ) : (
                            <div className="rounded-md border border-slate-800 overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-slate-950">
                                        <TableRow className="border-slate-800 hover:bg-transparent">
                                            <TableHead className="text-slate-400 text-xs">Producto</TableHead>
                                            <TableHead className="text-slate-400 text-xs text-center">Stock</TableHead>
                                            <TableHead className="text-rose-400 text-xs text-right">Pérdida Mínima Fija</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data?.inactive.items.map((p) => (
                                            <TableRow key={p.id} className="border-slate-800 hover:bg-slate-800/50">
                                                <TableCell className="font-medium text-slate-300">
                                                    <div>{p.name}</div>
                                                    <div className="text-[10px] text-slate-500 font-mono">{p.code}</div>
                                                </TableCell>
                                                <TableCell className="text-center font-bold text-amber-500">{p.stock}</TableCell>
                                                <TableCell className="text-right text-rose-400 font-bold">{formatMoney(p.potentialLoss || 0)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Tabla Baja Rotación */}
                <Card className="bg-slate-900 border-amber-900/50">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div>
                            <CardTitle className="text-lg text-amber-500">Baja Rotación Comercial</CardTitle>
                            <CardDescription className="text-slate-400">Vendieron por debajo del límite sugerido.</CardDescription>
                        </div>
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white" onClick={() => handleExportCSV('low')} disabled={loading || !data?.lowRotation.count}>
                            <Download className="w-4 h-4" />
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="space-y-4">
                                {[1,2,3,4].map(i => <Skeleton key={i} className="h-10 w-full bg-slate-800" />)}
                            </div>
                        ) : data?.lowRotation.items.length === 0 ? (
                            <EmptyState message="Buen ritmo: Todos están por encima del umbral de rotación." />
                        ) : (
                            <div className="rounded-md border border-slate-800 overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-slate-950">
                                        <TableRow className="border-slate-800 hover:bg-transparent">
                                            <TableHead className="text-slate-400 text-xs">Producto</TableHead>
                                            <TableHead className="text-slate-400 text-xs text-center">Stock Fís.</TableHead>
                                            <TableHead className="text-amber-500 text-xs text-right">Desplazados</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data?.lowRotation.items.map((p) => (
                                            <TableRow key={p.id} className="border-slate-800 hover:bg-slate-800/50">
                                                <TableCell className="font-medium text-slate-300">
                                                    <div>{p.name}</div>
                                                    <div className="text-[10px] text-slate-500 font-mono">{p.code}</div>
                                                </TableCell>
                                                <TableCell className="text-center font-bold text-slate-300">{p.stock}</TableCell>
                                                <TableCell className="text-right text-amber-500 font-bold">{p.quantitySold}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
