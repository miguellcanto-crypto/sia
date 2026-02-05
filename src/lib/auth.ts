import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import { logAuthEvent } from './auth-logger';
import { AuthErrorCode } from './auth-errors';

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    pages: {
        signIn: '/auth/login',
        error: '/auth/error',
    },
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials, req) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error(AuthErrorCode.INVALID_CREDENTIALS);
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email },
                    include: { role: true },
                });

                if (!user || !user.passwordHash) {
                    await logAuthEvent(null, 'LOGIN', `Intento de login fallido: usuario no encontrado (${credentials.email})`);
                    throw new Error(AuthErrorCode.USER_NOT_FOUND);
                }

                // Check lockout
                if (user.lockoutUntil && user.lockoutUntil > new Date()) {
                    await logAuthEvent(user.id, 'LOGIN', 'Intento de login fallido: cuenta bloqueada temporalmente');
                    throw new Error(AuthErrorCode.RATE_LIMIT_EXCEEDED);
                }

                if (user.status !== 'ACTIVE') {
                    await logAuthEvent(user.id, 'LOGIN', `Intento de login fallido: cuenta con estado ${user.status}`);
                    throw new Error(AuthErrorCode.ACCOUNT_DISABLED);
                }

                const isValid = await bcrypt.compare(credentials.password, user.passwordHash);

                if (!isValid) {
                    const newFailedAttempts = user.failedAttempts + 1;
                    const maxAttempts = 5;
                    const isLocking = newFailedAttempts >= maxAttempts;

                    await prisma.user.update({
                        where: { id: user.id },
                        data: {
                            failedAttempts: newFailedAttempts,
                            lockoutUntil: isLocking ? new Date(Date.now() + 15 * 60 * 1000) : null, // 15 min lockout
                        }
                    });

                    await logAuthEvent(user.id, 'LOGIN', `Contraseña incorrecta. Intento ${newFailedAttempts}/${maxAttempts}`);
                    throw new Error(AuthErrorCode.WRONG_PASSWORD);
                }

                // Reset failed attempts on success
                await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        failedAttempts: 0,
                        lockoutUntil: null,
                        lastLogin: new Date(),
                    }
                });

                await logAuthEvent(user.id, 'LOGIN', 'Inicio de sesión exitoso');

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role.name,
                    permissions: user.role.permissions,
                };
            }
        })
    ],
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.id = user.id;
                token.role = (user as any).role;
                token.permissions = (user as any).permissions;
            }

            // Allow dynamic session updates (Phase 2/3)
            if (trigger === 'update' && session) {
                return { ...token, ...session.user };
            }

            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                (session.user as any).id = token.id;
                (session.user as any).role = token.role;
                (session.user as any).permissions = token.permissions;
            }
            return session;
        },
    },
    cookies: {
        sessionToken: {
            name: `next-auth.session-token`,
            options: {
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                secure: process.env.NODE_ENV === 'production',
            },
        },
    },
};
