'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Fish, Lock, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const resetSchema = z.object({
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
    confirmPassword: z.string().min(1, 'La confirmación es requerida'),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
});

type ResetFormValues = z.infer<typeof resetSchema>;

function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ResetFormValues>({
        resolver: zodResolver(resetSchema),
    });

    const onSubmit = async (data: ResetFormValues) => {
        if (!token) {
            setErrorMessage('Token de recuperación faltante');
            setStatus('error');
            return;
        }

        setIsLoading(true);
        setStatus('idle');
        setErrorMessage(null);

        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password: data.password }),
            });

            const result = await response.json();

            if (!response.ok) {
                setErrorMessage(result.error === 'TOKEN_INVALIDO_O_EXPIRADO'
                    ? 'El enlace ha expirado o es inválido'
                    : 'Error al restablecer la contraseña');
                setStatus('error');
            } else {
                setStatus('success');
                setTimeout(() => router.push('/auth/login'), 3000);
            }
        } catch (err) {
            setErrorMessage('Error de conexión');
            setStatus('error');
        } finally {
            setIsLoading(false);
        }
    };

    if (status === 'success') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0f172a] relative overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]" />
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 max-w-md w-full text-center z-10"
                >
                    <CheckCircle2 className="w-16 h-16 text-teal-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2">¡Contraseña Restablecida!</h2>
                    <p className="text-slate-400">Tu contraseña ha sido actualizada con éxito. Serás redirigido al inicio de sesión en unos segundos.</p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0f172a] relative overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md p-8 relative z-10"
            >
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-8">
                    <div className="flex flex-col items-center mb-10">
                        <div className="w-14 h-14 bg-gradient-to-tr from-blue-500 to-teal-400 rounded-2xl flex items-center justify-center mb-4">
                            <Lock className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-white">Nueva Contraseña</h1>
                        <p className="text-slate-400 mt-2 text-sm text-center">Ingresa tu nueva contraseña para recuperar el acceso</p>
                    </div>

                    {!token ? (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-center">
                            <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p>Enlace de recuperación inválido o expirado.</p>
                            <button
                                onClick={() => router.push('/auth/login')}
                                className="mt-4 text-sm font-semibold text-blue-400 hover:text-blue-300"
                            >
                                Volver al inicio
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <AnimatePresence>
                                {status === 'error' && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm flex items-center gap-3"
                                    >
                                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                        <span>{errorMessage}</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Nueva Contraseña</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                        <input
                                            {...register('password')}
                                            type="password"
                                            placeholder="••••••••"
                                            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                                        />
                                    </div>
                                    {errors.password && <p className="text-red-400 text-xs mt-1 ml-1">{errors.password.message}</p>}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Confirmar Contraseña</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                        <input
                                            {...register('confirmPassword')}
                                            type="password"
                                            placeholder="••••••••"
                                            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                                        />
                                    </div>
                                    {errors.confirmPassword && <p className="text-red-400 text-xs mt-1 ml-1">{errors.confirmPassword.message}</p>}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-500 hover:to-teal-400 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-500/20 transform active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                            >
                                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Actualizar Contraseña'}
                            </button>
                        </form>
                    )}
                </div>
            </motion.div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#0f172a]"><Loader2 className="w-8 h-8 animate-spin text-teal-500" /></div>}>
            <ResetPasswordContent />
        </Suspense>
    );
}
