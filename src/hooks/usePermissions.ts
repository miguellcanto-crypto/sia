'use client';

import { useSession } from 'next-auth/react';
import { Permission } from '../generated/client/client';

export function usePermissions() {
    const { data: session, status } = useSession();

    const hasPermission = (permission: Permission) => {
        if (!session?.user) return false;
        const permissions = (session.user as any).permissions as Permission[];
        return permissions.includes(permission);
    };

    const hasAnyPermission = (requiredPermissions: Permission[]) => {
        if (!session?.user) return false;
        const userPermissions = (session.user as any).permissions as Permission[];
        return requiredPermissions.some(p => userPermissions.includes(p));
    };

    const isAdmin = () => {
        return (session?.user as any)?.role === 'ADMIN';
    };

    return {
        hasPermission,
        hasAnyPermission,
        isAdmin,
        isLoading: status === 'loading',
        isAuthenticated: status === 'authenticated',
        user: session?.user,
    };
}
