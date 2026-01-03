import { pool } from './db.js';
import { v4 as uuidv4 } from 'uuid';
import nodemailer from 'nodemailer';

// GET booking link by token
export async function getBookingLink(req, res) {
  try {
    const { token } = req.params;
    const [rows] = await pool.query('SELECT * FROM booking_links WHERE token = ?', [token]);
    if (!rows.length) return res.status(404).json({ error: 'Invalid booking link' });
    
    const link = rows[0];
    // Check if link is still active
    if (!link.is_active) {
      return res.status(410).json({ error: 'This booking link has already been used and is no longer active' });
    }
    
    return res.json(link);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error' });
  }
}

// GET all booking links
export async function getAllBookingLinks(req, res) {
  try {
    const [rows] = await pool.query('SELECT * FROM booking_links ORDER BY created_at DESC');
    return res.json(rows);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error' });
  }
}

// POST create booking link
export async function createBookingLink(req, res) {
  try {
    const { department_name, email } = req.body;
    if (!department_name) {
      return res.status(400).json({ error: 'Department name is required' });
    }

    const id = uuidv4();
    const token = uuidv4();
    await pool.query(
      'INSERT INTO booking_links (id, token, department_name, email) VALUES (?, ?, ?, ?)',
      [id, token, department_name, email || null]
    );
    return res.status(201).json({ id, token, ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error' });
  }
}

// DELETE booking link
export async function deleteBookingLink(req, res) {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM booking_links WHERE id = ?', [id]);
    return res.json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error' });
  }
}

// Helper function to deactivate a booking link by token
export async function deactivateBookingLinkByToken(token) {
  try {
    await pool.query('UPDATE booking_links SET is_active = FALSE WHERE token = ?', [token]);
    console.log(`Booking link deactivated: ${token}`);
    return true;
  } catch (e) {
    console.error('Failed to deactivate booking link:', e);
    return false;
  }
}

// Helper: create nodemailer transporter from DB config
function createTransporterFromConfig(cfg) {
  const sec = String(cfg.security || 'auto').toLowerCase();
  const port = Number(cfg.smtp_port) || 587;

  let secure = false;
  let requireTLS = false;
  let ignoreTLS = false;

  if (sec === 'ssl') {
    secure = true;
  } else if (sec === 'tls' || sec === 'starttls') {
    secure = false;
    requireTLS = true;
  } else if (sec === 'none') {
    secure = false;
    ignoreTLS = true;
  } else if (sec === 'auto') {
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

// POST send booking link via email
export async function sendBookingLinkEmail(req, res) {
  try {
    const { email, link, departmentName } = req.body;

    if (!email || !link) {
      return res.status(400).json({ error: 'Email and link are required' });
    }

    // Get email config
    const [rows] = await pool.query('SELECT * FROM email_config ORDER BY created_at DESC LIMIT 1');
    if (!rows.length) {
      return res.status(404).json({ error: 'Email configuration not found. Please configure email settings first.' });
    }
    const cfg = rows[0];

    // Create transporter
    const transporter = createTransporterFromConfig(cfg);

    // Compose message
    const fromName = cfg.from_name || 'ACSTI Kerala';
    const fromHeader = cfg.from_email ? `${fromName} <${cfg.from_email}>` : cfg.smtp_user;
    const deptText = departmentName ? ` for ${departmentName}` : '';

    const info = await transporter.sendMail({
      from: fromHeader,
      to: email,
      subject: `ACSTI Booking Link${deptText}`,
      text: `Dear Recipient,\n\nHere is your booking link for ACSTI Outside Programme${deptText}:\n\n${link}\n\nPlease use this link to submit your booking details.\n\nBest regards,\nACSI Kerala`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">ACSTI Outside Programme Booking</h2>
          <p>Dear Recipient,</p>
          <p>Here is your booking link${deptText}:</p>
          <p style="margin: 20px 0;">
            <a href="${link}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Open Booking Form
            </a>
          </p>
          <p style="color: #6b7280; font-size: 14px;">Or copy this link: <br/><a href="${link}">${link}</a></p>
          <p>Please use this link to submit your booking details.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px;">
            Best regards,<br/>
            ACSTI Kerala
          </p>
        </div>
      `,
    });

    return res.json({ ok: true, messageId: info.messageId });
  } catch (e) {
    console.error('Failed to send booking link email:', e);
    return res.status(500).json({ error: e?.message || 'Failed to send email' });
  }
}
