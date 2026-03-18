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
    PiggyBank, 
    Users, 
    AlertTriangle, 
    Download,
    ArrowLeft,
    ChevronRight,
    Phone
} from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import { Progress } from '@/components/ui/progress'; // Re-verifying component existence

interface Debtor {
    id: string;
    code: string;
    name: string;
    balance: number;
    creditLimit: number;
    usagePercent: number;
    phone: string | null;
    updatedAt: string;
}

interface ReceivableData {
    summary: {
        totalPendingAmount: number;
        debtorCount: number;
    };
    debtors: Debtor[];
}

export default function ReceivablesPage() {
    const [data, setData] = useState<ReceivableData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchReceivables = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/reports/receivables');
            if (!res.ok) throw new Error('Error al cargar reporte de cartera');
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
        fetchReceivables();
    }, []);

    return (
        <div className="p-8 space-y-6 bg-slate-950 min-h-screen text-slate-100 pb-20">
            {/* Cabecera */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <Link href="/admin/reports" className="flex items-center text-sm text-blue-500 hover:text-blue-400 mb-2">
                        <ArrowLeft className="w-4 h-4 mr-1" /> Volver al Resumen
                    </Link>
                    <h1 className="text-3xl font-bold tracking-tight text-white uppercase">Cartera Vencida</h1>
                    <p className="text-slate-400 mt-1">Monitoreo de deudas pendientes por cobrar y uso de límites de crédito.</p>
                </div>
                
                <Button variant="outline" className="bg-slate-900 border-slate-800">
                    <Download className="w-4 h-4 mr-2" /> Exportar Reporte
                </Button>
            </div>

            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/50 text-red-500 rounded-lg">
                    {error}
                </div>
            )}

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-400">Total por Cobrar</CardTitle>
                        <PiggyBank className="h-4 w-4 text-emerald-400" />
                    </CardHeader>
                    <CardContent>
                        {loading ? <Skeleton className="h-8 w-1/2 bg-slate-800" /> : (
                            <div className="text-3xl font-bold text-emerald-400">
                                {formatCurrency(data?.summary.totalPendingAmount || 0)}
                            </div>
                        )}
                        <p className="text-xs text-slate-500 mt-1">Suma acumulada de todas las deudas</p>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-400">Clientes con Deuda</CardTitle>
                        <Users className="h-4 w-4 text-blue-400" />
                    </CardHeader>
                    <CardContent>
                        {loading ? <Skeleton className="h-8 w-1/2 bg-slate-800" /> : (
                            <div className="text-3xl font-bold text-blue-400">
                                {data?.summary.debtorCount || 0}
                            </div>
                        )}
                        <p className="text-xs text-slate-500 mt-1">Personas registradas con saldo pendiente</p>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-400">Exceso de Límite</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-orange-400" />
                    </CardHeader>
                    <CardContent>
                        {loading ? <Skeleton className="h-8 w-1/2 bg-slate-800" /> : (
                            <div className="text-3xl font-bold text-orange-400">
                                {data?.debtors.filter(d => d.usagePercent >= 90).length || 0}
                            </div>
                        )}
                        <p className="text-xs text-slate-500 mt-1">Clientes arriba del 90% de su crédito</p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabla de Deudores */}
            <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                    <CardTitle className="text-lg">Desglose por Cliente</CardTitle>
                    <CardDescription className="text-slate-400">Ordenados de mayor a menor deuda.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-10 w-full bg-slate-800" />)}
                        </div>
                    ) : !data || data.debtors.length === 0 ? (
                        <div className="text-center py-10 text-slate-500">
                            No hay saldos pendientes en este momento.
                        </div>
                    ) : (
                        <div className="rounded-md border border-slate-800 overflow-hidden">
                            <Table>
                                <TableHeader className="bg-slate-950/50">
                                    <TableRow className="border-slate-800 hover:bg-transparent">
                                        <TableHead className="text-slate-400 font-bold uppercase text-xs">Cliente</TableHead>
                                        <TableHead className="text-slate-400 font-bold uppercase text-xs text-right">Saldo</TableHead>
                                        <TableHead className="text-slate-400 font-bold uppercase text-xs w-[250px]">Crédito Usado</TableHead>
                                        <TableHead className="text-slate-400 font-bold uppercase text-xs text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.debtors.map((d) => (
                                        <TableRow key={d.id} className="border-slate-800 hover:bg-slate-800/50">
                                            <TableCell className="font-medium text-slate-300">
                                                <div className="flex flex-col">
                                                    <span className="text-white font-bold">{d.name}</span>
                                                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                                        <span>{d.code}</span>
                                                        {d.phone && (
                                                            <span className="flex items-center gap-1">
                                                                <Phone className="w-2.5 h-2.5" /> {d.phone}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-lg font-black text-emerald-400">{formatCurrency(d.balance)}</span>
                                                    <span className="text-[10px] text-slate-500">Límite: {formatCurrency(d.creditLimit)}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1.5">
                                                    <div className="flex justify-between text-[10px] font-bold">
                                                        <span className={d.usagePercent >= 90 ? 'text-red-500' : 'text-slate-500'}>
                                                            {d.usagePercent.toFixed(1)}%
                                                        </span>
                                                    </div>
                                                    <Progress 
                                                        value={d.usagePercent} 
                                                        className={`h-1.5 bg-slate-800 ${d.usagePercent >= 90 ? 'text-red-500' : d.usagePercent >= 75 ? 'text-amber-500' : 'text-blue-500'}`}
                                                    />
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Link href={`/customers/${d.id}`}>
                                                    <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10">
                                                        Detalles <ChevronRight className="ml-1 w-4 h-4" />
                                                    </Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
