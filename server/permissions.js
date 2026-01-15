import { pool } from './db.js';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { notifyPermissionChange } from './telegram.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const COOKIE_NAME = 'auth_token';

// Available pages in the system
export const AVAILABLE_PAGES = [
    'dashboard',
    'add-booking',
    'bookings',
    'programs',
    'booking-links',
    'reports',
    'settings',
    'user-management',
    'edit-financial-details',
    'revert-financial-status',
    'add-training-hall',
    'edit-training-hall',
    'delete-training-hall',
    'view-training-halls'
];

// Get user permissions
export async function getUserPermissions(req, res) {
    try {
        const { userId } = req.params;

        // Check if user is admin or requesting their own permissions

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

        // 1. Verify Authentication (Get Admin Info)
        const token = req.cookies?.[COOKIE_NAME];
        if (!token) return res.status(401).json({ error: 'Not authenticated' });

        let adminUser;
        try {
            const payload = jwt.verify(token, JWT_SECRET);
            const [rows] = await pool.query('SELECT name, role FROM users WHERE id = ?', [payload.sub]);
            if (!rows.length || rows[0].role !== 'admin') {
                return res.status(403).json({ error: 'Unauthorized: Admin access required' });
            }
            adminUser = rows[0];
        } catch (e) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        // 2. Check Target User
        const [user] = await pool.query('SELECT name, role FROM users WHERE id = ?', [userId]);
        if (!user.length) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user[0].role === 'admin') {
            return res.status(400).json({ error: 'Cannot modify permissions for administrators' });
        }

        // 3. Update Permissions
        const changes = []; // Track changes for notification

        for (const perm of permissions) {
            const { page, can_access } = perm;

            if (!AVAILABLE_PAGES.includes(page)) {
                continue; // Skip invalid pages
            }

            // Check if permission exists
            const [existing] = await pool.query(
                'SELECT id, can_access FROM user_permissions WHERE user_id = ? AND page = ?',
                [userId, page]
            );

            let changed = false;
            if (existing.length > 0) {
                // Update existing permission
                if (existing[0].can_access !== can_access) {
                    await pool.query(
                        'UPDATE user_permissions SET can_access = ? WHERE user_id = ? AND page = ?',
                        [can_access, userId, page]
                    );
                    changed = true;
                }
            } else {
                // Create new permission
                const id = uuidv4();
                await pool.query(
                    'INSERT INTO user_permissions (id, user_id, page, can_access) VALUES (?, ?, ?, ?)',
                    [id, userId, page, can_access]
                );
                changed = true;
            }

            if (changed) {
                changes.push({ page, can_access });
            }
        }

        // 4. Send Telegram Notification if there were changes
        if (changes.length > 0) {
            notifyPermissionChange(adminUser.name, user[0].name, changes).catch(err => {
                console.error('Failed to send permission change notification:', err);
            });
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
