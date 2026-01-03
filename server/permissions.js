import { pool } from './db.js';
import { v4 as uuidv4 } from 'uuid';

// Available pages in the system
export const AVAILABLE_PAGES = [
    'dashboard',
    'add-booking',
    'bookings',
    'programs',
    'booking-links',
    'reports',
    'settings',
    'user-management'
];

// Get user permissions
export async function getUserPermissions(req, res) {
    try {
        const { userId } = req.params;

        // Check if user is admin or requesting their own permissions
        const requestingUser = req.user; // Assuming middleware adds user to req

        const [user] = await pool.query('SELECT role FROM users WHERE id = ?', [userId]);
        if (!user.length) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Admins have access to all pages
        if (user[0].role === 'admin') {
            const allPermissions = AVAILABLE_PAGES.map(page => ({
                page,
                can_access: true
            }));
            return res.json(allPermissions);
        }

        // Get permissions for regular users
        const [permissions] = await pool.query(
            'SELECT page, can_access FROM user_permissions WHERE user_id = ?',
            [userId]
        );

        // Create a map of all pages with their access status
        const permissionsMap = {};
        permissions.forEach(p => {
            permissionsMap[p.page] = p.can_access;
        });

        const result = AVAILABLE_PAGES.map(page => ({
            page,
            can_access: permissionsMap[page] || false
        }));

        return res.json(result);
    } catch (error) {
        console.error('Error getting user permissions:', error);
        return res.status(500).json({ error: 'Server error' });
    }
}

// Update user permissions (admin only)
export async function updateUserPermissions(req, res) {
    try {
        const { userId } = req.params;
        const { permissions } = req.body; // Array of { page, can_access }

        if (!permissions || !Array.isArray(permissions)) {
            return res.status(400).json({ error: 'Invalid permissions format' });
        }

        // Check if user exists and is not an admin
        const [user] = await pool.query('SELECT role FROM users WHERE id = ?', [userId]);
        if (!user.length) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user[0].role === 'admin') {
            return res.status(400).json({ error: 'Cannot modify permissions for administrators' });
        }

        // Update permissions
        for (const perm of permissions) {
            const { page, can_access } = perm;

            if (!AVAILABLE_PAGES.includes(page)) {
                continue; // Skip invalid pages
            }

            // Check if permission exists
            const [existing] = await pool.query(
                'SELECT id FROM user_permissions WHERE user_id = ? AND page = ?',
                [userId, page]
            );

            if (existing.length > 0) {
                // Update existing permission
                await pool.query(
                    'UPDATE user_permissions SET can_access = ? WHERE user_id = ? AND page = ?',
                    [can_access, userId, page]
                );
            } else {
                // Create new permission
                const id = uuidv4();
                await pool.query(
                    'INSERT INTO user_permissions (id, user_id, page, can_access) VALUES (?, ?, ?, ?)',
                    [id, userId, page, can_access]
                );
            }
        }

        return res.json({ ok: true, message: 'Permissions updated successfully' });
    } catch (error) {
        console.error('Error updating user permissions:', error);
        return res.status(500).json({ error: 'Server error' });
    }
}

// Get all users with their permissions (admin only)
export async function getAllUsersWithPermissions(req, res) {
    try {
        const [users] = await pool.query(
            'SELECT id, email, name, role, mobile, photo FROM users ORDER BY created_at DESC'
        );

        const usersWithPermissions = [];

        for (const user of users) {
            if (user.role === 'admin') {
                usersWithPermissions.push({
                    ...user,
                    permissions: AVAILABLE_PAGES.map(page => ({ page, can_access: true }))
                });
            } else {
                const [permissions] = await pool.query(
                    'SELECT page, can_access FROM user_permissions WHERE user_id = ?',
                    [user.id]
                );

                const permissionsMap = {};
                permissions.forEach(p => {
                    permissionsMap[p.page] = p.can_access;
                });

                const userPermissions = AVAILABLE_PAGES.map(page => ({
                    page,
                    can_access: permissionsMap[page] || false
                }));

                usersWithPermissions.push({
                    ...user,
                    permissions: userPermissions
                });
            }
        }

        return res.json(usersWithPermissions);
    } catch (error) {
        console.error('Error getting users with permissions:', error);
        return res.status(500).json({ error: 'Server error' });
    }
}
