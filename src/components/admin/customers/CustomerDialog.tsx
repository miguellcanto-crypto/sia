'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Plus } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { customerSchema, CustomerFormValues } from '@/lib/validations/customer';
import { toast } from 'react-hot-toast';

interface CustomerDialogProps {
    isOpen: boolean;
    onClose: () => void;
    customer?: {
        id: string;
        name: string;
        code: string;
        email: string | null;
        phone: string | null;
        company: string | null;
        taxId: string | null;
        creditLimit: number;
        notes: string | null;
        tier?: string;
        points?: number;
    };
    onSuccess: () => void;
}

export function CustomerDialog({ isOpen, onClose, customer, onSuccess }: CustomerDialogProps) {
    const isEditing = !!customer;
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm<CustomerFormValues>({
        resolver: zodResolver(customerSchema) as any,
        defaultValues: {
            name: '',
            code: '',
            email: '',
            phone: '',
            company: '',
            taxId: '',
            notes: '',
            creditLimit: 0,
        }
    });

    useEffect(() => {
        if (isOpen) {
            if (customer) {
                reset({
                    name: customer.name || '',
                    code: customer.code || '',
                    email: customer.email || '',
                    phone: customer.phone || '',
                    company: customer.company || '',
                    taxId: customer.taxId || '',
                    notes: customer.notes || '',
                    creditLimit: Number(customer.creditLimit) || 0,
                });
            } else {
                reset({});
            }
        }
    }, [isOpen, customer, reset]);

    const onSubmit = async (data: CustomerFormValues) => {
        const processedData = {
            ...data,
            phone: data.phone || null,
            email: data.email || null,
            company: data.company || null,
            taxId: data.taxId || null,
            notes: data.notes || null,
            code: data.code || null,
        };

        try {
            const endpoint = isEditing ? `/api/customers/${customer.id}` : '/api/customers';
            const method = isEditing ? 'PUT' : 'POST';

            const res = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(processedData),
            });

            if (res.ok) {
                toast.success(isEditing ? 'Cliente actualizado' : 'Cliente registrado exitosamente');
                onSuccess();
                onClose();
            } else {
                const err = await res.json();
                
                if (err.details) {
                    // Show specific validation errors
                    const errorMessages = Object.entries(err.details)
                        .map(([field, msgs]) => `${field}: ${(msgs as string[]).join(', ')}`)
                        .join('\n');
                    toast.error(`Error de validación:\n${errorMessages}`);
                } else {
                    toast.error(err.error || 'Error al guardar el cliente');
                }
            }
        } catch (error) {
            toast.error('Error de conexión al guardar cliente');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[600px] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center justify-between pr-8">
                        <span className="flex items-center gap-2">
                            {isEditing ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}
                        </span>
                        {isEditing && customer?.tier && (
                            <Badge variant="outline" className="bg-slate-100 dark:bg-slate-800">
                                Nivel: <span className="font-bold text-blue-600 dark:text-blue-400 ml-1 mr-2">{customer.tier}</span>
                                <span className="text-[10px] text-slate-500">({customer.points} pts)</span>
                            </Badge>
                        )}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing ? 'Modifica los datos del cliente. El nivel y los puntos se calculan automáticamente con sus compras.' : 'Ingresa los datos generales del cliente. El sistema le asignará un código automáticamente si lo dejas en blanco.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Básicos */}
                        <div className="space-y-2 col-span-2 md:col-span-1">
                            <Label htmlFor="name">Nombre Completo <span className="text-red-500">*</span></Label>
                            <Input id="name" {...register('name')} placeholder="Ej. Juan Pérez" />
                            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                        </div>

                        <div className="space-y-2 col-span-2 md:col-span-1">
                            <Label htmlFor="code">Código de Cliente</Label>
                            <Input id="code" {...register('code')} placeholder="Dejar en blanco para auto-generar" disabled={isEditing} />
                            {errors.code && <p className="text-xs text-red-500">{errors.code.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Correo Electrónico</Label>
                            <Input id="email" type="email" {...register('email')} placeholder="carlos@correo.com" />
                            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">Teléfono</Label>
                            <Input id="phone" {...register('phone')} placeholder="Incluir código de área, ej. 55..." />
                            {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
                        </div>

                        {/* Facturación y Crédito */}
                        <div className="space-y-2">
                            <Label htmlFor="company">Empresa / Razón Social</Label>
                            <Input id="company" {...register('company')} placeholder="Negocio S.A. de C.V." />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="taxId">RFC / Tax ID</Label>
                            <Input id="taxId" {...register('taxId')} placeholder="Formato de RFC" className="uppercase" />
                            {errors.taxId && <p className="text-xs text-red-500">{errors.taxId.message}</p>}
                        </div>

                        {/* Crédito */}
                        <div className="space-y-2 col-span-2 border-t pt-4 border-slate-200 dark:border-slate-800">
                            <Label htmlFor="creditLimit">Límite de Crédito (MXN)</Label>
                            <div className="flex bg-white dark:bg-slate-950 rounded-md ring-1 ring-slate-200 dark:ring-slate-800 focus-within:ring-2 focus-within:ring-blue-500">
                                <span className="flex items-center px-3 text-slate-500 border-r border-slate-200 dark:border-slate-800">$</span>
                                <Input
                                    id="creditLimit"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    {...register('creditLimit')}
                                    className="border-0 focus-visible:ring-0 shadow-none pl-3"
                                    placeholder="0.00"
                                />
                            </div>
                            <p className="text-[10px] text-slate-500">Deja en cero si no autorizas compras a crédito.</p>
                            {errors.creditLimit && <p className="text-xs text-red-500">{errors.creditLimit.message}</p>}
                        </div>

                        {/* Notas */}
                        <div className="space-y-2 col-span-2">
                            <Label htmlFor="notes">Notas Internas</Label>
                            <Textarea id="notes" {...register('notes')} placeholder="Preferencias, alergias, tipo de cliente frecuente, etc." />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white">
                            {isSubmitting ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Guardando...</>
                            ) : (
                                isEditing ? 'Guardar Cambios' : 'Registrar Cliente'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
