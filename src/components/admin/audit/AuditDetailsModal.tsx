'use client';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
// Eliminado ScrollArea redundante

interface AuditDetailsModalProps {
    log: any | null;
    isOpen: boolean;
    onClose: () => void;
}

export function AuditDetailsModal({ log, isOpen, onClose }: AuditDetailsModalProps) {
    if (!log) return null;

    const renderJson = (title: string, data: any) => {
        if (!data || Object.keys(data).length === 0) return null;

        // Si es un objeto complejo, lo mostramos como lista de campos
        const entries = Object.entries(data);

        return (
            <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-tighter flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    {title}
                </h4>
                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800/50 shadow-inner overflow-auto max-h-[350px]">
                    <div className="space-y-3">
                        {entries.map(([key, value]) => (
                            <div key={key} className="border-b border-slate-800/50 pb-2 last:border-0 last:pb-0">
                                <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">{key}</p>
                                <p className="text-sm text-blue-300 font-mono break-all bg-slate-900/50 p-1.5 rounded">
                                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const getStatusBadge = (status: string) => {
        const s = status || 'SUCCESS';
        switch (s) {
            case 'SUCCESS':
                return <Badge className="bg-emerald-500 text-white border-none px-3 py-1 text-xs font-bold">ÉXITO</Badge>;
            case 'FAILED':
                return <Badge variant="destructive" className="px-3 py-1 text-xs font-bold">FALLIDO</Badge>;
            case 'WARNING':
                return <Badge className="bg-amber-500 text-slate-900 border-none px-3 py-1 text-xs font-bold">ADVERTENCIA</Badge>;
            default:
                return <Badge variant="outline" className="px-3 py-1 text-xs font-bold">{s}</Badge>;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col bg-slate-900 border-slate-800 text-slate-100">
                <DialogHeader>
                    <div className="flex items-center justify-between mb-2">
                        <DialogTitle className="text-xl font-bold flex items-center gap-3">
                            Detalles de Auditoría
                            {getStatusBadge(log.resultStatus)}
                        </DialogTitle>
                    </div>
                    <DialogDescription className="text-slate-400">
                        Registro de {log.action} en {log.entityType} ({log.entityName || log.entityId})
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto pr-2 space-y-6 py-4">
                    {/* Información General */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                        <div>
                            <p className="text-[10px] text-slate-500 uppercase font-bold">Usuario</p>
                            <p className="text-sm font-medium">{log.user?.name || 'Sistema'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-500 uppercase font-bold">Fecha</p>
                            <p className="text-sm font-medium">{new Date(log.createdAt).toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-500 uppercase font-bold">IP</p>
                            <p className="text-sm font-medium font-mono text-slate-400">{log.ipAddress || '-'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-500 uppercase font-bold">Sesión</p>
                            <p className="text-sm font-medium font-mono text-slate-400 truncate" title={log.sessionId}>
                                {log.sessionId ? log.sessionId.substring(log.sessionId.length - 8) : '-'}
                            </p>
                        </div>
                    </div>

                    {/* Metadatos y Diferencias */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {renderJson("Valores Anteriores", log.oldValues)}
                        {renderJson("Valores Nuevos", log.newValues)}
                    </div>

                    {log.userAgent && (
                        <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800">
                            <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">User Agent</p>
                            <p className="text-xs text-slate-400 font-mono break-all">{log.userAgent}</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
