'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Search, Plus, FileEdit, ArchiveRestore, Archive, ChevronLeft, ChevronRight, UserCircle2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '@/lib/utils';
import { CustomerDialog } from '@/components/admin/customers/CustomerDialog';

interface Customer {
    id: string;
    code: string;
    name: string;
    email: string | null;
    phone: string | null;
    points: number;
    tier: string;
    isActive: boolean;
    balance: number;
    taxId: string | null;
}

export default function CustomersPage() {
    const router = useRouter();
    const { data: session } = useSession();
    
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>();

    const fetchCustomers = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/customers?search=${encodeURIComponent(searchTerm)}&page=${page}&limit=10`);
            if (res.ok) {
                const data = await res.json();
                setCustomers(data.customers);
                setTotalPages(data.pagination.totalPages || 1);
            } else {
                toast.error('Error al cargar clientes');
            }
        } catch (error) {
            toast.error('Error de conexión');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchCustomers();
        }, 300); // debounce
        return () => clearTimeout(timeoutId);
    }, [searchTerm, page]);

    const handleToggleStatus = async (id: string, currentBalance: number) => {
        if (currentBalance > 0) {
            toast.error('No se puede desactivar a un cliente con saldo pendiente.');
            return;
        }

        if (!confirm('¿Estás seguro de que deseas desactivar este cliente? Podrás ver su historial en ventas pasadas, pero no aparecerá en terminales nuevos.')) return;

        try {
            const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('Cliente desactivado');
                fetchCustomers();
            } else {
                const data = await res.json();
                toast.error(data.error || 'Error al desactivar el cliente');
            }
        } catch (error) {
            toast.error('Error de conexión');
        }
    };

    const getTierBadge = (tier: string) => {
        switch (tier) {
            case 'GOLD':
                return <Badge className="bg-amber-500 hover:bg-amber-600 font-bold border-none text-white"><Star className="w-3 h-3 mr-1" /> Oro</Badge>;
            case 'SILVER':
                return <Badge className="bg-slate-300 hover:bg-slate-400 font-bold border-none text-slate-800"><Star className="w-3 h-3 mr-1" /> Plata</Badge>;
            default:
                return <Badge className="bg-orange-700 hover:bg-orange-800 font-bold border-none text-white"><Star className="w-3 h-3 mr-1" /> Bronce</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <UserCircle2 className="w-8 h-8 text-blue-500" />
                        Directorio de Clientes
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Gestiona la base de datos de compradores, programas de lealtad (puntos) y créditos.
                    </p>
                </div>
                <Button 
                    onClick={() => {
                        setSelectedCustomer(undefined);
                        setIsDialogOpen(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Cliente
                </Button>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Buscar por nombre, código, email o teléfono..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setPage(1); // Reset page on search
                            }}
                            className="pl-9 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase text-xs font-semibold">
                            <tr>
                                <th className="px-6 py-4">Código / Nombre</th>
                                <th className="px-6 py-4">Contacto</th>
                                <th className="px-6 py-4 text-center">Nivel (Tier)</th>
                                <th className="px-6 py-4 text-right">Saldo Pendiente</th>
                                <th className="px-6 py-4 text-center">Facturación</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>
                                        <td className="px-6 py-4"><Skeleton className="h-10 w-40" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-6 w-32" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-6 w-20 mx-auto" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-6 w-24 ml-auto" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-6 w-20 mx-auto" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-8 w-24 ml-auto" /></td>
                                    </tr>
                                ))
                            ) : customers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <UserCircle2 className="w-12 h-12 text-slate-300 mb-2" />
                                            <p>No se encontraron clientes que coincidan con la búsqueda.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                customers.map((customer) => (
                                    <tr key={customer.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900 dark:text-white uppercase text-xs">{customer.code}</span>
                                                <span className="font-medium inline-block truncate max-w-[200px]">{customer.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col text-xs text-slate-500 dark:text-slate-400">
                                                {customer.email && <span>{customer.email}</span>}
                                                {customer.phone && <span>{customer.phone}</span>}
                                                {!customer.email && !customer.phone && <span className="italic">Sin contacto</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                {getTierBadge(customer.tier)}
                                                <span className="text-[10px] text-slate-500 font-semibold">{customer.points} pts</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`font-mono font-bold ${Number(customer.balance) > 0 ? 'text-red-500' : 'text-slate-500'}`}>
                                                {formatCurrency(Number(customer.balance))}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {customer.taxId && customer.email ? (
                                                <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/30">
                                                    ✔ Listo
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="border-slate-200 text-slate-500">
                                                    Incompleto
                                                </Badge>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => router.push(`/admin/customers/${customer.id}`)}
                                                className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                                            >
                                                Detalles
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleToggleStatus(customer.id, Number(customer.balance))}
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30"
                                            >
                                                Desactivar
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
                        <span className="text-sm text-slate-500">
                            Página {page} de {totalPages}
                        </span>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1 || isLoading}
                            >
                                <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages || isLoading}
                            >
                                Siguiente <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            <CustomerDialog 
                isOpen={isDialogOpen} 
                onClose={() => setIsDialogOpen(false)} 
                customer={selectedCustomer}
                onSuccess={fetchCustomers}
            />
        </div>
    );
}
