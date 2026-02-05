'use client';

import { usePermissions } from "@/hooks/usePermissions";
import { Permission } from "../../generated/client/client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface RequirePermissionProps {
    permission?: Permission;
    permissions?: Permission[];
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

/**
 * Inline component to show/hide content based on permissions
 */
export function RequirePermission({
    permission,
    permissions,
    children,
    fallback = null
}: RequirePermissionProps) {
    const { hasPermission, hasAnyPermission, isLoading } = usePermissions();

    if (isLoading) return null;

    const allowed = permission
        ? hasPermission(permission)
        : permissions
            ? hasAnyPermission(permissions)
            : false;

    return allowed ? <>{children}</> : <>{fallback}</>;
}

/**
 * Page-level wrapper to protect routes with redirection
 */
export function ProtectedRoute({
    children,
    permission,
    permissions
}: RequirePermissionProps) {
    const { isAuthenticated, hasPermission, hasAnyPermission, isLoading } = usePermissions();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push("/auth/login");
        }
    }, [isLoading, isAuthenticated, router]);

    if (isLoading) return <div className="flex h-screen items-center justify-center">Cargando...</div>;

    const allowed = permission
        ? hasPermission(permission)
        : permissions
            ? hasAnyPermission(permissions)
            : true; // Default to just authenticated if no specific permissions required

    if (!allowed && isAuthenticated) {
        return (
            <div className="flex flex-col h-screen items-center justify-center p-4 text-center">
                <h1 className="text-2xl font-bold text-red-500 mb-2">Acceso Denegado</h1>
                <p className="text-slate-600">No tienes los permisos necesarios para ver esta página.</p>
            </div>
        );
    }

    return allowed ? <>{children}</> : null;
}
