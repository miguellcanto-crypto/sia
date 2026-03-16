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
    ArrowLeft,
    Download,
    AlertCircle,
    Scale,
    Wallet
} from 'lucide-react';
import Link from 'next/link';
import { DateRangePicker } from '@/components/admin/reports/DateRangePicker';
import { startOfDay, endOfDay, subDays } from 'date-fns';
import { exportToCSVTyped, exportToPDF } from '@/lib/exportUtils';
import { Badge } from '@/components/ui/badge';

import { useRouter } from 'next/navigation';

interface CashSessionData {
    id: string;
    openedAt: string;
    closedAt: string | null;
    status: string;
    cashierName: string;
    registerName: string;
    openingAmount: number;
    expectedAmount: number;
    closingAmount: number;
    difference: number;
    salesCount: number;
}

interface CashFlowData {
    overview: {
        totalSessionsCount: number;
        totalExpected: number;
        totalClosed: number;
        totalDiscrepancy: number;
        averageDiscrepancy: number;
        discrepancieSessionsCount: number;
    };
    sessions: CashSessionData[];
}

export default function CashReportPage() {
    const router = useRouter();
    const [dateRange, setDateRange] = useState({
        from: startOfDay(subDays(new Date(), 7)),
        to: endOfDay(new Date())
    });
    
    const [data, setData] = useState<CashFlowData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCashData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                startDate: dateRange.from.toISOString(),
                endDate: dateRange.to.toISOString()
            });
            const res = await fetch(`/api/admin/reports/cash?${params}`);
            if (!res.ok) throw new Error('Error al cargar reporte de caja');
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
        fetchCashData();
    }, [dateRange]);

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
    };

    const handleExportCSV = () => {
        if (!data || data.sessions.length === 0) return;
        exportToCSVTyped(
            data.sessions.map(s => ({
                ...s,
                openedAt: new Date(s.openedAt).toLocaleString(),
                closedAt: s.closedAt ? new Date(s.closedAt).toLocaleString() : 'N/A'
            })),
            [
                { header: 'Caja', dataKey: 'registerName' },
                { header: 'Cajero', dataKey: 'cashierName' },
                { header: 'Apertura', dataKey: 'openedAt' },
                { header: 'Cierre', dataKey: 'closedAt' },
                { header: 'Monto Inicial', dataKey: 'openingAmount' },
                { header: 'Esperado en Sistema', dataKey: 'expectedAmount' },
                { header: 'Contado Físico (Cierre)', dataKey: 'closingAmount' },
                { header: 'Diferencia (Sobrante/Faltante)', dataKey: 'difference' },
                { header: 'Estado', dataKey: 'status' }
            ],
            'historial_cajas'
        );
    };

    const handleExportPDF = () => {
        if (!data || data.sessions.length === 0) return;
        exportToPDF(
            data.sessions.map(s => ({
                ...s,
                openedAt: new Date(s.openedAt).toLocaleString(),
                differenceFormatted: formatMoney(s.difference)
            })),
            [
                { header: 'Caja', dataKey: 'registerName' },
                { header: 'Cajero', dataKey: 'cashierName' },
                { header: 'Apertura', dataKey: 'openedAt' },
                { header: 'Esperado', dataKey: 'expectedAmount', format: (v) => formatMoney(v) },
                { header: 'Cierre', dataKey: 'closingAmount', format: (v) => formatMoney(v) },
                { header: 'Diferencia', dataKey: 'differenceFormatted' }
            ],
            'Reporte de Arqueos e Historial de Caja',
            'historial_cajas',
            `Del ${dateRange.from.toLocaleDateString()} al ${dateRange.to.toLocaleDateString()}`
        );
    };

    const EmptyState = ({ message }: { message: string }) => (
        <div className="flex flex-col items-center justify-center p-8 text-slate-500 bg-slate-900/50 rounded-lg border border-slate-800 border-dashed">
            <PiggyBank className="w-10 h-10 mb-4 text-slate-600" />
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
                    <h1 className="text-3xl font-bold tracking-tight">Arqueos e Historial de Caja</h1>
                    <p className="text-slate-400 mt-1">Supervisión de finanzas, cierres y discrepancias contables.</p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 items-end sm:items-center">
                    <DateRangePicker 
                        dateRange={dateRange} 
                        onDateRangeChange={setDateRange} 
                    />
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleExportCSV} disabled={loading || !data?.sessions.length} className="bg-slate-900 border-slate-800">
                            <Download className="w-4 h-4 mr-2" /> CSV
                        </Button>
                        <Button variant="outline" onClick={handleExportPDF} disabled={loading || !data?.sessions.length} className="bg-slate-900 border-slate-800 text-blue-400 border-blue-900/50 hover:bg-blue-900/20">
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
                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-400">Total Recaudado (Efectivo y Tarjeta)</CardTitle>
                        <Wallet className="h-4 w-4 text-emerald-400" />
                    </CardHeader>
                    <CardContent>
                        {loading ? <Skeleton className="h-8 w-2/3 bg-slate-800" /> : (
                            <div className="text-2xl font-bold text-emerald-400">{formatMoney(data?.overview.totalClosed || 0)}</div>
                        )}
                        <p className="text-xs text-slate-500 mt-1">Suma de cierres físicos en el período</p>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-400">Discrepancias Totales Detectadas</CardTitle>
                        <AlertCircle className="h-4 w-4 text-rose-500" />
                    </CardHeader>
                    <CardContent>
                        {loading ? <Skeleton className="h-8 w-1/3 bg-slate-800" /> : (
                            <div className="text-2xl font-bold text-rose-400">{formatMoney(data?.overview.totalDiscrepancy || 0)}</div>
                        )}
                        <p className="text-xs text-slate-500 mt-1">En {data?.overview.discrepancieSessionsCount || 0} sesiones con fallos</p>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-400">Promedio de Margen de Error</CardTitle>
                        <Scale className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        {loading ? <Skeleton className="h-8 w-1/2 bg-slate-800" /> : (
                            <div className="text-2xl font-bold text-amber-400">{formatMoney(data?.overview.averageDiscrepancy || 0)}</div>
                        )}
                        <p className="text-xs text-slate-500 mt-1">Por sesión descuadrada</p>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-400">Volumen de Operaciones</CardTitle>
                        <PiggyBank className="h-4 w-4 text-blue-400" />
                    </CardHeader>
                    <CardContent>
                        {loading ? <Skeleton className="h-8 w-1/2 bg-slate-800" /> : (
                            <div className="text-2xl font-bold text-blue-400">{data?.overview.totalSessionsCount || 0}</div>
                        )}
                        <p className="text-xs text-slate-500 mt-1">Turnos o sesiones registradas</p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabla Detallada */}
            <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                    <CardTitle className="text-lg">Bitácora de Sesiones de Caja</CardTitle>
                    <CardDescription className="text-slate-400">Historial de aperturas y cierres clasificados cronológicamente.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-4">
                            {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-10 w-full bg-slate-800" />)}
                        </div>
                    ) : data?.sessions.length === 0 ? (
                        <EmptyState message="No se encontraron sesiones de caja en el período." />
                    ) : (
                        <div className="rounded-md border border-slate-800 overflow-hidden">
                            <Table>
                                <TableHeader className="bg-slate-950">
                                    <TableRow className="border-slate-800 hover:bg-transparent">
                                        <TableHead className="text-slate-400 font-bold text-xs uppercase">Detalles</TableHead>
                                        <TableHead className="text-slate-400 font-bold text-xs uppercase text-right">Apertura</TableHead>
                                        <TableHead className="text-slate-400 font-bold text-xs uppercase text-right">Esperado</TableHead>
                                        <TableHead className="text-slate-400 font-bold text-xs uppercase text-right">Físico (Declarado)</TableHead>
                                        <TableHead className="text-slate-400 font-bold text-xs uppercase text-right">Diferencia</TableHead>
                                        <TableHead className="text-slate-400 font-bold text-xs uppercase text-right">Estado</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data?.sessions.map((s) => (
                                        <TableRow 
                                            key={s.id} 
                                            className="border-slate-800 hover:bg-slate-800/50 cursor-pointer"
                                            onClick={() => router.push(`/admin/reports/cash/daily-cutoff?sessionId=${s.id}`)}
                                        >
                                            <TableCell className="font-medium text-slate-300">
                                                <div className="font-bold text-white">{s.registerName}</div>
                                                <div className="text-xs text-slate-400">Cajero: {s.cashierName}</div>
                                                <div className="text-[10px] text-slate-500">{new Date(s.openedAt).toLocaleString()}</div>
                                            </TableCell>
                                            <TableCell className="text-right font-medium">{formatMoney(s.openingAmount)}</TableCell>
                                            
                                            {s.status === 'OPEN' ? (
                                                <TableCell colSpan={3} className="text-center">
                                                    <span className="text-amber-500 font-medium text-xs">Caja Activa. Aún sin arqueo.</span>
                                                </TableCell>
                                            ) : (
                                                <>
                                                    <TableCell className="text-right text-slate-300">{formatMoney(s.expectedAmount)}</TableCell>
                                                    <TableCell className="text-right font-bold text-emerald-400">{formatMoney(s.closingAmount)}</TableCell>
                                                    <TableCell className="text-right">
                                                        <span className={s.difference < -0.01 ? 'text-rose-500 font-bold' : s.difference > 0.01 ? 'text-blue-400 font-bold' : 'text-slate-500'}>
                                                            {s.difference < -0.01 ? 'Faltan ' : s.difference > 0.01 ? 'Sobran ' : 'Cuadre Exacto '}
                                                            {formatMoney(Math.abs(s.difference))}
                                                        </span>
                                                    </TableCell>
                                                </>
                                            )}
                                            
                                            <TableCell className="text-right">
                                                <Badge variant="outline" className={s.status === 'OPEN' ? 'border-amber-500/50 text-amber-500' : s.status === 'RECONCILED' ? 'border-blue-500/50 text-blue-500' : 'border-emerald-500/50 text-emerald-500'}>
                                                    {s.status === 'OPEN' ? 'Abierta' : s.status === 'RECONCILED' ? 'Descuadre' : 'Cerrada'}
                                                </Badge>
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
