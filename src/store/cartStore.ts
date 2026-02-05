import { create } from 'zustand';
import { Product } from '@/db/dexie';

export interface CartItem extends Product {
    quantity: number;
    subtotal: number;
}

interface CartState {
    items: CartItem[];
    addItem: (product: Product) => void;
    addWeightedItem: (product: Product, quantity: number) => void;
    removeItem: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    total: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
    items: [],
    addItem: (product) => {
        const { items } = get();
        const existing = items.find((i) => i.id === product.id);
        if (existing) {
            set({
                items: items.map((i) =>
                    i.id === product.id
                        ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * Number(i.price) }
                        : i
                ),
            });
        } else {
            set({
                items: [...items, { ...product, quantity: 1, subtotal: Number(product.price) }],
            });
        }
    },
    addWeightedItem: (product, quantity) => {
        const { items } = get();
        const existing = items.find((i) => i.id === product.id);
        if (existing) {
            set({
                items: items.map((i) =>
                    i.id === product.id
                        ? { ...i, quantity: i.quantity + quantity, subtotal: (i.quantity + quantity) * Number(i.price) }
                        : i
                ),
            });
        } else {
            set({
                items: [...items, { ...product, quantity, subtotal: quantity * Number(product.price) }],
            });
        }
    },
    removeItem: (productId) => {
        set({ items: get().items.filter((i) => i.id !== productId) });
    },
    updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
            get().removeItem(productId);
            return;
        }
        set({
            items: get().items.map((i) =>
                i.id === productId ? { ...i, quantity, subtotal: quantity * Number(i.price) } : i
            ),
        });
    },
    clearCart: () => set({ items: [] }),
    total: () => get().items.reduce((acc, item) => acc + item.subtotal, 0),
}));
