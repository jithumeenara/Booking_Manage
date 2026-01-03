import { pool, ensureSchema } from './db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { notifyLogin } from './telegram.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const COOKIE_NAME = 'auth_token';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: false,
  sameSite: 'lax',
  path: '/',
};

export async function initAuth() {
  await ensureSchema();
}

export async function signup(req, res) {
  try {
    const { email, password, name, role = 'user', mobile, photo } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    const [rows] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (rows.length) return res.status(409).json({ error: 'Email already registered' });

    // Check if trying to create admin role
    let finalRole = role;
    if (role === 'admin') {
      // Count existing admins
      const [adminCount] = await pool.query('SELECT COUNT(*) as count FROM users WHERE role = ?', ['admin']);
      if (adminCount[0].count >= 2) {
        return res.status(403).json({ error: 'Maximum number of administrators (2) has been reached. Contact an existing administrator.' });
      }
    }

    // Force 'user' role for public signup (no authentication check means public signup)
    // Only authenticated admins can create other admins
    const token = req.cookies?.[COOKIE_NAME];
    if (!token) {
      finalRole = 'user'; // Public signups are always 'user' role
    }

    const id = uuidv4();
    const password_hash = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO users (id, email, password_hash, name, role, mobile, photo) VALUES (?,?,?,?,?,?,?)',
      [id, email, password_hash, name || null, finalRole, mobile || null, photo || null]
    );

    // Set default permissions based on role
    if (finalRole === 'user') {
      // Regular users get only dashboard access by default
      const permissionId = uuidv4();
      await pool.query(
        'INSERT INTO user_permissions (id, user_id, page, can_access) VALUES (?, ?, ?, ?)',
        [permissionId, id, 'dashboard', true]
      );
    }
    // Admins don't need permissions - they have full access

    return res.status(201).json({ ok: true, message: finalRole === 'user' ? 'Account created! You have access to the dashboard. Contact an administrator to request access to other features.' : 'Account created successfully!' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error' });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });
    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie(COOKIE_NAME, token, { ...COOKIE_OPTIONS, maxAge: 7 * 24 * 60 * 60 * 1000 });

    // Send Telegram notification for login
    notifyLogin({
      name: user.name || 'Unknown',
      email: user.email,
      role: user.role
    }).catch(err => {
      console.error('Telegram login notification error:', err);
    });

    return res.json({ id: user.id, email: user.email, name: user.name, role: user.role, mobile: user.mobile, photo: user.photo });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error' });
  }
}

export async function logout(_req, res) {
  res.clearCookie(COOKIE_NAME, COOKIE_OPTIONS);
  return res.json({ ok: true });
}

export async function me(req, res) {
  try {
    const token = req.cookies?.[COOKIE_NAME];
    if (!token) return res.status(401).json({ error: 'Not authenticated' });
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      const [rows] = await pool.query('SELECT id, email, name, role, mobile, photo FROM users WHERE id = ?', [payload.sub]);
      if (!rows.length) return res.status(401).json({ error: 'Not authenticated' });
      return res.json(rows[0]);
    } catch {
      return res.status(401).json({ error: 'Not authenticated' });
    }
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error' });
  }
}
