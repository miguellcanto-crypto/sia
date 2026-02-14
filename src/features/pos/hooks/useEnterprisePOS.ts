import { useState, useEffect, useCallback } from 'react';
import { useCartStore } from '@/store/cartStore';
import { useSession } from 'next-auth/react';

export function useEnterprisePOS() {
    const { data: session } = useSession();
    const cart = useCartStore();
    const [cashSession, setCashSession] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [parkedSales, setParkedSales] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);

    const fetchProducts = useCallback(async () => {
        try {
            const res = await fetch('/api/products', { cache: 'no-store' });
            const data = await res.json();
            setProducts(Array.isArray(data.products) ? data.products : []);
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    }, []);

    const fetchCurrentSession = useCallback(async () => {
        try {
            const res = await fetch('/api/cash/session');
            if (res.ok) {
                const data = await res.json();
                setCashSession(data);
            } else {
                setCashSession(null);
            }
        } catch (error) {
            console.error('Error fetching cash session:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchParkedSales = useCallback(async () => {
        try {
            const res = await fetch('/api/sales/park');
            const data = await res.json();
            setParkedSales(data);
        } catch (error) {
            console.error('Error fetching parked sales:', error);
        }
    }, []);

    useEffect(() => {
        fetchCurrentSession();
        fetchParkedSales();
        fetchProducts();
    }, [fetchCurrentSession, fetchParkedSales, fetchProducts]);

    const handleParkSale = async (name: string) => {
        if (cart.items.length === 0) return { error: 'Cart is empty' };
        try {
            const res = await fetch('/api/sales/park', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    items: cart.items,
                    subtotal: cart.total()
                })
            });
            if (res.ok) {
                cart.clearCart();
                fetchParkedSales();
                return { success: true };
            }
            return { error: 'Failed to park sale' };
        } catch (error) {
            return { error: 'Error parking sale' };
        }
    };

    const handleResumeSale = async (parkedSale: any) => {
        // Clear current cart and load items from parked sale
        cart.clearCart();
        parkedSale.items.forEach((item: any) => {
            // Note: useCartStore addItem expects a Product, but we stored items in JSON
            // We'll need to adapt the store or ensure the JSON has all fields
            cart.addItem(item);
        });

        // Remove from DB
        await fetch(`/api/sales/park?id=${parkedSale.id}`, { method: 'DELETE' });
        fetchParkedSales();
        return { success: true };
    };

    const handleCheckout = async (paymentData: any) => {
        if (!cashSession) return { error: 'No open cash session' };

        try {
            const res = await fetch('/api/sales', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: cart.items.map(i => ({ productId: i.id, quantity: i.quantity })),
                    paymentMethod: paymentData.method,
                    discount: paymentData.discount,
                    tip: paymentData.tip,
                    tipPercent: paymentData.tipPercent,
                    cashSessionId: cashSession.id,
                    notes: paymentData.notes
                })
            });

            const result = await res.json();
            if (res.ok) {
                cart.clearCart();
                return { success: true, sale: result };
            } else {
                return { error: result.error };
            }
        } catch (error) {
            return { error: 'Failed to process sale' };
        }
    };

    const handleCloseSession = async (actualAmount: number, notes: string) => {
        if (!cashSession) return { error: 'No open session' };
        try {
            const res = await fetch('/api/cash/session/close', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: cashSession.id,
                    closingAmount: actualAmount,
                    closingNotes: notes
                })
            });
            if (res.ok) {
                setCashSession(null);
                return { success: true };
            }
            return { error: 'Failed to close session' };
        } catch (error) {
            return { error: 'Error closing session' };
        }
    };

    return {
        session,
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
        refreshSession: fetchCurrentSession,
        refreshParkedSales: fetchParkedSales
    };
}
