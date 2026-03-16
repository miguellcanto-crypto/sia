'use client';

import { useState, Suspense } from 'react';
import { useEnterprisePOS } from '@/features/pos/hooks/useEnterprisePOS';
import { SearchProducts } from '@/features/pos/components/SearchProducts';
import { CashSessionModal } from '@/features/pos/components/CashSessionModal';
import { PaymentModal } from '@/features/pos/components/PaymentModal';
import { ParkedSalesModal } from '@/features/pos/components/ParkedSalesModal';
import { CloseSessionModal } from '@/features/pos/components/CloseSessionModal';
import { WeighableProductModal } from '@/features/pos/components/WeighableProductModal';
import { RevenueTicker } from '@/features/pos/components/RevenueTicker';
import { Cart } from '@/features/pos/components/Cart';
import { CustomerSelector } from '@/features/pos/components/CustomerSelector';
import { ProductCard } from '@/features/pos/components/ProductCard';
import {
    LayoutGrid,
    ShoppingCart,
    Package,
    User,
    ChevronRight,
    History,
    Settings,
    LogOut,
    Bell,
    Clock,
    Landmark
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function POSPage() {
    const {
        cashSession,
        cart,
        parkedSales,
        products,
        isLoading,
        isPaymentModalOpen,
        setIsPaymentModalOpen,
        handleCheckout,
        handleParkSale,
        handleResumeSale,
        handleCloseSession,
        refreshSession,
        refreshParkedSales
    } = useEnterprisePOS();

    const [isParkedModalOpen, setIsParkedModalOpen] = useState(false);
    const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
    const [selectedWeighableProduct, setSelectedWeighableProduct] = useState<any>(null);

    const handleAddToCart = (product: any) => {
        console.log('Adding to cart:', product.name, 'isWeighable:', product.isWeighable);
        const isWeighable = product.isWeighable || product.isweighable || product.unit?.toLowerCase() === 'kg';

        if (isWeighable) {
            setSelectedWeighableProduct(product);
        } else {
            cart.addItem(product);
        }
    };

    const handleParkCurrent = async () => {
        const name = prompt('Nombre de la venta (ej: Mesa 5):');
        if (name) {
            const result = await handleParkSale(name);
            if (result.error) alert(result.error);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
                <div className="space-y-4 text-center">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-slate-500 font-medium animate-pulse">Iniciando Estación de Trabajo...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans">
            {/* Header / Top Bar */}
            <header className="h-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 shrink-0">
                <div className="flex items-center gap-6">
                    <div className="bg-blue-600 p-2.5 rounded-2xl shadow-lg shadow-blue-500/20">
                        <Landmark className="text-white w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                            Punto de Venta
                            <span className="text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">SIA v2.0</span>
                        </h1>
                        <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <Clock className="w-3 h-3" />
                            {cashSession?.register?.name || 'Caja No Asignada'} • Terminal: {cashSession?.register?.code || '---'}
                        </p>
                    </div>
                </div>

                <div className="flex-1 max-w-2xl px-12">
                    <SearchProducts onSelect={handleAddToCart} />
                </div>

                <div className="flex items-center gap-4">
                    <RevenueTicker />
                    <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-2" />
                    <div className="flex items-center gap-3 pl-2">
                        <div className="text-right">
                            <p className="text-sm font-bold text-slate-900 dark:text-white">Marisquería Admin</p>
                            <p className="text-xs text-slate-500">Cajero Principal</p>
                        </div>
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-slate-800 dark:to-slate-700 rounded-2xl flex items-center justify-center border border-white dark:border-slate-700 shadow-sm overflow-hidden">
                            <User className="text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 flex overflow-hidden p-6 gap-6">
                {/* Product Section */}
                <section className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="p-8 pb-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                                <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h2 className="text-xl font-bold">Catálogo de Productos</h2>
                        </div>
                        <div className="flex gap-2">
                            {['Todos', 'Pescados', 'Mariscos', 'Bebidas'].map((cat) => (
                                <button key={cat} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${cat === 'Todos' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                                    }`}>
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 pt-4 custom-scrollbar">
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                            {products.length > 0 ? (
                                products.map(product => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                        onAddToCart={handleAddToCart}
                                    />
                                ))
                            ) : (
                                [1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                    <motion.div
                                        key={i}
                                        whileHover={{ y: -5 }}
                                        className="aspect-square bg-slate-50 dark:bg-slate-800/50 rounded-3xl animate-pulse"
                                    />
                                ))
                            )}
                        </div>
                    </div>
                </section>

                {/* Sidebar Cart Section */}
                <aside className="w-[450px] flex flex-col bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="p-8 pb-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                                <ShoppingCart className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                            </div>
                            <h2 className="text-xl font-bold">Venta Actual</h2>
                        </div>
                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-3 py-1 rounded-full text-xs font-bold">
                            {cart.items.length} Items
                        </span>
                    </div>

                    <CustomerSelector />

                    <div className="flex-1 overflow-hidden px-8">
                        <Cart />
                    </div>

                    <div className="p-8 mt-auto bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800">
                        <div className="space-y-4 mb-8">
                            <div className="flex justify-between text-slate-500 uppercase text-[10px] font-black tracking-widest">
                                <span>Subtotal</span>
                                <span>${cart.total().toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-slate-500 uppercase text-[10px] font-black tracking-widest">
                                <span>IVA (16%)</span>
                                <span>$0.00</span>
                            </div>
                            <div className="flex justify-between items-end border-t border-slate-200 dark:border-slate-700 pt-4">
                                <span className="text-sm font-bold">TOTAL</span>
                                <span className="text-4xl font-black text-blue-600 dark:text-blue-400 font-mono tracking-tighter">
                                    ${cart.total().toFixed(2)}
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={() => setIsPaymentModalOpen(true)}
                            disabled={cart.items.length === 0}
                            className="w-full py-6 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xl shadow-2xl shadow-blue-500/30 flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50 disabled:grayscale"
                        >
                            Procesar Pago (F12)
                            <ChevronRight className="w-6 h-6" />
                        </button>

                        <div className="grid grid-cols-3 gap-3 mt-4">
                            <button
                                onClick={handleParkCurrent}
                                disabled={cart.items.length === 0}
                                title="Poner venta en espera"
                                className="py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors disabled:opacity-50"
                            >
                                <History className="w-4 h-4" /> Espera
                            </button>
                            <button
                                onClick={() => setIsParkedModalOpen(true)}
                                title="Ver ventas pausadas"
                                className="py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors"
                            >
                                <Package className="w-4 h-4" /> ({parkedSales.length})
                            </button>
                            <button
                                onClick={() => setIsCloseModalOpen(true)}
                                title="Cerrar turno y arquear caja"
                                className="py-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
                            >
                                <LogOut className="w-4 h-4" /> Cerrar
                            </button>
                        </div>
                    </div>
                </aside>
            </main>

            {/* Modals */}
            <CashSessionModal
                isOpen={!cashSession && !isLoading}
                onSessionCreated={refreshSession}
            />

            <PaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                total={cart.total()}
                onSubmit={handleCheckout}
            />

            <ParkedSalesModal
                isOpen={isParkedModalOpen}
                onClose={() => setIsParkedModalOpen(false)}
                parkedSales={parkedSales}
                onResume={async (s) => {
                    await handleResumeSale(s);
                    setIsParkedModalOpen(false);
                }}
                onDelete={async (id) => {
                    await fetch(`/api/sales/park?id=${id}`, { method: 'DELETE' });
                    refreshParkedSales();
                }}
            />

            <CloseSessionModal
                isOpen={isCloseModalOpen}
                onClose={() => setIsCloseModalOpen(false)}
                expectedAmount={cashSession?.expectedAmount || 0}
                onConfirm={async (amount, notes) => {
                    const result = await handleCloseSession(amount, notes);
                    if (result.success) {
                        setIsCloseModalOpen(false);
                    } else {
                        alert(result.error);
                    }
                }}
            />

            <WeighableProductModal
                isOpen={!!selectedWeighableProduct}
                onClose={() => setSelectedWeighableProduct(null)}
                product={selectedWeighableProduct}
                onConfirm={(quantity) => {
                    if (selectedWeighableProduct) {
                        cart.addWeightedItem(selectedWeighableProduct, quantity);
                        setSelectedWeighableProduct(null);
                    }
                }}
            />

            {/* Global keyboard shortcuts display */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-md px-6 py-2.5 rounded-full border border-slate-700 text-[10px] font-bold text-slate-400 flex items-center gap-6 shadow-2xl pointer-events-none">
                <span className="flex items-center gap-1.5"><kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-white border border-slate-700">F2</kbd> Nueva</span>
                <span className="flex items-center gap-1.5"><kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-white border border-slate-700">F3</kbd> Buscar</span>
                <span className="flex items-center gap-1.5"><kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-white border border-slate-700">F12</kbd> Pagar</span>
                <span className="flex items-center gap-1.5"><kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-white border border-slate-700">ESC</kbd> Cancelar</span>
            </div>
        </div>
    );
}

