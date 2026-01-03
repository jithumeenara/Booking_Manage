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
