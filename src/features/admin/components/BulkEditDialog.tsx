'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const bulkSchema = z.object({
    price: z.union([z.number(), z.literal('')]).optional(),
    categoryId: z.string().optional(),
});




interface BulkFormValues {
    price?: number | '';
    categoryId?: string;
}

export function BulkEditDialog({
    selectedIds,
    categories,
    isOpen,
    onOpenChange,
    onSuccess
}: {
    selectedIds: string[];
    categories: any[];
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}) {
    const [loading, setLoading] = useState(false);

    const form = useForm<BulkFormValues>({
        resolver: zodResolver(bulkSchema) as any,
        defaultValues: {
            price: '',
            categoryId: ''
        }
    });


    const onSubmit = async (values: BulkFormValues) => {
        if (!values.price && !values.categoryId) {
            alert('Selecciona al menos un campo para actualizar');
            return;
        }

        setLoading(true);
        try {
            const cleanData = Object.fromEntries(
                Object.entries(values).filter(([_, v]) => v !== undefined && v !== '')
            );

            const res = await fetch('/api/products/bulk', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: selectedIds, data: cleanData }),
            });

            if (res.ok) {
                onSuccess();
                onOpenChange(false);
                form.reset();
            }
        } catch (error) {
            console.error('Bulk update error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Editar {selectedIds.length} Productos</DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField
                            control={form.control}
                            name="categoryId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nueva Categoría (Opcional)</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Sin cambios" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {categories.map((cat) => (
                                                <SelectItem key={cat.id} value={cat.id}>
                                                    {cat.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="price"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nuevo Precio (Opcional)</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            placeholder="Ej: 299.00"
                                            {...field}
                                            onChange={(e) => field.onChange(e.target.value === '' ? '' : e.target.valueAsNumber)}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="pt-4">
                            <Button
                                type="submit"
                                disabled={loading}
                                className="bg-blue-600 hover:bg-blue-700 w-full"
                            >
                                {loading ? 'Actualizando...' : 'Actualizar Productos'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
