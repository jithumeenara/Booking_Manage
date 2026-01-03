import { useEffect, useState } from 'react';

interface Permission {
    page: string;
    can_access: boolean;
}

interface User {
    id: string;
    email: string;
    name: string;
    role: string;
}

export function usePermissions() {
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadUserAndPermissions();
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
                ];
                setPermissions(allPermissions);
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
