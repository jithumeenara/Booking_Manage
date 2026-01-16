import { pool } from './db.js';
import { v4 as uuidv4 } from 'uuid';
import nodemailer from 'nodemailer';
import { deactivateBookingLinkByToken } from './booking_links.js';
import { notifyLinkBooking, notifyBillingReady, notifyPaymentReceived } from './telegram.js';
import { bookingSchema } from './validation.js';

// Helper: create nodemailer transporter from DB config
async function createTransporterFromConfig() {
  const [rows] = await pool.query('SELECT * FROM email_config ORDER BY created_at DESC LIMIT 1');
  if (!rows.length) {
    throw new Error('Email configuration not found');
  }

  const cfg = rows[0];
  const sec = String(cfg.security || 'auto').toLowerCase();
  const port = Number(cfg.smtp_port) || 587;

  let secure = false;
  let requireTLS = false;
  let ignoreTLS = false;

  if (sec === 'ssl') {
    secure = true;
  } else if (sec === 'tls' || sec === 'starttls') {
    requireTLS = true;
  } else if (sec === 'none') {
    ignoreTLS = true;
  } else if (sec === 'auto') {
    secure = port === 465;
  }

  return {
    transporter: nodemailer.createTransport({
      host: cfg.smtp_host,
      port,
      secure,
      requireTLS,
      ignoreTLS,
      auth: {
        user: cfg.smtp_user,
        pass: cfg.smtp_password,
      },
    }),
    config: cfg
  };
}

