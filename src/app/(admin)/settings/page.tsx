import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { SettingsForm } from '@/features/settings/components/SettingsForm';
import { ShieldAlert } from 'lucide-react';

export const metadata = {
    title: 'Configuración - SIA POS',
};

export default async function SettingsPage() {
    const session = await getServerSession(authOptions);
    const userPermissions = (session?.user as any)?.permissions || [];

    if (!Array.isArray(userPermissions) || !userPermissions.includes('MANAGE_SETTINGS')) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
                <ShieldAlert className="w-16 h-16 text-red-500" />
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Acceso Denegado</h1>
                <p className="text-slate-600 dark:text-slate-400 max-w-md">
                    No tienes el permiso necesario (MANAGE_SETTINGS) para ver o modificar la configuración del sistema.
                </p>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 flex flex-col h-full bg-slate-50 dark:bg-transparent relative">
            <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Configuración del Sistema</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Administra las variables globales y comportamiento del POS</p>
                </div>
            </div>

            <div className="flex-1 overflow-auto">
                <SettingsForm />
            </div>
        </div>
    );
}
