'use client';

import { useEffect, useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Plus,
    Search,
    AlertTriangle,
    History,
    MoreHorizontal,
    ArrowLeft,
    ArrowRight,
    Download
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { exportToCsv } from '@/lib/exportUtils';


import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog';
import { ProductForm } from '@/features/admin/components/ProductForm';
import { ProductTimeline } from '@/features/admin/components/ProductTimeline';
import { BulkEditDialog } from '@/features/admin/components/BulkEditDialog';

export default function InventoryPage() {
    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [search, setSearch] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isBulkOpen, setIsBulkOpen] = useState(false);


    // History & Edit State
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);

    const take = 10;

    const toggleSelectAll = () => {
        if (selectedIds.length === products.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(products.map(p => p.id));
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleBulkAction = async (action: string, data?: any) => {
        try {
            const res = await fetch('/api/products/bulk', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: selectedIds, data })
            });
            if (res.ok) {
                setSelectedIds([]);
                fetchProducts();
            }
        } catch (e) { console.error(e); }
    };


    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, [page]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const skip = page * take;
            const res = await fetch(`/api/products?skip=${skip}&take=${take}&all=true`, { cache: 'no-store' });
            const data = await res.json();
            setProducts(data.products || []);
            setTotal(data.total || 0);
        } catch (error) {
            console.error('Failed to fetch products:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/categories');
            const data = await res.json();
            setCategories(data);
        } catch (e) { console.error(e); }
    };

    const totalPages = Math.ceil(total / take);

    return (
        <div className="p-6 space-y-6 bg-slate-50/50 dark:bg-slate-950/50 min-h-screen">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        Inventario Marisquería
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        Gestiona tus niveles de stock, precios y trazabilidad.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={() => exportToCsv('inventario-marisqueria.csv', products)}
                        className="border-slate-200 dark:border-slate-800"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Exportar
                    </Button>
                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>

                        <DialogTrigger asChild>
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20">
                                <Plus className="w-4 h-4 mr-2" />
                                Nuevo Producto
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Registrar Nuevo Producto Seafood</DialogTitle>
                            </DialogHeader>
                            <ProductForm
                                categories={categories}
                                onSuccess={() => {
                                    setIsAddOpen(false);
                                    fetchProducts();
                                }}
                            />
                        </DialogContent>
                    </Dialog>
                </div>
            </div>


            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-200/60 dark:border-slate-800/60">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">{total}</Badge>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{total} ítems activos</div>
                    </CardContent>
                </Card>
                <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-200/60 dark:border-slate-800/60">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-orange-600 dark:text-orange-400">Stock Crítico</CardTitle>
                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                            {products.filter(p => Number(p.stock) <= Number(p.criticalStock)).length}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Inventory Table Container */}
            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-slate-200/60 dark:border-slate-800/60 shadow-xl">
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Buscar por nombre o SKU..."
                                className="pl-10 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        {selectedIds.length > 0 && (
                            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                                <span className="text-sm font-medium text-slate-500">{selectedIds.length} seleccionados</span>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm" className="bg-blue-50 text-blue-700 border-blue-200">
                                            Acciones Masivas
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem onClick={() => handleBulkAction('activate', { isActive: true })}>
                                            Activar Seleccionados
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleBulkAction('deactivate', { isActive: false })}>
                                            Desactivar Seleccionados
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setIsBulkOpen(true)}>
                                            Editar Selección...
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border border-slate-200/60 dark:border-slate-800/60 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
                                <TableRow>
                                    <TableHead className="w-12">
                                        <Checkbox
                                            checked={selectedIds.length === products.length && products.length > 0}
                                            onCheckedChange={toggleSelectAll}
                                        />
                                    </TableHead>
                                    <TableHead className="font-bold">SKU</TableHead>
                                    <TableHead className="font-bold">Producto</TableHead>
                                    <TableHead className="font-bold">Categoría</TableHead>
                                    <TableHead className="font-bold text-right">Precio/Costo</TableHead>
                                    <TableHead className="font-bold text-center">Stock Actual</TableHead>
                                    <TableHead className="font-bold">Estado</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="h-24 text-center">
                                            Cargando inventario...
                                        </TableCell>
                                    </TableRow>
                                ) : products.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="h-24 text-center">
                                            No se encontraron productos.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    products.map((p) => {
                                        const isCritical = Number(p.stock) <= Number(p.criticalStock);
                                        const isLow = Number(p.stock) <= Number(p.minStock);

                                        return (
                                            <TableRow key={p.id} className={cn(
                                                "hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors",
                                                selectedIds.includes(p.id) && "bg-blue-50/50 dark:bg-blue-900/10",
                                                !p.isActive && "opacity-50 grayscale-[0.5]"
                                            )}>
                                                <TableCell>
                                                    <Checkbox
                                                        checked={selectedIds.includes(p.id)}
                                                        onCheckedChange={() => toggleSelect(p.id)}
                                                    />
                                                </TableCell>
                                                <TableCell className="font-mono text-xs text-slate-500">{p.code}</TableCell>
                                                <TableCell className="font-medium">
                                                    {p.name}
                                                    {!p.isActive && <span className="ml-2 text-[10px] font-bold text-slate-400 italic">(Desactivado)</span>}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="font-normal">
                                                        {p.category?.name || 'Varios'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-blue-600">${Number(p.price).toFixed(2)}</span>
                                                        <span className="text-xs text-slate-400">Costo: ${Number(p.cost).toFixed(2)}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center font-bold">
                                                    {Number(p.stock).toFixed(3)} {p.unit}
                                                </TableCell>
                                                <TableCell>
                                                    {!p.isActive ? (
                                                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">INACTIVO</Badge>
                                                    ) : isCritical ? (
                                                        <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">CRÍTICO</Badge>
                                                    ) : isLow ? (
                                                        <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">BAJO</Badge>
                                                    ) : (
                                                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">OK</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            title="Historial"
                                                            onClick={() => {
                                                                setSelectedProduct({ id: p.id, name: p.name });
                                                                setIsHistoryOpen(true);
                                                            }}
                                                        >
                                                            <History className="w-4 h-4 text-slate-400" />
                                                        </Button>

                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon">
                                                                    <MoreHorizontal className="w-4 h-4 text-slate-400" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem onClick={() => {
                                                                    setSelectedProduct(p);
                                                                    setIsEditOpen(true);
                                                                }}>
                                                                    Editar Producto
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => {
                                                                    setSelectedProduct({ id: p.id, name: p.name });
                                                                    setIsHistoryOpen(true);
                                                                }}>
                                                                    Ver Historial
                                                                </DropdownMenuItem>

                                                                {p.isActive ? (
                                                                    <DropdownMenuItem
                                                                        className="text-orange-600"
                                                                        onClick={async () => {
                                                                            if (confirm('¿Estás seguro de desactivar este producto? Dejará de aparecer en el POS.')) {
                                                                                await fetch(`/api/products/${p.id}`, {
                                                                                    method: 'PATCH',
                                                                                    headers: { 'Content-Type': 'application/json' },
                                                                                    body: JSON.stringify({ isActive: false })
                                                                                });
                                                                                fetchProducts();
                                                                            }
                                                                        }}
                                                                    >
                                                                        Desactivar Producto
                                                                    </DropdownMenuItem>
                                                                ) : (
                                                                    <DropdownMenuItem
                                                                        className="text-green-600"
                                                                        onClick={async () => {
                                                                            await fetch(`/api/products/${p.id}`, {
                                                                                method: 'PATCH',
                                                                                headers: { 'Content-Type': 'application/json' },
                                                                                body: JSON.stringify({ isActive: true })
                                                                            });
                                                                            fetchProducts();
                                                                        }}
                                                                    >
                                                                        Activar Producto
                                                                    </DropdownMenuItem>
                                                                )}

                                                                <DropdownMenuItem
                                                                    className="text-red-600 font-bold"
                                                                    onClick={async () => {
                                                                        if (confirm('¡ADVERTENCIA! Esta acción ELIMINARÁ el producto permanentemente de la base de datos. Esta acción no se puede deshacer. ¿Deseas continuar?')) {
                                                                            const res = await fetch(`/api/products/${p.id}`, { method: 'DELETE' });
                                                                            const data = await res.json();
                                                                            if (!res.ok) {
                                                                                alert(data.error || 'Error al eliminar el producto');
                                                                            } else {
                                                                                fetchProducts();
                                                                            }
                                                                        }
                                                                    }}
                                                                >
                                                                    Eliminar permanentemente
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between space-x-2 py-4">
                        <div className="text-sm text-slate-500">
                            Mostrando {products.length} de {total} productos
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                disabled={page === 0}
                            >
                                <ArrowLeft className="w-4 h-4 mr-1" /> Anterior
                            </Button>
                            <span className="text-sm font-medium">Página {page + 1} de {totalPages}</span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                disabled={page >= totalPages - 1}
                            >
                                Siguiente <ArrowRight className="w-4 h-4 ml-1" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Robustness Add-ons */}
            <ProductTimeline
                productId={selectedProduct?.id || ''}
                productName={selectedProduct?.name || ''}
                isOpen={isHistoryOpen}
                onOpenChange={setIsHistoryOpen}
            />

            <BulkEditDialog
                selectedIds={selectedIds}
                categories={categories}
                isOpen={isBulkOpen}
                onOpenChange={setIsBulkOpen}
                onSuccess={() => {
                    setSelectedIds([]);
                    fetchProducts();
                }}
            />

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Editar Producto: {selectedProduct?.name}</DialogTitle>
                    </DialogHeader>
                    {selectedProduct && (
                        <ProductForm
                            categories={categories}
                            initialData={selectedProduct}
                            onSuccess={() => {
                                setIsEditOpen(false);
                                fetchProducts();
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