// Helper: send booking confirmation email
async function sendBookingConfirmationEmail(bookingDetails) {
  try {
    const { transporter, config } = await createTransporterFromConfig();

    const fromName = config.from_name || 'ACSTI Kerala';
    const fromHeader = config.from_email ? `${fromName} <${config.from_email}>` : config.smtp_user;

    // Format dates
    const formatDate = (dateStr) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    };

    const startDate = formatDate(bookingDetails.start_date);
    const endDate = formatDate(bookingDetails.end_date);

    // Calculate duration
    const start = new Date(bookingDetails.start_date);
    const end = new Date(bookingDetails.end_date);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0;">ACSTI Kerala</h1>
            <p style="color: #6b7280; margin: 5px 0;">Outside Programme Booking</p>
          </div>
          
          <div style="background-color: #dbeafe; border-left: 4px solid #2563eb; padding: 15px; margin-bottom: 25px;">
            <h2 style="color: #1e40af; margin: 0 0 5px 0; font-size: 18px;">✅ Booking Confirmed</h2>
            <p style="color: #1e40af; margin: 0; font-size: 14px;">Your booking has been successfully registered.</p>
          </div>

          <h3 style="color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Booking Details</h3>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 10px 0; color: #6b7280; width: 40%;">Department/Agency:</td>
              <td style="padding: 10px 0; color: #111827; font-weight: 600;">${bookingDetails.department_agency}</td>
            </tr>
            <tr style="background-color: #f9fafb;">
              <td style="padding: 10px 0; color: #6b7280;">Contact Person:</td>
              <td style="padding: 10px 0; color: #111827; font-weight: 600;">${bookingDetails.contact_person_name}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #6b7280;">Email:</td>
              <td style="padding: 10px 0; color: #111827;">${bookingDetails.contact_person_email}</td>
            </tr>
            <tr style="background-color: #f9fafb;">
              <td style="padding: 10px 0; color: #6b7280;">Phone:</td>
              <td style="padding: 10px 0; color: #111827;">${bookingDetails.contact_person_phone}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #6b7280;">Start Date:</td>
              <td style="padding: 10px 0; color: #111827; font-weight: 600;">${startDate}</td>
            </tr>
            <tr style="background-color: #f9fafb;">
              <td style="padding: 10px 0; color: #6b7280;">End Date:</td>
              <td style="padding: 10px 0; color: #111827; font-weight: 600;">${endDate}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #6b7280;">Duration:</td>
              <td style="padding: 10px 0; color: #111827; font-weight: 600;">${days} day${days > 1 ? 's' : ''}</td>
            </tr>
            <tr style="background-color: #f9fafb;">
              <td style="padding: 10px 0; color: #6b7280;">Participants:</td>
              <td style="padding: 10px 0; color: #111827; font-weight: 600;">${bookingDetails.num_participants}</td>
            </tr>
          </table>

          <h3 style="color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; margin-top: 25px;">Facilities Requested</h3>
          
          <div style="margin-bottom: 20px;">
            <div style="display: inline-block; margin: 5px 10px 5px 0;">
              ${bookingDetails.needs_accommodation ?
        '<span style="background-color: #dcfce7; color: #166534; padding: 6px 12px; border-radius: 4px; font-size: 14px;">✓ Accommodation</span>' :
        '<span style="background-color: #f3f4f6; color: #6b7280; padding: 6px 12px; border-radius: 4px; font-size: 14px;">✗ Accommodation</span>'}
            </div>
            <div style="display: inline-block; margin: 5px 10px 5px 0;">
              ${bookingDetails.needs_food ?
        '<span style="background-color: #dcfce7; color: #166534; padding: 6px 12px; border-radius: 4px; font-size: 14px;">✓ Food</span>' :
        '<span style="background-color: #f3f4f6; color: #6b7280; padding: 6px 12px; border-radius: 4px; font-size: 14px;">✗ Food</span>'}
            </div>
            <div style="display: inline-block; margin: 5px 10px 5px 0;">
              ${bookingDetails.needs_training_hall ?
        '<span style="background-color: #dcfce7; color: #166534; padding: 6px 12px; border-radius: 4px; font-size: 14px;">✓ Training Hall (${bookingDetails.number_of_halls || 1})</span>' :
        '<span style="background-color: #f3f4f6; color: #6b7280; padding: 6px 12px; border-radius: 4px; font-size: 14px;">✗ Training Hall</span>'}
            </div>
          </div>

          ${bookingDetails.purpose ? `
            <h3 style="color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; margin-top: 25px;">Purpose</h3>
            <p style="color: #374151; line-height: 1.6;">${bookingDetails.purpose}</p>
          ` : ''}

          <div style="background-color: #fef3c7; border: 1px solid #fbbf24; border-radius: 6px; padding: 15px; margin-top: 25px;">
            <p style="color: #92400e; margin: 0; font-size: 14px;">
              <strong>📌 Important:</strong> Your booking status is currently <strong>Pending</strong>. 
              You will receive a notification once it is reviewed and approved by the ACSTI team.
            </p>
          </div>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          
          <p style="color: #6b7280; font-size: 13px; text-align: center; margin: 0;">
            If you have any questions, please contact ACSTI Kerala.<br/>
            This is an automated confirmation email.
          </p>
        </div>
      </div>
    `;

    // Prepare training hall text (extract nested ternary for clarity)
    const hallCount = bookingDetails.number_of_halls || 1;
    const hallText = hallCount > 1 ? 's' : '';
    const trainingHallInfo = bookingDetails.needs_training_hall ?
      `Yes (${hallCount} hall${hallText})` :
      'No';

    const textContent = `
ACSTI Kerala - Outside Programme Booking Confirmation

✅ BOOKING CONFIRMED

Your booking has been successfully registered.

BOOKING DETAILS:
- Department/Agency: ${bookingDetails.department_agency}
- Contact Person: ${bookingDetails.contact_person_name}
- Email: ${bookingDetails.contact_person_email}
- Phone: ${bookingDetails.contact_person_phone}
- Start Date: ${startDate}
- End Date: ${endDate}
- Duration: ${days} day${days > 1 ? 's' : ''}
- Participants: ${bookingDetails.num_participants}

FACILITIES REQUESTED:
- Accommodation: ${bookingDetails.needs_accommodation ? 'Yes' : 'No'}
- Food: ${bookingDetails.needs_food ? 'Yes' : 'No'}
- Training Hall: ${trainingHallInfo}

${bookingDetails.purpose ? `PURPOSE:\n${bookingDetails.purpose}\n\n` : ''}
📌 IMPORTANT: Your booking status is currently Pending. You will receive a notification once it is reviewed and approved by the ACSTI team.

---
If you have any questions, please contact ACSTI Kerala.
This is an automated confirmation email.
    `;

    await transporter.sendMail({
      from: fromHeader,
      to: bookingDetails.contact_person_email,
      subject: `Booking Confirmation - ${bookingDetails.department_agency}`,
      text: textContent,
      html: htmlContent,
    });

    console.log('Confirmation email sent to:', bookingDetails.contact_person_email);
    return true;
  } catch (error) {
    console.error('Failed to send confirmation email:', error);
    // Don't throw - we don't want to fail the booking if email fails
    return false;
  }
}

// GET all bookings
export async function getBookings(req, res) {
  try {
    const [rows] = await pool.query(`
      SELECT b.*, 
        (
          SELECT JSON_ARRAYAGG(JSON_OBJECT('id', th.id, 'name', th.name, 'code', th.code))
          FROM booking_halls bh
          JOIN training_halls th ON bh.hall_id = th.id
          WHERE bh.booking_id = b.id
        ) as allocated_halls
      FROM bookings b 
      ORDER BY b.created_at DESC
    `);
    return res.json(rows);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error' });
  }
}

// GET single booking
export async function getBooking(req, res) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(`
      SELECT b.*, 
        (
          SELECT JSON_ARRAYAGG(JSON_OBJECT('id', th.id, 'name', th.name, 'code', th.code))
          FROM booking_halls bh
          JOIN training_halls th ON bh.hall_id = th.id
          WHERE bh.booking_id = b.id
        ) as allocated_halls
      FROM bookings b 
      WHERE b.id = ?
    `, [id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    return res.json(rows[0]);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error' });
  }
}



// ... other imports ...

// POST create booking
export async function createBooking(req, res) {
  try {
    const validation = bookingSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: 'Validation error', details: validation.error.format() });
    }

    // Use validated data
    const {
      department_agency,
      contact_person_name,
      contact_person_email,
      contact_person_phone,
      start_date,
      end_date,
      num_participants,
      needs_accommodation = false,
      needs_food = false,
      needs_training_hall = false,
      number_of_halls = 1,
      purpose,
      financial_year,
      status = 'pending',
      booked_via_link = false,
      booking_link_token,
      hall_ids = [] // New field
    } = validation.data;

    // Convert ISO dates to MySQL datetime format (Use Local Time)
    const formatDateForMySQL = (isoDate) => {
      const date = new Date(isoDate);
      const pad = (n) => String(n).padStart(2, '0');
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    };

    const id = uuidv4();
    await pool.query(
      `INSERT INTO bookings (
        id, department_agency, contact_person_name, contact_person_email, contact_person_phone,
        start_date, end_date, num_participants, needs_accommodation, needs_food, needs_training_hall,
        number_of_halls, purpose, financial_year, status, booked_via_link
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id, department_agency, contact_person_name, contact_person_email, contact_person_phone,
        formatDateForMySQL(start_date), formatDateForMySQL(end_date), num_participants, needs_accommodation, needs_food, needs_training_hall,
        number_of_halls, purpose, financial_year, status, booked_via_link
      ]
    );

    // Handle Hall Allocations
    if (needs_training_hall && Array.isArray(hall_ids) && hall_ids.length > 0) {
      const hallValues = hall_ids.map(hid => [id, hid]);
      await pool.query('INSERT INTO booking_halls (booking_id, hall_id) VALUES ?', [hallValues]);
    }

    // Send confirmation email if booked via link
    if (booked_via_link) {
      // Send email asynchronously (don't block the response)
      sendBookingConfirmationEmail({
        department_agency,
        contact_person_name,
        contact_person_email,
        contact_person_phone,
        start_date,
        end_date,
        num_participants,
        needs_accommodation,
        needs_food,
        needs_training_hall,
        number_of_halls,
        purpose,
        status
      }).catch(err => {
        console.error('Async confirmation email error:', err);
      });

      // Send Telegram notification for link booking
      notifyLinkBooking({
        department_agency,
        contact_person_name,
        contact_person_phone,
        start_date,
        end_date,
        num_participants
      }).catch(err => {
        console.error('Telegram notification error:', err);
      });

      // Deactivate the booking link after successful booking
      if (booking_link_token) {
        deactivateBookingLinkByToken(booking_link_token).catch(err => {
          console.error('Failed to deactivate booking link:', err);
        });
      }
    }

    return res.status(201).json({ id, ok: true });
  } catch (e) {
    console.error('Error creating booking:', e);
    return res.status(500).json({ error: 'Server error', details: e.message });
  }
}

