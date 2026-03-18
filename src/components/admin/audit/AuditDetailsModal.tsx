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

    const renderValue = (key: string, val: any) => {
        // En caso de que se nos pase el JSON como string, intentar parsearlo
        let parsedVal = val;
        if (typeof val === 'string' && (val.startsWith('[') || val.startsWith('{'))) {
            try { parsedVal = JSON.parse(val); } catch (e) {}
        }

        // 1. Manejo especial de ARTÍCULOS (Ya implementado)
        if (key === 'items' && Array.isArray(parsedVal)) {
            return (
                <div className="space-y-2 mt-2 col-span-full">
                    {parsedVal.map((item: any, idx: number) => (
                        <div key={idx} className="bg-slate-900 border border-slate-700/50 p-3 rounded-lg flex justify-between items-center shadow-sm">
                            <div className="flex flex-col">
                                <span className="text-sm text-slate-200 font-semibold truncate max-w-[200px] md:max-w-xs">
                                    {item.product?.name || item.name || 'Producto Desconocido'}
                                </span>
                                <span className="text-xs text-slate-400 mt-0.5">
                                    {item.quantity} {item.product?.unit || 'uds'} × ${Number(item.price || item.product?.price || 0).toFixed(2)}
                                </span>
                            </div>
                            <div className="text-right">
                                <span className="text-sm font-bold text-emerald-400">
                                    ${Number(item.subtotal || (item.quantity * (item.price || 0))).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            );
        }

        // 2. Manejo de NULOS
        if (val === null || val === undefined) {
            return <span className="text-sm text-slate-600 italic">No especificado</span>;
        }

        // 3. Manejo de FECHAS
        const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
        if (typeof val === 'string' && isoDateRegex.test(val)) {
            return (
                <span className="text-sm text-slate-300 font-medium">
                    {new Date(val).toLocaleString('es-MX', { 
                        dateStyle: 'medium', 
                        timeStyle: 'short' 
                    })}
                </span>
            );
        }

        // 4. Manejo de BOOLEANOS
        if (typeof val === 'boolean') {
            return (
                <Badge className={val ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"}>
                    {val ? 'Sí' : 'No'}
                </Badge>
            );
        }

        // 5. Manejo de MONEDA (Basado en el nombre de la llave)
        const currencyKeys = ['price', 'cost', 'total', 'subtotal', 'balance', 'amount', 'creditLimit'];
        if (typeof val === 'number' && currencyKeys.some(ck => key.toLowerCase().includes(ck))) {
            return <span className="text-sm font-bold text-blue-400">${val.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>;
        }

        // 6. Manejo de IDs (Truncar si son muy largos)
        if (typeof val === 'string' && val.length > 20 && !val.includes(' ')) {
            return (
                <span className="text-[11px] font-mono text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800" title={val}>
                    ...{val.substring(val.length - 8)}
                </span>
            );
        }

        // Default: Texto plano elegante
        return <span className="text-sm text-slate-200">{String(val)}</span>;
    };

    const translateKey = (key: string) => {
        const translations: Record<string, string> = {
            id: 'ID',
            sale: 'Venta',
            item: 'Artículos',
            tax: 'Impuestos',
            quantity: 'Cantidad',
            price: 'Precio',
            cost: 'Costo',
            total: 'Total',
            subtotal: 'Subtotal',
            balance: 'Saldo',
            amount: 'Monto',
            creditLimit: 'Límite de Crédito',
            items: 'Artículos/Productos',
            productId: 'ID de Producto',
            saleId: 'ID de Venta',
            createdAt: 'Fecha de Creación',
            updatedAt: 'Última Actualización',
            userId: 'ID de Usuario',
            resultStatus: 'Estado del Resultado',
            action: 'Acción',
            entityType: 'Tipo de Entidad',
            entityId: 'ID de Entidad',
            entityName: 'Nombre de Entidad',
            ipAddress: 'Dirección IP',
            userAgent: 'Navegador/Sistema',
            sessionId: 'ID de Sesión',
            name: 'Nombre',
            code: 'Código',
            email: 'Correo Electrónico',
            phone: 'Teléfono',
            company: 'Empresa',
            taxId: 'RFC/ID Fiscal',
            notes: 'Notas',
            points: 'Puntos',
            tier: 'Nivel (Tier)',
            isActive: 'Está Activo',
            stock: 'Existencias',
            minStock: 'Stock Mínimo',
            description: 'Descripción',
            unit: 'Unidad',
            categoryId: 'ID de Categoría',
            isFresh: 'Es Fresco',
            isSeafood: 'Es Marisco',
            isWeighable: 'Es Pesable',
            pricePerUnit: 'Precio por Unidad',
            tareWeight: 'Peso Tara',
            version: 'Versión',
            role: 'Rol',
            permissions: 'Permisos',
            saleNumber: 'Número de Venta',
            status: 'Estado',
            date: 'Fecha',
            paymentMethod: 'Método de Pago',
            cashValue: 'Efectivo',
            cardValue: 'Tarjeta',
            transferValue: 'Transferencia',
            pointsUsed: 'Puntos Usados'
        };

        return translations[key] || key;
    };

    const renderJson = (title: string, data: any) => {
        if (!data || Object.keys(data).length === 0) return null;

        let parsedData = data;
        if (typeof data === 'string') {
            try { parsedData = JSON.parse(data); } catch (e) {}
        }
        
        const entries = typeof parsedData === 'object' && parsedData !== null ? Object.entries(parsedData) : [['Valor', parsedData]];

        return (
            <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-tighter flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    {title}
                </h4>
                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800/50 shadow-inner overflow-auto max-h-[450px]">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                        {entries.map(([key, value]) => {
                            const isLarge = key === 'items' || (typeof value === 'object' && value !== null);
                            return (
                                <div key={key} className={`border-b border-slate-800/50 pb-3 last:border-0 last:pb-0 ${isLarge ? 'col-span-full' : ''}`}>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">{translateKey(key)}</p>
                                    {renderValue(key, value)}
                                </div>
                            );
                        })}
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

    const translateEntity = (entity: string) => {
        const entities: Record<string, string> = {
            Product: 'Producto',
            Sale: 'Venta',
            Category: 'Categoría',
            User: 'Usuario',
            Customer: 'Cliente',
            CustomerPointHistory: 'Historial de Puntos',
            Notification: 'Notificación',
            SECURITY: 'Seguridad'
        };
        return entities[entity] || entity;
    };

    const translateAction = (action: string) => {
        const actions: Record<string, string> = {
            CREATE: 'Creación',
            UPDATE: 'Actualización',
            DELETE: 'Eliminación',
            SALE_CREATED: 'Venta Realizada',
            POINTS_ADJUSTED: 'Ajuste de Puntos',
            LOGIN: 'Inicio de Sesión',
            LOGOUT: 'Cierre de Sesión'
        };
        return actions[action] || action;
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
                        Registro de <span className="text-blue-400 font-semibold">{translateAction(log.action)}</span> en <span className="text-slate-200 font-semibold">{translateEntity(log.entityType)}</span> ({log.entityName || log.entityId})
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
