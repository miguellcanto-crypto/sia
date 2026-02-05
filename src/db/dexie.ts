import Dexie, { Table } from 'dexie';

// Interfaces mirroring the Prisma schema for offline use
export interface Product {
    id: string;
    code: string;
    name: string;
    price: number;
    cost: number;
    stock: number; // weight in kg
    unit: string;  // kg, lb, unit
    categoryId: string;
    categoryName?: string;
    isFresh: boolean;
    isSeafood: boolean;
    image?: string;
}

export interface SaleItem {
    productId: string;
    quantity: number; // weight or count
    price: number;
    subtotal: number;
}

export interface Sale {
    id?: string;
    localId: string; // Used to track sync status
    saleNumber?: string;
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
    status: 'COMPLETED' | 'PENDING' | 'CANCELLED';
    paymentMethod: 'CASH' | 'CARD' | 'TRANSFER' | 'OTHER';
    date: Date;
    userId: string;
    items: SaleItem[];
}

export class POSDatabase extends Dexie {
    products!: Table<Product>;
    sales!: Table<Sale>;

    constructor() {
        super('POSDatabase');
        this.version(2).stores({
            products: 'id, code, name, categoryId',
            sales: '++id, localId, status, date, userId'
        });
    }
}

export const db = new POSDatabase();
