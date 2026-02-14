import { Permission } from '@/generated/client';

export class RbacService {
    // Static permissions for now (Stub)
    // In production, this would check the current session user's role and permissions
    static async can(userId: string, requiredPermission: Permission): Promise<boolean> {
        // For now, system-admin has every permission
        if (userId === 'system-admin') return true;

        // Logic to fetch user role and permissions from DB would go here
        return false;
    }

    static async isAdmin(userId: string): Promise<boolean> {
        return userId === 'system-admin';
    }
}
