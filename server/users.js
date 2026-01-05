import { pool } from './db.js';
import bcrypt from 'bcryptjs';

// GET all users
export async function getUsers(req, res) {
  try {
    const [rows] = await pool.query('SELECT id, email, name, role, mobile, photo, created_at, updated_at FROM users ORDER BY created_at DESC');
    return res.json(rows);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error' });
  }
}

// PUT update user role
export async function updateUserRole(req, res) {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !['admin', 'user'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
    return res.json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error' });
  }
}

// PUT update user photo
export async function updateUserPhoto(req, res) {
  try {
    const { id } = req.params;
    const { photo } = req.body;

    await pool.query('UPDATE users SET photo = ? WHERE id = ?', [photo, id]);
    return res.json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error' });
  }
}

// PUT reset user password
export async function resetUserPassword(req, res) {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const password_hash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [password_hash, id]);
    return res.json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error' });
  }
}

// PUT update user profile (for self-editing)
export async function updateUserProfile(req, res) {
  try {
    const { id } = req.params;
    const { name, email, mobile, currentPassword, newPassword } = req.body;

    // Check if user is updating their own profile
    if (req.user.id !== id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Basic profile update
    const updates = [];
    const values = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (email !== undefined) {
      updates.push('email = ?');
      values.push(email);
    }
    if (mobile !== undefined) {
      updates.push('mobile = ?');
      values.push(mobile);
    }
    if (req.body.photo !== undefined) {
      updates.push('photo = ?');
      values.push(req.body.photo);
    }

    if (updates.length > 0) {
      values.push(id);
      await pool.query(
        `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
    }

    // Password update (requires current password verification)
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password required' });
      }

      const [rows] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [id]);
      if (!rows || rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const isValid = await bcrypt.compare(currentPassword, rows[0].password_hash);
      if (!isValid) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters' });
      }

      const password_hash = await bcrypt.hash(newPassword, 10);
      await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [password_hash, id]);
    }

    return res.json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error' });
  }
}
