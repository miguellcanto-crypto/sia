'use client';

import { useState, useEffect, Suspense } from 'react';
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

function LoginContent() {
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
        <div className="min-h-screen flex items-center justify-center bg-sidebar relative overflow-hidden">
            {/* Background animated gradients */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-400/10 rounded-full blur-[120px] animate-pulse delay-700" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md p-8 relative z-10"
            >
                <div className="bg-card border border-border-subtle rounded-[2.5rem] shadow-2xl p-10">
                    <div className="flex flex-col items-center mb-10">
                        <div className="w-32 h-32 flex items-center justify-center mb-4 transition-transform duration-300 hover:scale-105">
                            <img src="/Logo_Marisqueria.png" alt="Logo Marisqueria" className="w-full h-full object-contain drop-shadow-xl" />
                        </div>
                        <h1 className="text-3xl font-black text-foreground tracking-tight">SIA POS</h1>
                        <p className="text-muted mt-2 text-sm font-medium">Ingreso al sistema de ventas</p>
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
                                <label className="text-xs font-bold text-muted uppercase tracking-wider ml-1">Correo Electrónico</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-accent transition-colors" />
                                    <input
                                        {...register('email')}
                                        type="email"
                                        placeholder="ejemplo@email.com"
                                        className="w-full bg-slate-50 border-2 border-border-subtle rounded-2xl py-4 pl-12 pr-4 text-foreground font-medium placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-accent/10 focus:border-accent transition-all"
                                    />
                                </div>
                                {errors.email && <p className="text-red-500 text-xs mt-1 ml-1 font-medium">{errors.email.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted uppercase tracking-wider ml-1">Contraseña</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-accent transition-colors" />
                                    <input
                                        {...register('password')}
                                        type="password"
                                        placeholder="••••••••"
                                        className="w-full bg-slate-50 border-2 border-border-subtle rounded-2xl py-4 pl-12 pr-4 text-foreground font-medium placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-accent/10 focus:border-accent transition-all"
                                    />
                                </div>
                                {errors.password && <p className="text-red-500 text-xs mt-1 ml-1 font-medium">{errors.password.message}</p>}
                            </div>
                        </div>

                        <div className="flex items-center justify-between px-1">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" className="w-4 h-4 rounded border-border-subtle bg-slate-50 text-accent focus:ring-accent/20" />
                                <span className="text-xs text-muted font-medium transition-colors">Recordarme</span>
                            </label>
                            <button type="button" className="text-xs text-accent hover:text-accent/80 transition-colors font-bold">
                                ¿Olvidaste tu contraseña?
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-accent hover:bg-accent/90 text-white font-black text-lg py-4 rounded-2xl shadow-xl shadow-accent/20 transform active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed group overflow-hidden relative"
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

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-sidebar"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>}>
            <LoginContent />
        </Suspense>
    );
}
