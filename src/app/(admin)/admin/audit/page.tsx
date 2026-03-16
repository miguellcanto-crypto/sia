'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Search,
    Filter,
    Download,
    ChevronLeft,
    ChevronRight,
    Eye,
    RefreshCcw,
    FileJson,
    User as UserIcon,
    History,
    Settings2,
    X
} from 'lucide-react';
import { AuditDetailsModal } from '@/components/admin/audit/AuditDetailsModal';

export default function AuditPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    // Filtros
    const [filters, setFilters] = useState({
        userId: '',
        entityType: '',
        action: '',
        startDate: '',
        endDate: '',
        resultStatus: ''
    });

    // Columnas visibles
    const [visibleColumns, setVisibleColumns] = useState({
        date: true,
        user: true,
        action: true,
        entity: true,
        entityId: true,
        status: true,
        ip: false, // Oculta por defecto
        details: true
    });

    const [selectedLog, setSelectedLog] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const toggleColumn = (col: keyof typeof visibleColumns) => {
        setVisibleColumns(prev => ({ ...prev, [col]: !prev[col] }));
    };

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '15',
                ...Object.fromEntries(
                    Object.entries(filters).filter(([_, v]) => v !== '' && v !== 'none')
                )
            });

            const res = await fetch(`/api/admin/audit?${params}`);
            const result = await res.json();

            if (result.data) {
                setLogs(result.data);
                setTotalPages(result.pagination.totalPages);
                setTotalRecords(result.pagination.total);
            }
        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            setLoading(false);
        }
    }, [page, filters]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPage(1); // Reset a primera página al filtrar
    };

    const exportToCSV = () => {
        const headers = ['ID', 'Fecha', 'Usuario', 'Acción', 'Entidad', 'Entidad ID', 'Estado', 'IP'];
        const rows = logs.map(l => [
            l.id,
            new Date(l.createdAt).toLocaleString(),
            l.user?.name || 'Sistema',
            l.action,
            l.entityType,
            l.entityName || l.entityId,
            l.resultStatus,
            l.ipAddress || '-'
        ]);

        const csvContent = [headers, ...rows]
            .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
            .join("\n");
            
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `auditoria_sia_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getStatusBadge = (status: string) => {
        const s = status || 'SUCCESS';
        switch (s) {
            case 'SUCCESS':
                return <Badge className="bg-emerald-500 text-white border-none shadow-sm px-2">Éxito</Badge>;
            case 'FAILED':
                return <Badge variant="destructive" className="px-2">Fallido</Badge>;
            case 'WARNING':
                return <Badge className="bg-amber-500 text-slate-950 border-none px-2 font-bold">Aviso</Badge>;
            default:
                return <Badge variant="outline" className="text-slate-400 border-slate-700 px-2">{s}</Badge>;
        }
    };

    return (
        <div className="p-8 space-y-6 bg-slate-950 min-h-screen text-slate-100">
            {/* Cabecera */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Bitácora de Auditoría</h1>
                    <p className="text-slate-400">Seguimiento de todas las acciones críticas del sistema.</p>
                </div>
                <div className="flex gap-3">
                    <div className="relative group">
                        <Button variant="outline" className="bg-slate-900 border-slate-800 hover:bg-slate-800">
                            <Settings2 className="w-4 h-4 mr-2" />
                            Columnas
                        </Button>
                        <div className="absolute right-0 top-full mt-2 w-48 bg-slate-900 border border-slate-800 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-50 p-2 invisible group-hover:visible">
                            <div className="space-y-1">
                                {Object.entries(visibleColumns).map(([key, isVisible]) => (
                                    <label key={key} className="flex items-center gap-2 p-2 hover:bg-slate-800 rounded cursor-pointer text-xs">
                                        <input
                                            type="checkbox"
                                            checked={isVisible}
                                            onChange={() => toggleColumn(key as keyof typeof visibleColumns)}
                                            className="rounded border-slate-700 bg-slate-950 text-blue-600"
                                        />
                                        <span className="capitalize">{key === 'entityId' ? 'Identificador' : key}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                    <Button variant="outline" onClick={exportToCSV} className="bg-slate-900 border-slate-800 hover:bg-slate-800">
                        <Download className="w-4 h-4 mr-2" />
                        Exportar CSV
                    </Button>
                    <Button onClick={fetchLogs} className="bg-blue-600 hover:bg-blue-700">
                        <RefreshCcw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refrescar
                    </Button>
                </div>
            </div>

            {/* Resumen de actividad (Opcional) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-slate-900 border-slate-800 text-slate-100">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-400">Total de Eventos</CardTitle>
                        <History className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalRecords}</div>
                        <p className="text-xs text-slate-500 mt-1">Registrados en el historial</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filtros */}
            <Card className="bg-slate-900 border-slate-800">
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Tipo de Entidad</label>
                            <Select onValueChange={(v) => handleFilterChange('entityType', v)}>
                                <SelectTrigger className="bg-slate-950 border-slate-800">
                                    <SelectValue placeholder="Todas las entidades" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                                    <SelectItem value="none">Todas</SelectItem>
                                    <SelectItem value="Product">Producto</SelectItem>
                                    <SelectItem value="Sale">Venta</SelectItem>
                                    <SelectItem value="Category">Categoría</SelectItem>
                                    <SelectItem value="User">Usuario</SelectItem>
                                    <SelectItem value="SECURITY">Seguridad</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Acción</label>
                            <Select onValueChange={(v) => handleFilterChange('action', v)}>
                                <SelectTrigger className="bg-slate-950 border-slate-800">
                                    <SelectValue placeholder="Sincronizar acción" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                                    <SelectItem value="none">Todas</SelectItem>
                                    <SelectItem value="CREATE">Creación</SelectItem>
                                    <SelectItem value="UPDATE">Actualización</SelectItem>
                                    <SelectItem value="DELETE">Eliminación</SelectItem>
                                    <SelectItem value="SALE_CREATED">Venta Realizada</SelectItem>
                                    <SelectItem value="PRICE_CHANGED">Cambio de Precio</SelectItem>
                                    <SelectItem value="LOGIN">Inicio de Sesión</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Buscar Usuario (ID)</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                                <Input
                                    className="pl-10 bg-slate-950 border-slate-800"
                                    placeholder="ID de usuario..."
                                    onBlur={(e) => handleFilterChange('userId', e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Estado</label>
                            <Select onValueChange={(v) => handleFilterChange('resultStatus', v)}>
                                <SelectTrigger className="bg-slate-950 border-slate-800">
                                    <SelectValue placeholder="Cualquier estado" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                                    <SelectItem value="none">Todos</SelectItem>
                                    <SelectItem value="SUCCESS">Éxito</SelectItem>
                                    <SelectItem value="FAILED">Fallido</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tabla */}
            <Card className="bg-slate-900 border-slate-800 overflow-hidden">
                <div className="rounded-md border-none">
                    <Table>
                        <TableHeader className="bg-slate-800/50">
                            <TableRow className="border-slate-800 hover:bg-transparent">
                                {visibleColumns.date && <TableHead className="text-slate-400 font-bold uppercase text-[10px]">Fecha</TableHead>}
                                {visibleColumns.user && <TableHead className="text-slate-400 font-bold uppercase text-[10px]">Usuario</TableHead>}
                                {visibleColumns.action && <TableHead className="text-slate-400 font-bold uppercase text-[10px]">Acción</TableHead>}
                                {visibleColumns.entity && <TableHead className="text-slate-400 font-bold uppercase text-[10px]">Entidad</TableHead>}
                                {visibleColumns.entityId && <TableHead className="text-slate-400 font-bold uppercase text-[10px]">Identificador</TableHead>}
                                {visibleColumns.ip && <TableHead className="text-slate-400 font-bold uppercase text-[10px]">IP</TableHead>}
                                {visibleColumns.status && <TableHead className="text-slate-400 font-bold uppercase text-[10px]">Estado</TableHead>}
                                {visibleColumns.details && <TableHead className="text-slate-400 font-bold uppercase text-[10px] text-right">Detalles</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i} className="border-slate-800 animate-pulse">
                                        <TableCell colSpan={8} className="h-12 bg-slate-800/10" />
                                    </TableRow>
                                ))
                            ) : logs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-48 text-center text-slate-500">
                                        No se encontraron registros de auditoría.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                logs.map((log: any) => (
                                    <TableRow key={log.id} className="border-slate-800 hover:bg-slate-800/50 transition-colors">
                                        {visibleColumns.date && (
                                            <TableCell className="font-medium text-xs whitespace-nowrap tabular-nums">
                                                {new Date(log.createdAt).toLocaleString()}
                                            </TableCell>
                                        )}
                                        {visibleColumns.user && (
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center">
                                                        <UserIcon className="w-3 h-3 text-slate-400" />
                                                    </div>
                                                    <span className="text-sm">{log.user?.name || 'Sistema'}</span>
                                                </div>
                                            </TableCell>
                                        )}
                                        {visibleColumns.action && (
                                            <TableCell>
                                                <Badge variant="outline" className="text-[10px] font-bold border-slate-700 bg-slate-800/50">
                                                    {log.action}
                                                </Badge>
                                            </TableCell>
                                        )}
                                        {visibleColumns.entity && (
                                            <TableCell className="text-sm text-slate-300">
                                                {log.entityType}
                                            </TableCell>
                                        )}
                                        {visibleColumns.entityId && (
                                            <TableCell className="font-mono text-[11px] text-slate-300 font-bold max-w-[150px] truncate bg-slate-900/40 px-2 rounded">
                                                {log.entityName || log.entityId}
                                            </TableCell>
                                        )}
                                        {visibleColumns.ip && (
                                            <TableCell className="font-mono text-[10px] text-slate-400">
                                                {log.ipAddress || '-'}
                                            </TableCell>
                                        )}
                                        {visibleColumns.status && (
                                            <TableCell>
                                                {getStatusBadge(log.resultStatus)}
                                            </TableCell>
                                        )}
                                        {visibleColumns.details && (
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedLog(log);
                                                        setIsModalOpen(true);
                                                    }}
                                                    className="hover:bg-blue-500/10 hover:text-blue-400"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Paginación */}
                <div className="p-4 border-t border-slate-800 flex items-center justify-between">
                    <p className="text-xs text-slate-500">
                        Mostrando página {page} de {totalPages} ({totalRecords} registros totales)
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page === 1 || loading}
                            onClick={() => setPage(p => p - 1)}
                            className="bg-slate-900 border-slate-800"
                        >
                            <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page === totalPages || loading}
                            onClick={() => setPage(p => p + 1)}
                            className="bg-slate-900 border-slate-800"
                        >
                            Siguiente <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>
                </div>
            </Card>

            <AuditDetailsModal
                log={selectedLog}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    );
}
