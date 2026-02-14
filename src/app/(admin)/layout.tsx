import { Sidebar } from '@/components/Sidebar';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-y-auto">
                <div className="h-full">
                    {children}
                </div>
            </main>
        </div>
    );
}
