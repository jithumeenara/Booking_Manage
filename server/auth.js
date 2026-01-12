import { pool, ensureSchema } from './db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { notifyLogin } from './telegram.js';
import { signupSchema } from './validation.js';

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



// ...

export async function signup(req, res) {
  try {
    const validation = signupSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: 'Validation error', details: validation.error.format() });
    }
    const { email, password, name, role = 'user', mobile, photo } = validation.data;

    const [rows] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (rows.length) return res.status(409).json({ error: 'Email already registered' });

    // Determine final role based on request and authentication
    let finalRole;
    const token = req.cookies?.[COOKIE_NAME];

    // If no token, always assign 'user' role (public signup)
    if (!token) {
      finalRole = 'user';
    } else if (role === 'admin') {
      // Admin role requested with token - verify authenticity
      try {
        jwt.verify(token, JWT_SECRET);
        // Token is valid, check admin count limit
        const [adminCount] = await pool.query('SELECT COUNT(*) as count FROM users WHERE role = ?', ['admin']);
        if (adminCount[0].count >= 2) {
          return res.status(403).json({ error: 'Maximum number of administrators (2) has been reached. Contact an existing administrator.' });
        }
        finalRole = 'admin'; // Assign admin role
      } catch {
        // Invalid token, force user role
        finalRole = 'user';
      }
    } else {
      // Regular user role requested
      finalRole = 'user';
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

    const token = jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
    res.cookie(COOKIE_NAME, token, { ...COOKIE_OPTIONS, maxAge: 8 * 60 * 60 * 1000 });

    // Send Telegram notification for login
    const userAgent = req.headers['user-agent'] || '';
    const isMobile = /mobile/i.test(userAgent);
    const deviceType = isMobile ? 'Mobile' : 'Desktop';

    notifyLogin({
      name: user.name || 'Unknown',
      email: user.email,
      role: user.role,
      device: deviceType
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

export async function deleteUser(req, res) {
  try {
    const { userId } = req.params;

    // Get user from token
    const token = req.cookies?.[COOKIE_NAME];
    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    let requesterId;
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      requesterId = payload.sub;
    } catch (e) {
      console.error('JWT verification error:', e);
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Check if requester is admin
    const [adminCheck] = await pool.query('SELECT role FROM users WHERE id = ?', [requesterId]);
    if (!adminCheck.length || adminCheck[0].role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized: Admin access required' });
    }

    // Prevent deleting yourself
    if (userId === requesterId) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }

    // Delete user
    const [result] = await pool.query('DELETE FROM users WHERE id = ?', [userId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ ok: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
