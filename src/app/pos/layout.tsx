import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Sidebar from '@/components/Sidebar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'POS PWA',
    description: 'Point of Sale System',
};

export default function POSLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen bg-slate-100 dark:bg-slate-900">
            <Sidebar />
            <main className="flex-1 overflow-y-auto p-4 md:p-6">
                {children}
            </main>
        </div>
    );
}
