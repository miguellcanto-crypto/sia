'use client';

import { useState, useEffect, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { 
    Printer, 
    ArrowLeft,
    CheckCircle2,
    XCircle,
    Download
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { exportToPDF } from '@/lib/exportUtils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface CashMovement {
    type: string;
    amount: number;
    reason: string | null;
    time: string;
}

interface DailyCutoffData {
    sessionId: string;
    status: string;
    openedAt: string;
    closedAt: string | null;
    cashier: { name: string; email: string };
    register: string;
    openingAmount: number;
    expectedAmount: number;
    closingAmount: number;
    difference: number;
    notes: string | null;
    closingNotes: string | null;
    movements: {
        totalCashIn: number;
        totalCashOut: number;
        details: CashMovement[];
    };
    sales: {
        totalRevenue: number;
        totalSalesCount: number;
        byMethod: Record<string, { total: number, count: number }>;
    };
}

function DailyCutoffContent() {
    const searchParams = useSearchParams();
    const sessionId = searchParams.get('sessionId');

    const [data, setData] = useState<DailyCutoffData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCutoffData = async () => {
        setLoading(true);
        try {
            const endpoint = sessionId 
                ? `/api/admin/reports/cash/daily-cutoff?sessionId=${sessionId}`
                : `/api/admin/reports/cash/daily-cutoff`;
            
            const res = await fetch(endpoint);
            const json = await res.json();
            
            if (!res.ok) throw new Error(json.error || 'Error al cargar el corte de caja');
            
            setData(json);
            setError(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCutoffData();
    }, [sessionId]);

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
    };

    const handlePrint = () => {
        window.print();
    };

    const handleExportPDF = () => {
        if (!data) return;
        
        const summaryColumns = [
            { header: 'Concepto', dataKey: 'concept' },
            { header: 'Monto', dataKey: 'amount' }
        ];

        const summaryData = [
            { concept: 'Fondo de Apertura', amount: formatMoney(data.openingAmount) },
            { concept: 'Total Entradas Específicas (+)', amount: formatMoney(data.movements.totalCashIn) },
            { concept: 'Total Retiros / Gastos (-)', amount: formatMoney(data.movements.totalCashOut) },
            { concept: 'Ingresos por Ventas (+)', amount: formatMoney(data.sales.totalRevenue) },
            { concept: 'Total Esperado Físico (=)', amount: formatMoney(data.expectedAmount) },
            { concept: 'Total Declarado (Contado)', amount: formatMoney(data.closingAmount) },
            { concept: 'Diferencia (Sobrante/Faltante)', amount: formatMoney(data.difference) }
        ];

        exportToPDF(
            summaryData,
            summaryColumns,
            `Arqueo de Caja - ${data.register}`,
            `corte_caja_${data.sessionId.slice(-6)}`,
            `Cajero: ${data.cashier?.name} | Apertura: ${new Date(data.openedAt).toLocaleString()}`
        );
    };

    if (error) {
        return (
            <div className="p-8 text-center bg-slate-950 min-h-screen pt-20">
                <XCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-red-400">{error}</h2>
                <div className="mt-8 flex justify-center gap-4">
                    <Button variant="outline" onClick={() => window.location.reload()}>Reintentar</Button>
                    <Link href="/admin/reports/cash">
                        <Button>Ver Historial de Cajas</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 bg-slate-950 min-h-screen text-slate-100 pb-20 print:bg-white print:text-black">
            {/* Cabecera (No imprimible) */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6 print:hidden">
                <div>
                    <Link href="/admin/reports/cash" className="flex items-center text-sm text-blue-500 hover:text-blue-400 mb-2">
                        <ArrowLeft className="w-4 h-4 mr-1" /> Volver al Registro de Cajas
                    </Link>
                    <h1 className="text-3xl font-bold tracking-tight">Corte de Caja Detallado</h1>
                </div>
                
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleExportPDF} disabled={loading || !data} className="bg-slate-900 border-slate-800 text-blue-400 border-blue-900/50 hover:bg-blue-900/20">
                        <Download className="w-4 h-4 mr-2" /> Descargar PDF
                    </Button>
                    <Button onClick={handlePrint} disabled={loading || !data} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                        <Printer className="w-4 h-4 mr-2" /> Imprimir Recibo
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="space-y-6 mt-8">
                    <Skeleton className="h-[200px] w-full bg-slate-900" />
                    <Skeleton className="h-[400px] w-full bg-slate-900" />
                </div>
            ) : data ? (
                <div className="mt-8 max-w-4xl mx-auto space-y-6 print:space-y-4 print:mt-0 print:text-sm">
                    {/* Encabezado del Recibo */}
                    <div className="text-center space-y-1">
                        <h2 className="text-2xl font-bold mb-4 print:text-xl">Reporte Z - {data.register}</h2>
                        <p className="text-slate-400 print:text-gray-600">ID Sesión: {data.sessionId}</p>
                        <p className="text-slate-400 print:text-gray-600">Cajero: {data.cashier?.name} ({data.cashier?.email})</p>
                        <p className="text-slate-400 print:text-gray-600">
                            Apertura: {format(new Date(data.openedAt), "dd/MM/yyyy HH:mm:ss")}
                        </p>
                        <p className="text-slate-400 print:text-gray-600">
                            Cierre: {data.closedAt ? format(new Date(data.closedAt), "dd/MM/yyyy HH:mm:ss") : 'Pendiente (Turno Activo)'}
                        </p>
                    </div>

                    {/* Resumen General Financiero */}
                    <Card className="bg-slate-900 border-slate-800 print:border-gray-300 print:shadow-none">
                        <CardHeader className="border-b border-slate-800 print:border-b-black pb-2">
                            <CardTitle className="text-lg">Balance Total</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-3">
                            <div className="flex justify-between">
                                <span className="text-slate-400 print:text-black">Fondo Inicial:</span>
                                <span className="font-medium text-slate-200 print:text-black">{formatMoney(data.openingAmount)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400 print:text-black">Ingresos por Ventas (+):</span>
                                <span className="font-medium text-emerald-400 print:text-black">{formatMoney(data.sales.totalRevenue)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400 print:text-black">Entradas Manuales (+):</span>
                                <span className="font-medium text-blue-400 print:text-black">{formatMoney(data.movements.totalCashIn)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400 print:text-black">Retiros / Pagos (-):</span>
                                <span className="font-medium text-rose-400 print:text-black">{formatMoney(data.movements.totalCashOut)}</span>
                            </div>
                            <div className="h-px w-full bg-slate-800 print:bg-black my-2" />
                            <div className="flex justify-between font-bold text-lg">
                                <span className="text-white print:text-black">Total Efectivo/Medios Esperado:</span>
                                <span className="text-white print:text-black">{formatMoney(data.expectedAmount)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-lg pt-2 mt-2 border-t border-dashed border-slate-700 print:border-gray-400">
                                <span className="text-slate-200 print:text-black">Total Contado/Declarado:</span>
                                <span className="text-blue-400 print:text-black">{formatMoney(data.closingAmount)}</span>
                            </div>
                            
                            {/* Discrepancia */}
                            {data.status !== 'OPEN' && (
                                <div className={`flex justify-between p-3 rounded-lg mt-4 ${
                                    Math.abs(data.difference) < 0.01 
                                        ? 'bg-emerald-900/20 text-emerald-400 border border-emerald-900/50 print:bg-gray-100 print:text-black print:border-black' 
                                        : data.difference < 0 
                                            ? 'bg-rose-900/20 text-rose-400 border border-rose-900/50 print:bg-gray-100 print:text-black print:border-black' 
                                            : 'bg-blue-900/20 text-blue-400 border border-blue-900/50 print:bg-gray-100 print:text-black print:border-black'
                                }`}>
                                    <span className="font-bold flex items-center">
                                        {Math.abs(data.difference) < 0.01 ? (
                                            <><CheckCircle2 className="w-4 h-4 mr-2" /> Cuadre Perfecto</>
                                        ) : data.difference < 0 ? (
                                            'FALTA EN CAJA (-)'
                                        ) : (
                                            'SOBRA EN CAJA (+)'
                                        )}
                                    </span>
                                    <span className="font-bold">{formatMoney(Math.abs(data.difference))}</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2">
                        {/* Ventas por Método */}
                        <Card className="bg-slate-900 border-slate-800 print:border-gray-300 print:shadow-none h-fit">
                            <CardHeader className="border-b border-slate-800 print:border-b-black pb-2">
                                <CardTitle className="text-sm">Desglose de Ventas ({data.sales.totalSalesCount} tickets)</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-2">
                                {Object.entries(data.sales.byMethod).map(([method, info]) => (
                                    <div key={method} className="flex justify-between items-center text-sm">
                                        <span className="text-slate-300 print:text-black font-semibold">{method} ({info.count})</span>
                                        <span className="text-slate-400 print:text-black">{formatMoney(info.total)}</span>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        {/* Notas y Firmas */}
                        <Card className="bg-transparent border border-dashed border-slate-700 print:border-gray-400 print:shadow-none h-fit">
                            <CardContent className="pt-6 text-sm space-y-4 text-slate-400 print:text-black">
                                <div>
                                    <span className="font-bold block mb-1">Notas Apertura:</span>
                                    {data.notes || 'Sin observaciones.'}
                                </div>
                                <div className="border-t border-slate-800 pt-2 print:border-gray-300 mt-2">
                                    <span className="font-bold block mb-1">Observaciones Cierre:</span>
                                    {data.closingNotes || 'Sin observaciones de cierre.'}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Espacio para Firmas Físicas al Imprimir */}
                    <div className="hidden print:grid grid-cols-2 gap-8 mt-24 pt-24 text-center">
                        <div>
                            <div className="border-t border-black w-3/4 mx-auto pt-2">
                                <p className="font-bold">Entrega y Cierra</p>
                                <p className="text-xs">{data.cashier?.name}</p>
                            </div>
                        </div>
                        <div>
                            <div className="border-t border-black w-3/4 mx-auto pt-2">
                                <p className="font-bold">Recibe y Verifica</p>
                                <p className="text-xs">Firma Gerencia / Admin</p>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}

export default function DailyCutoffPage() {
    return (
        <Suspense fallback={<div className="p-8 bg-slate-950 min-h-screen pt-20 flex justify-center"><Skeleton className="h-[400px] w-full max-w-4xl bg-slate-900" /></div>}>
            <DailyCutoffContent />
        </Suspense>
    );
}