// PUT update booking
export async function updateBooking(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body;
    console.log('[DEBUG] updateBooking called for ID:', id);
    console.log('[DEBUG] Updates:', JSON.stringify(updates));

    const allowed = new Set([
      'contact_person_name', 'contact_person_email', 'contact_person_phone',
      'start_date', 'end_date', 'num_participants', 'needs_accommodation', 'needs_food',
      'needs_training_hall', 'number_of_halls', 'purpose', 'status', 'total_bill_amount',
      'completed_at', 'financial_year', 'bill_no', 'billed_date', 'num_of_bills', 'hall_ids',
      'bill_base_amount', 'bill_gst_amount' // Added split bill fields
    ]);
    const fields = Object.keys(updates).filter(k => allowed.has(k) && k !== 'hall_ids'); // Filter out hall_ids from main update
    if (!fields.length) return res.status(400).json({ error: 'No valid fields to update' });

    // Convert ISO dates to MySQL datetime format (Use Local Time)
    const formatDateForMySQL = (isoDate) => {
      const date = new Date(isoDate);
      const pad = (n) => String(n).padStart(2, '0');
      const formatted = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
      console.log(`[DEBUG] Date Conversion: Input=${isoDate}, Formatted=${formatted}, ServerTime=${new Date().toString()}`);
      return formatted;
    };

    const dateFields = new Set(['start_date', 'end_date', 'completed_at', 'billed_date']);
    const setParts = fields.map(f => `${f} = ?`).join(', ');
    const values = fields.map(f => {
      // Convert date fields to MySQL format
      if (dateFields.has(f) && updates[f]) {
        return formatDateForMySQL(updates[f]);
      }
      return updates[f];
    });

    console.log('[DEBUG] SQL Parameters:', values);
    const [result] = await pool.query(`UPDATE bookings SET ${setParts} WHERE id = ?`, [...values, id]);

    // Handle Hall Allocations Update
    if (updates.hall_ids !== undefined) {
      // Clear existing
      await pool.query('DELETE FROM booking_halls WHERE booking_id = ?', [id]);

      // Insert new if any
      if (Array.isArray(updates.hall_ids) && updates.hall_ids.length > 0) {
        const hallValues = updates.hall_ids.map(hid => [id, hid]);
        await pool.query('INSERT INTO booking_halls (booking_id, hall_id) VALUES ?', [hallValues]);
      }
    }

    if (result.affectedRows === 0) {
      console.warn(`[DEBUG] Update failed: Booking ID ${id} not found.`);
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check if we need to send a "Payment Received" notification
    if (updates.status === 'payment_completed' || updates.status === 'complete') {
      try {
        // Fetch the updated booking to get full details for the message
        const [rows] = await pool.query('SELECT * FROM bookings WHERE id = ?', [id]);
        if (rows.length > 0) {
          await notifyPaymentReceived(rows[0]);
        }
      } catch (err) {
        console.error('Failed to trigger payment notification:', err);
      }
    }

    return res.json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error' });
  }
}

