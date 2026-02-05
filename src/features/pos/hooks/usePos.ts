import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/dexie';
import { useCartStore } from '@/store/cartStore';
import { useEffect, useState } from 'react';

export function usePos() {
    const products = useLiveQuery(() => db.products.toArray());
    const { addItem, items, updateQuantity, removeItem, clearCart, total } = useCartStore();
    const [isLoading, setIsLoading] = useState(true);

    // Initial local seeding for demo
    useEffect(() => {
        const seedLocal = async () => {
            try {
                const count = await db.products.count();
                if (count === 0) {
                    await db.products.bulkAdd([
                        {
                            id: 'p1',
                            code: 'HUACH-01',
                            name: 'Huachinango Entero',
                            price: 280.00,
                            cost: 200.00,
                            stock: 15.5,
                            unit: 'kg',
                            categoryId: 'cat1',
                            isFresh: true,
                            isSeafood: false
                        },
                        {
                            id: 'p2',
                            code: 'CAM-01',
                            name: 'Camarón Grande s/c',
                            price: 350.00,
                            cost: 250.00,
                            stock: 20.0,
                            unit: 'kg',
                            categoryId: 'cat1',
                            isFresh: true,
                            isSeafood: true
                        },
                        {
                            id: 'p3',
                            code: 'MOJ-01',
                            name: 'Mojarra Tilapia',
                            price: 110.00,
                            cost: 80.00,
                            stock: 30.0,
                            unit: 'kg',
                            categoryId: 'cat1',
                            isFresh: true,
                            isSeafood: false
                        },
                        {
                            id: 'p4',
                            code: 'PULP-01',
                            name: 'Pulpo Cocido',
                            price: 420.00,
                            cost: 300.00,
                            stock: 8.5,
                            unit: 'kg',
                            categoryId: 'cat1',
                            isFresh: true,
                            isSeafood: true
                        },
                    ]);
                }
            } catch (err) {
                console.error("Failed to seed local database:", err);
            } finally {
                setIsLoading(false);
            }
        };
        seedLocal();
    }, []);

    return {
        products,
        isLoading: isLoading && !products,
        cart: {
            items,
            addItem,
            updateQuantity,
            removeItem,
            clearCart,
            total: total(),
        }
    };
}
