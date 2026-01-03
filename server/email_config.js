import { pool } from './db.js';
import { v4 as uuidv4 } from 'uuid';
import nodemailer from 'nodemailer';

// GET email configuration
export async function getEmailConfig(req, res) {
  try {
    const [rows] = await pool.query('SELECT * FROM email_config ORDER BY created_at DESC LIMIT 1');
    if (!rows.length) {
      return res.json(null);
    }
    return res.json(rows[0]);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error' });
  }
}

// POST/PUT save email configuration
export async function saveEmailConfig(req, res) {
  try {
    const { smtp_host, smtp_port, smtp_user, smtp_password, from_email, from_name, security } = req.body;
    
    if (!smtp_host || !smtp_port || !smtp_user || !smtp_password || !from_email) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if config exists
    const [existing] = await pool.query('SELECT id FROM email_config LIMIT 1');
    
    if (existing.length > 0) {
      // Update existing config
      await pool.query(
        'UPDATE email_config SET smtp_host = ?, smtp_port = ?, smtp_user = ?, smtp_password = ?, from_email = ?, from_name = ?, security = ? WHERE id = ?',
        [smtp_host, smtp_port, smtp_user, smtp_password, from_email, from_name || 'ACSTI Kerala', security || 'tls', existing[0].id]
      );
      return res.json({ ok: true, message: 'Email configuration updated' });
    } else {
      // Create new config
      const id = uuidv4();
      await pool.query(
        'INSERT INTO email_config (id, smtp_host, smtp_port, smtp_user, smtp_password, from_email, from_name, security) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [id, smtp_host, smtp_port, smtp_user, smtp_password, from_email, from_name || 'ACSTI Kerala', security || 'tls']
      );
      return res.json({ ok: true, message: 'Email configuration created' });
    }
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error' });
  }
}

// Helper: create nodemailer transporter from DB config
function createTransporterFromConfig(cfg) {
  // Normalize security
  const sec = String(cfg.security || 'auto').toLowerCase();
  const port = Number(cfg.smtp_port) || 587;

  // Defaults
  let secure = false; // TLS upgrade by default
  let requireTLS = false;
  let ignoreTLS = false;

  if (sec === 'ssl') {
    secure = true; // implicit SSL, typically 465
  } else if (sec === 'tls' || sec === 'starttls') {
    secure = false; // STARTTLS
    requireTLS = true;
  } else if (sec === 'none') {
    secure = false;
    ignoreTLS = true;
  } else if (sec === 'auto') {
    // Heuristic: port 465 => secure true, else STARTTLS
    secure = port === 465;
  }

  return nodemailer.createTransport({
    host: cfg.smtp_host,
    port,
    secure,
    requireTLS,
    ignoreTLS,
    auth: {
      user: cfg.smtp_user,
      pass: cfg.smtp_password,
    },
  });
}

// POST test email configuration
export async function testEmailConfig(req, res) {
  try {
    const { to_email } = req.body;
    if (!to_email) {
      return res.status(400).json({ error: 'To email address is required' });
    }

    // Load latest email config
    const [rows] = await pool.query('SELECT * FROM email_config ORDER BY created_at DESC LIMIT 1');
    if (!rows.length) {
      return res.status(404).json({ error: 'Email configuration not found. Please save configuration first.' });
    }
    const cfg = rows[0];

    // Create transporter
    const transporter = createTransporterFromConfig(cfg);

    // Compose message
    const fromName = cfg.from_name || 'ACSTI Kerala';
    const fromHeader = cfg.from_email ? `${fromName} <${cfg.from_email}>` : cfg.smtp_user;
    const info = await transporter.sendMail({
      from: fromHeader,
      to: to_email,
      subject: 'ACSTI Booking - SMTP Test Email',
      text: 'This is a test email to verify your SMTP configuration in ACSTI Booking.',
      html: '<p>This is a <b>test email</b> to verify your SMTP configuration in ACSTI Booking.</p>',
    });

    return res.json({ ok: true, messageId: info.messageId, envelope: info.envelope });
  } catch (e) {
    // Return detailed error to help diagnose (remove stack in production if needed)
    console.error('SMTP test failed:', e);
    return res.status(500).json({ error: e?.message || 'SMTP test failed' });
  }
}
