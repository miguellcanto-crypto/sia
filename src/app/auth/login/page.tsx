'use client';

import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Fish, Lock, Mail, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const loginSchema = z.object({
    email: z.string().email('Correo electrónico inválido'),
    password: z.string().min(1, 'La contraseña es requerida'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get('callbackUrl') || '/pos';
    const error = searchParams.get('error');

    const [isLoading, setIsLoading] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);
    const { data: session, status } = useSession();

    useEffect(() => {
        if (status === 'authenticated') {
            router.push('/pos');
        }
    }, [status, router]);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormValues) => {
        setIsLoading(true);
        setAuthError(null);

        try {
            const result = await signIn('credentials', {
                email: data.email,
                password: data.password,
                redirect: false,
                callbackUrl,
            });

            if (result?.error) {
                // Map NextAuth errors to user-friendly messages
                const errorMap: Record<string, string> = {
                    'CREDENTIALS_INVALIDAS': 'Credenciales inválidas',
                    'USUARIO_NO_ENCONTRADO': 'Usuario no encontrado',
                    'CONTRASENA_INCORRECTA': 'Contraseña incorrecta',
                    'CUENTA_DESHABILITADA': 'Esta cuenta ha sido deshabilitada',
                    'LIMITE_DE_INTENTOS_EXCEDIDO': 'Demasiados intentos. Cuenta bloqueada por 15 minutos.',
                };
                setAuthError(errorMap[result.error] || 'Ocurrió un error al iniciar sesión');
            } else {
                // Use the URL provided by NextAuth if available, or fallback to callbackUrl
                const targetUrl = result?.url || callbackUrl;
                window.location.href = targetUrl;
            }
        } catch (err) {
            setAuthError('Error de conexión con el servidor');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0f172a] relative overflow-hidden">
            {/* Background animated gradients */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-600/20 rounded-full blur-[120px] animate-pulse delay-700" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md p-8 relative z-10"
            >
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-8">
                    <div className="flex flex-col items-center mb-10">
                        <div className="w-16 h-16 bg-gradient-to-tr from-blue-500 to-teal-400 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 mb-4 rotate-3 hover:rotate-0 transition-transform duration-300">
                            <Fish className="w-10 h-10 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">SIA POS</h1>
                        <p className="text-slate-400 mt-2 text-sm">Ingreso al sistema de ventas</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <AnimatePresence>
                            {(authError || error) && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm flex items-center gap-3 overflow-hidden"
                                >
                                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                    <span>{authError || 'Error de autenticación'}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Correo Electrónico</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                                    <input
                                        {...register('email')}
                                        type="email"
                                        placeholder="ejemplo@email.com"
                                        className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all"
                                    />
                                </div>
                                {errors.email && <p className="text-red-400 text-xs mt-1 ml-1">{errors.email.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Contraseña</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                                    <input
                                        {...register('password')}
                                        type="password"
                                        placeholder="••••••••"
                                        className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all"
                                    />
                                </div>
                                {errors.password && <p className="text-red-400 text-xs mt-1 ml-1">{errors.password.message}</p>}
                            </div>
                        </div>

                        <div className="flex items-center justify-between px-1">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-blue-500 focus:ring-blue-500/20" />
                                <span className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors">Recordarme</span>
                            </label>
                            <button type="button" className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium">
                                ¿Olvidaste tu contraseña?
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-500 hover:to-teal-400 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-500/20 transform active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed group overflow-hidden relative"
                        >
                            {isLoading ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                <>
                                    <span>Iniciar Sesión</span>
                                    <motion.div
                                        className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"
                                    />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center text-slate-500 text-sm mt-8">
                    © 2026 SIA - Software de Inventario y Adquisiciones
                </p>
            </motion.div>
        </div>
    );
}
