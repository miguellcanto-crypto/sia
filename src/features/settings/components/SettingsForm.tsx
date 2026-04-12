'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Save, AlertTriangle, RotateCcw, Building2, ShoppingCart, Package, CreditCard } from 'lucide-react';

interface ConfigItem {
    id: string;
    key: string;
    value: string;
    category: string;
    description?: string;
}

export function SettingsForm() {
    const [configs, setConfigs] = useState<Record<string, ConfigItem>>({});
    const [originalConfigs, setOriginalConfigs] = useState<Record<string, ConfigItem>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    const checkUnsavedChanges = useCallback((current: Record<string, ConfigItem>, original: Record<string, ConfigItem>) => {
        let changed = false;
        for (const key in current) {
            if (current[key].value !== original[key]?.value) {
                changed = true;
                break;
            }
        }
        setHasUnsavedChanges(changed);
    }, []);

    const loadSettings = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/settings');
            if (res.status === 403) {
                setError('No tienes permisos suficientes.');
                setLoading(false);
                return;
            }
            if (!res.ok) throw new Error('Error cargando configuraciones');
            const data = await res.json();
            
            const flatMap: Record<string, ConfigItem> = {};
            // Flatten the categories
            for (const category in data.configs) {
                data.configs[category].forEach((item: ConfigItem) => {
                    flatMap[item.key] = item;
                });
            }
            setConfigs(flatMap);
            setOriginalConfigs(JSON.parse(JSON.stringify(flatMap)));
            setHasUnsavedChanges(false);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSettings();
    }, []);

    const handleChange = (key: string, value: string) => {
        setConfigs(prev => {
            const next = { ...prev };
            if (next[key]) {
                next[key] = { ...next[key], value };
            } else {
                // If the key doesn't exist yet in the DB (new installation without seed), create a dummy
                next[key] = { id: '', key, value, category: 'GENERAL' };
            }
            checkUnsavedChanges(next, originalConfigs);
            return next;
        });
    };

    const handleSave = async (categoryFilter?: string) => {
        setSaving(true);
        setError(null);
        setSuccessMessage(null);

        try {
            // Either save all, or just the ones in this category. We can submit all, backend upserts array.
            const toSave = Object.values(configs).filter(c => !categoryFilter || c.category === categoryFilter);
            
            // Format for API
            const payload = toSave.map(c => ({
                key: c.key,
                value: c.value,
                category: c.category,
                description: c.description
            }));

            const res = await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ configs: payload })
            });

            const data = await res.json();

            if (!res.ok) {
                if (res.status === 422) {
                    throw new Error(`Validación: ${data.error}`);
                }
                throw new Error(data.error || 'Error al guardar');
            }

            setSuccessMessage('Configuración guardada exitosamente.');
            setOriginalConfigs(JSON.parse(JSON.stringify(configs)));
            setHasUnsavedChanges(false);
            
            // Clear message after 3 seconds
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const restoreDefaults = (category: string) => {
        window.alert(`Restaurando... (Requiere reiniciar el tab con reload, en un futuro se traerán del seed directamente)`);
        // We will just reload from original for now to revert unsaved
        const reverted = { ...configs };
        Object.keys(reverted).forEach(k => {
            if (reverted[k].category === category && originalConfigs[k]) {
                reverted[k] = { ...originalConfigs[k] };
            }
        });
        setConfigs(reverted);
        checkUnsavedChanges(reverted, originalConfigs);
    };

    if (loading) {
        return <div className="h-full flex items-center justify-center"><div className="animate-pulse flex items-center gap-2"><div className="w-4 h-4 bg-blue-600 rounded-full animate-bounce"/> Cargando...</div></div>;
    }

    // Helper to get value
    const val = (key: string) => configs[key]?.value || '';

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 h-full flex flex-col overflow-hidden">
            
            {hasUnsavedChanges && (
                <div className="bg-amber-50 border-b border-amber-200 p-3 px-6 flex items-center justify-between text-amber-800">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        <span className="font-medium text-sm">Tienes cambios sin guardar.</span>
                    </div>
                    <Button size="sm" onClick={() => handleSave()} disabled={saving}>
                        {saving ? 'Guardando...' : 'Guardar Todo'}
                    </Button>
                </div>
            )}

            {error && (
                <div className="bg-red-50 border-b border-red-200 p-3 px-6 text-red-800 text-sm font-medium">
                    {error}
                </div>
            )}

            {successMessage && (
                <div className="bg-green-50 border-b border-green-200 p-3 px-6 text-green-800 text-sm font-medium">
                    {successMessage}
                </div>
            )}

            <Tabs defaultValue="general" className="flex-1 flex flex-col">
                <div className="px-6 pt-4 border-b border-slate-100 dark:border-slate-800">
                    <TabsList className="bg-slate-100/50 dark:bg-slate-800/50 mb-0 rounded-b-none h-12 w-full justify-start gap-4">
                        <TabsTrigger value="general" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 gap-2"><Building2 className="w-4 h-4"/> General</TabsTrigger>
                        <TabsTrigger value="sales" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 gap-2"><ShoppingCart className="w-4 h-4"/> Ventas y POS</TabsTrigger>
                        <TabsTrigger value="inventory" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 gap-2"><Package className="w-4 h-4"/> Inventario</TabsTrigger>
                        <TabsTrigger value="credit" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 gap-2"><CreditCard className="w-4 h-4"/> Crédito</TabsTrigger>
                    </TabsList>
                </div>

                <div className="flex-1 overflow-auto p-6 bg-slate-50/30 dark:bg-transparent">
                    
                    {/* GENERAL */}
                    <TabsContent value="general" className="m-0 mt-2 space-y-6">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <div className="space-y-4 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                                <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-100 pb-2 border-b dark:border-slate-800">Datos del Negocio</h3>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="STORE_NAME">Nombre de la Empresa <span className="text-red-500">*</span></Label>
                                    <Input 
                                        id="STORE_NAME" 
                                        value={val('STORE_NAME')} 
                                        onChange={e => handleChange('STORE_NAME', e.target.value)} 
                                        placeholder="Ej: Marisquería El Puerto"
                                    />
                                    <p className="text-xs text-slate-500">Aparecerá en el sistema y tickets.</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="STORE_ADDRESS">Dirección</Label>
                                    <Input 
                                        id="STORE_ADDRESS" 
                                        value={val('STORE_ADDRESS')} 
                                        onChange={e => handleChange('STORE_ADDRESS', e.target.value)} 
                                        placeholder="Dirección del local"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="STORE_PHONE">Teléfono</Label>
                                        <Input id="STORE_PHONE" value={val('STORE_PHONE')} onChange={e => handleChange('STORE_PHONE', e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="STORE_RFC">RFC / ID Fiscal</Label>
                                        <Input id="STORE_RFC" value={val('STORE_RFC')} onChange={e => handleChange('STORE_RFC', e.target.value)} />
                                    </div>
                                </div>
                             </div>
                         </div>
                         <div className="flex justify-end gap-3 pt-4 border-t dark:border-slate-800">
                            <Button variant="outline" onClick={() => restoreDefaults('GENERAL')}><RotateCcw className="w-4 h-4 mr-2"/> Restaurar Pestaña</Button>
                            <Button onClick={() => handleSave()} disabled={saving}><Save className="w-4 h-4 mr-2" /> Guardar Cambios</Button>
                         </div>
                    </TabsContent>

                    {/* VENTAS */}
                    <TabsContent value="sales" className="m-0 mt-2 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <div className="space-y-4 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                                <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-100 pb-2 border-b dark:border-slate-800">Impresión de Tickets</h3>
                                <div className="space-y-2">
                                    <Label htmlFor="TICKET_FOOTER_MESSAGE">Mensaje de Pie de Ticket</Label>
                                    <Textarea 
                                        id="TICKET_FOOTER_MESSAGE" 
                                        value={val('TICKET_FOOTER_MESSAGE')} 
                                        onChange={e => handleChange('TICKET_FOOTER_MESSAGE', e.target.value)}
                                        rows={3}
                                    />
                                </div>
                                <div className="flex items-center justify-between p-3 border dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                                    <div>
                                        <Label className="text-sm font-medium text-slate-800 dark:text-slate-200">Imprimir RFC en ticket</Label>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Incluye el RFC del negocio al imprimir la nota.</p>
                                    </div>
                                    <Switch 
                                        checked={val('PRINT_RFC_ON_TICKET') === 'true'} 
                                        onCheckedChange={(c) => handleChange('PRINT_RFC_ON_TICKET', c ? 'true' : 'false')} 
                                    />
                                </div>
                             </div>

                             <div className="space-y-4 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm h-fit">
                                <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-100 pb-2 border-b dark:border-slate-800">Configuración Financiera</h3>
                                <div className="space-y-2">
                                    <Label htmlFor="TAX_RATE">Tasa de Impuesto (%)</Label>
                                    <Input 
                                        id="TAX_RATE" 
                                        type="number"
                                        min={0}
                                        max={100}
                                        value={val('TAX_RATE')} 
                                        onChange={e => handleChange('TAX_RATE', e.target.value)} 
                                    />
                                    <p className="text-xs text-slate-500">Se usará como valor por defecto en nuevas ventas.</p>
                                </div>
                             </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button variant="outline" onClick={() => restoreDefaults('SALES')}><RotateCcw className="w-4 h-4 mr-2"/> Restaurar Pestaña</Button>
                            <Button onClick={() => handleSave()} disabled={saving}><Save className="w-4 h-4 mr-2" /> Guardar Cambios</Button>
                         </div>
                    </TabsContent>

                    {/* INVENTARIO */}
                    <TabsContent value="inventory" className="m-0 mt-2 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <div className="space-y-4 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                                <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-100 pb-2 border-b dark:border-slate-800">Control de Stock</h3>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="LOW_STOCK_ALERT_THRESHOLD">Umbral Global de Stock Bajo (Kg / Unidades)</Label>
                                    <Input 
                                        id="LOW_STOCK_ALERT_THRESHOLD" 
                                        type="number"
                                        min={0}
                                        value={val('LOW_STOCK_ALERT_THRESHOLD')} 
                                        onChange={e => handleChange('LOW_STOCK_ALERT_THRESHOLD', e.target.value)} 
                                    />
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Si un producto no tiene umbral propio, se usa este para alertas.</p>
                                </div>

                                <div className="flex items-center justify-between p-3 border border-amber-200 dark:border-amber-900/50 rounded-lg bg-amber-50 dark:bg-amber-900/20 mt-4">
                                    <div>
                                        <Label className="text-sm font-medium text-amber-900 dark:text-amber-200">Permitir venta sin stock (Negativo)</Label>
                                        <p className="text-xs text-amber-700/80 dark:text-amber-500/80">Riesgoso. Permite cobrar aunque no haya producto registrado.</p>
                                    </div>
                                    <Switch 
                                        checked={val('ALLOW_NEGATIVE_STOCK') === 'true'} 
                                        onCheckedChange={(c) => handleChange('ALLOW_NEGATIVE_STOCK', c ? 'true' : 'false')} 
                                    />
                                </div>
                             </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-4 border-t dark:border-slate-800">
                            <Button variant="outline" onClick={() => restoreDefaults('INVENTORY')}><RotateCcw className="w-4 h-4 mr-2"/> Restaurar Pestaña</Button>
                            <Button onClick={() => handleSave()} disabled={saving}><Save className="w-4 h-4 mr-2" /> Guardar Cambios</Button>
                         </div>
                    </TabsContent>

                    {/* CREDITO */}
                    <TabsContent value="credit" className="m-0 mt-2 space-y-6">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <div className="space-y-4 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                                <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-100 pb-2 border-b dark:border-slate-800">Por Defecto en Clientes</h3>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="DEFAULT_CREDIT_LIMIT">Límite de Crédito Base ($)</Label>
                                    <Input 
                                        id="DEFAULT_CREDIT_LIMIT" 
                                        type="number"
                                        min={0}
                                        value={val('DEFAULT_CREDIT_LIMIT')} 
                                        onChange={e => handleChange('DEFAULT_CREDIT_LIMIT', e.target.value)} 
                                    />
                                    <p className="text-xs text-slate-500">Monto asignado al marcar un cliente como apto de crédito sin especificar monto.</p>
                                </div>

                                <div className="space-y-2 mt-4">
                                    <Label htmlFor="CREDIT_DUE_DAYS">Días de Tolerancia</Label>
                                    <Input 
                                        id="CREDIT_DUE_DAYS" 
                                        type="number"
                                        min={0}
                                        value={val('CREDIT_DUE_DAYS')} 
                                        onChange={e => handleChange('CREDIT_DUE_DAYS', e.target.value)} 
                                    />
                                    <p className="text-xs text-slate-500">Tiempo límite sugerido para considerar una deuda como vencida.</p>
                                </div>
                             </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button variant="outline" onClick={() => restoreDefaults('CREDIT')}><RotateCcw className="w-4 h-4 mr-2"/> Restaurar Pestaña</Button>
                            <Button onClick={() => handleSave()} disabled={saving}><Save className="w-4 h-4 mr-2" /> Guardar Cambios</Button>
                         </div>
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}
