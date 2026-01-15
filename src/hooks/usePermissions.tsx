/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';

interface Permission {
    page: string;
    can_access: boolean;
}

export interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    mobile?: string | null;
    photo?: string | null;
}

export function usePermissions() {
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // Simple memory cache to avoid redundant fetches
    const cachedUser = (globalThis as any).__USER_CACHE__;
    const cachedPerms = (globalThis as any).__PERM_CACHE__;

    useEffect(() => {
        if (cachedUser && cachedPerms) {
            setUser(cachedUser);
            setPermissions(cachedPerms);
            setLoading(false);
        } else {
            loadUserAndPermissions();
        }
    }, []);

    const loadUserAndPermissions = async () => {
        try {
            // Get current user
            const userRes = await fetch('/api/auth/me', { credentials: 'include' });
            if (!userRes.ok) {
                setLoading(false);
                return;
            }

            const userData = await userRes.json();
            setUser(userData);
            (globalThis as any).__USER_CACHE__ = userData; // Cache user

            // Admins have access to everything
            if (userData.role === 'admin') {
                const allPermissions: Permission[] = [
                    { page: 'dashboard', can_access: true },
                    { page: 'add-booking', can_access: true },
                    { page: 'bookings', can_access: true },
                    { page: 'programs', can_access: true },
                    { page: 'booking-links', can_access: true },
                    { page: 'reports', can_access: true },
                    { page: 'settings', can_access: true },
                    { page: 'user-management', can_access: true },
                    { page: 'edit-financial-details', can_access: true },
                    { page: 'revert-financial-status', can_access: true },
                ];
                setPermissions(allPermissions);
                (globalThis as any).__PERM_CACHE__ = allPermissions; // Cache perms
                setLoading(false);
                return;
            }

            // Get permissions for regular users
            const permRes = await fetch(`/api/users/${userData.id}/permissions`, {
                credentials: 'include'
            });

            if (permRes.ok) {
                const perms = await permRes.json();
                setPermissions(perms);
                (globalThis as any).__PERM_CACHE__ = perms; // Cache perms
            }
        } catch (error) {
            console.error('Failed to load permissions:', error);
        } finally {
            setLoading(false);
        }
    };

    const hasPermission = (page: string): boolean => {
        // Admins always have permission
        if (user?.role === 'admin') return true;

        // Check if user has permission for this page
        const permission = permissions.find(p => p.page === page);
        return permission?.can_access || false;
    };

    const canAccessPage = (pageName: string): boolean => {
        return hasPermission(pageName);
    };

    return {
        permissions,
        user,
        loading,
        hasPermission,
        canAccessPage,
        isAdmin: user?.role === 'admin',
    };
}

export const clearPermissionsCache = () => {
    (globalThis as any).__USER_CACHE__ = null;
    (globalThis as any).__PERM_CACHE__ = null;
};
