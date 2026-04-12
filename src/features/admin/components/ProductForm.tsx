'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { useEffect, useState } from 'react';
import { playStockAlertSound } from '@/lib/audio-alerts';

const productSchema = z.object({
    code: z.string().min(3),
    name: z.string().min(3),
    unit: z.string().min(1),
    categoryId: z.string().min(1),
    price: z.number().min(0.01),
    cost: z.number().min(0.01),
    stock: z.number().min(0),
    criticalStock: z.number().min(0),
    isWeighable: z.boolean(),
});

type ProductFormValues = z.infer<typeof productSchema>;

export function ProductForm({
    categories,
    onSuccess,
    initialData
}: {
    categories: any[],
    onSuccess: () => void,
    initialData?: any
}) {
    const form = useForm<ProductFormValues>({
        resolver: zodResolver(productSchema) as any,
        defaultValues: {
            code: initialData?.code || '',
            name: initialData?.name || '',
            unit: initialData?.unit || 'kg',
            categoryId: initialData?.categoryId || '',
            price: initialData?.price ? Number(initialData.price) : 0,
            cost: initialData?.cost ? Number(initialData.cost) : 0,
            stock: initialData?.stock ? Number(initialData.stock) : 0,
            criticalStock: initialData?.criticalStock ? Number(initialData.criticalStock) : 0,
            isWeighable: initialData ? !!initialData.isWeighable : true,
        }
    });

    useEffect(() => {
        if (initialData) {
            form.reset({
                code: initialData.code,
                name: initialData.name,
                unit: initialData.unit,
                categoryId: initialData.categoryId,
                price: Number(initialData.price),
                cost: Number(initialData.cost),
                stock: Number(initialData.stock),
                criticalStock: Number(initialData.criticalStock),
                isWeighable: !!initialData.isWeighable,
            });
        }
    }, [initialData, form]);

    const onSubmit = async (values: ProductFormValues) => {
        try {
            const url = initialData ? `/api/products/${initialData.id}` : '/api/products';
            const method = initialData ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            });

            if (res.ok) {
                playStockAlertSound();
                onSuccess();
                form.reset();
            } else {
                const error = await res.json();
                alert(error.error || 'Error al crear producto');
            }
        } catch (error) {
            console.error('Submit error:', error);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="code"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>SKU / Código</FormLabel>
                                <FormControl>
                                    <Input placeholder="PES-HUA-01" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="unit"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Unidad de Medida</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecciona" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="kg">Kilogramo (kg)</SelectItem>
                                        <SelectItem value="pza">Pieza (pza)</SelectItem>
                                        <SelectItem value="lb">Libra (lb)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nombre del Producto</FormLabel>
                            <FormControl>
                                <Input placeholder="Huachinango Entero" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Categoría</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecciona categoría" />
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
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Precio de Venta</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        {...field}
                                        onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="cost"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Costo de Compra</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        {...field}
                                        onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="stock"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Stock Inicial</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        step="0.001"
                                        {...field}
                                        onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="criticalStock"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Stock Crítico (Alerta)</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        step="0.001"
                                        {...field}
                                        onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="flex justify-end pt-4">
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700 w-full md:w-auto">
                        Guardar Producto
                    </Button>
                </div>
            </form>
        </Form>

    );
}