// DELETE booking
export async function deleteBooking(req, res) {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM bookings WHERE id = ?', [id]);
    return res.json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error' });
  }
}

// Allocate a hall to a booking (Add to existing allocations)
export async function allocateHallToBooking(req, res) {
  try {
    const { bookingId } = req.params;
    const { hall_id } = req.body;

    if (!hall_id) {
      return res.status(400).json({ error: 'hall_id is required' });
    }

    // 1. Get current booking dates
    const [currentBooking] = await pool.query(
      'SELECT start_date, end_date FROM bookings WHERE id = ?',
      [bookingId]
    );

    if (currentBooking.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const { start_date, end_date } = currentBooking[0];

    // 2. Check for date overlaps with existing allocations for this hall
    // Overlap condition: (StartA <= EndB) and (EndA >= StartB)
    const [conflicts] = await pool.query(
      `SELECT b.department_agency, b.start_date, b.end_date 
       FROM bookings b
       JOIN booking_halls bh ON b.id = bh.booking_id
       WHERE bh.hall_id = ? 
       AND b.id != ?
       AND (DATE(b.start_date) <= DATE(?) AND DATE(b.end_date) >= DATE(?))`,
      [hall_id, bookingId, end_date, start_date]
    );

    if (conflicts.length > 0) {
      const conflict = conflicts[0];
      const conflictStart = new Date(conflict.start_date).toLocaleDateString('en-IN');
      const conflictEnd = new Date(conflict.end_date).toLocaleDateString('en-IN');
      return res.status(409).json({
        error: `Hall is unavailable. Already booked by ${conflict.department_agency} (${conflictStart} - ${conflictEnd})`
      });
    }

    // 3. Check if this specific allocation already exists (idempotency)
    const [existing] = await pool.query(
      'SELECT * FROM booking_halls WHERE booking_id = ? AND hall_id = ?',
      [bookingId, hall_id]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: 'Hall already allocated to this booking' });
    }

    // 4. Proceed with allocation
    await pool.query(
      'INSERT INTO booking_halls (booking_id, hall_id) VALUES (?, ?)',
      [bookingId, hall_id]
    );

    // Update booking's needs_training_hall status just in case
    await pool.query(
      'UPDATE bookings SET needs_training_hall = TRUE WHERE id = ?',
      [bookingId]
    );

    res.json({ message: 'Hall allocated successfully' });
  } catch (error) {
    console.error('Error allocating hall:', error);
    res.status(500).json({ error: 'Failed to allocate hall' });
  }
}

// Get active bookings for today with allocated halls
export async function getTodayAllocations(req, res) {
  try {
    const { startOfDay, endOfDay } = req.query;

    // We need exact range from client to avoid timezone ambiguity
    // If not provided, fallback to crude server logic (not recommended for production)
    if (!startOfDay || !endOfDay) {
      // Fallback logic for safety
      const now = new Date();
      const fallbackStart = new Date(now.setHours(0, 0, 0, 0)).toISOString();
      const fallbackEnd = new Date(now.setHours(23, 59, 59, 999)).toISOString();

      return res.status(400).json({ error: "startOfDay and endOfDay parameters are required" });
    }

    // We want bookings where the booking overlaps with "Today"
    // Condition: BookingStart <= EndOfToday AND BookingEnd >= StartOfToday
    const query = `
      SELECT 
        b.id, b.department_agency, b.start_date, b.end_date, 
        th.id AS hall_id, th.name AS hall_name, th.floor, th.hall_sub_name
      FROM bookings b
      JOIN booking_halls bh ON b.id = bh.booking_id
      JOIN training_halls th ON bh.hall_id = th.id
      WHERE b.start_date <= ? AND b.end_date >= ?
      ORDER BY th.floor, th.name
    `;

    const [rows] = await pool.query(query, [endOfDay, startOfDay]);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching today allocations:', error);
    res.status(500).json({ error: 'Failed to fetch today allocations' });
  }
}
