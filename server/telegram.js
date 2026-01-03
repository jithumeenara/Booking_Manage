import { pool } from './db.js';
import { v4 as uuidv4 } from 'uuid';
import fetch from 'node-fetch';

// Get Telegram configuration
export async function getTelegramConfig(req, res) {
  try {
    const [rows] = await pool.query('SELECT * FROM telegram_config ORDER BY created_at DESC LIMIT 1');
    if (rows.length === 0) {
      return res.json(null);
    }
    // Don't send bot_token to frontend for security
    const { bot_token, ...config } = rows[0];
    res.json(config);
  } catch (error) {
    console.error('Error fetching Telegram config:', error);
    res.status(500).json({ error: 'Failed to fetch Telegram configuration' });
  }
}

// Save Telegram configuration
export async function saveTelegramConfig(req, res) {
  console.log('=== Telegram Config Save Request ===');
  console.log('Request body:', req.body);
  try {
    const { bot_token, chat_id, enabled, notify_on_link_booking, notify_on_billing_ready, notify_on_month_end, notify_on_login } = req.body;

    if (!bot_token || !chat_id) {
      return res.status(400).json({ error: 'Bot token and chat ID are required' });
    }

    // Check if config exists
    const [existing] = await pool.query('SELECT id FROM telegram_config LIMIT 1');
    
    if (existing.length > 0) {
      // Update existing
      await pool.query(
        `UPDATE telegram_config SET 
          bot_token = ?, 
          chat_id = ?, 
          enabled = ?,
          notify_on_link_booking = ?,
          notify_on_billing_ready = ?,
          notify_on_month_end = ?,
          notify_on_login = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`,
        [bot_token, chat_id, enabled ?? false, notify_on_link_booking ?? true, notify_on_billing_ready ?? true, notify_on_month_end ?? true, notify_on_login ?? false, existing[0].id]
      );
    } else {
      // Insert new
      const id = uuidv4();
      await pool.query(
        `INSERT INTO telegram_config (id, bot_token, chat_id, enabled, notify_on_link_booking, notify_on_billing_ready, notify_on_month_end, notify_on_login) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, bot_token, chat_id, enabled ?? false, notify_on_link_booking ?? true, notify_on_billing_ready ?? true, notify_on_month_end ?? true, notify_on_login ?? false]
      );
    }

    res.json({ success: true, message: 'Telegram configuration saved successfully' });
  } catch (error) {
    console.error('Error saving Telegram config:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
      stack: error.stack
    });
    res.status(500).json({ 
      error: 'Failed to save Telegram configuration',
      details: error.message 
    });
  }
}

// Test Telegram connection
export async function testTelegramConfig(req, res) {
  try {
    const { bot_token, chat_id } = req.body;

    if (!bot_token || !chat_id) {
      return res.status(400).json({ error: 'Bot token and chat ID are required' });
    }

    const message = '✅ *ACSTI Booking System Test*\n\nYour Telegram bot is configured correctly!\n\nThis is a test message from ACSTI Booking System.';

    const success = await sendTelegramMessage(bot_token, chat_id, message);

    if (success) {
      res.json({ success: true, message: 'Test message sent successfully!' });
    } else {
      res.status(500).json({ error: 'Failed to send test message. Please check your bot token and chat ID.' });
    }
  } catch (error) {
    console.error('Error testing Telegram:', error);
    res.status(500).json({ error: 'Failed to test Telegram connection' });
  }
}

// Helper function to send Telegram message
export async function sendTelegramMessage(botToken, chatId, message, parseMode = 'Markdown') {
  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: parseMode,
      }),
    });

    const data = await response.json();
    return data.ok;
  } catch (error) {
    console.error('Error sending Telegram message:', error);
    return false;
  }
}

// Get config and send notification
async function getConfigAndSend(eventType, message) {
  try {
    const [rows] = await pool.query('SELECT * FROM telegram_config WHERE enabled = TRUE LIMIT 1');
    if (rows.length === 0) return;

    const config = rows[0];
    
    // Check if this notification type is enabled
    if (eventType === 'link_booking' && !config.notify_on_link_booking) return;
    if (eventType === 'billing_ready' && !config.notify_on_billing_ready) return;
    if (eventType === 'month_end' && !config.notify_on_month_end) return;
    if (eventType === 'login' && !config.notify_on_login) return;

    await sendTelegramMessage(config.bot_token, config.chat_id, message);
  } catch (error) {
    console.error('Error in Telegram notification:', error);
  }
}

// Notification functions to be called from other modules
export async function notifyLinkBooking(bookingData) {
  const message = `
🔗 *New Booking via Link*

*Department:* ${bookingData.department_agency}
*Contact:* ${bookingData.contact_person_name}
*Phone:* ${bookingData.contact_person_phone}
*Dates:* ${new Date(bookingData.start_date).toLocaleDateString()} - ${new Date(bookingData.end_date).toLocaleDateString()}
*Participants:* ${bookingData.num_participants}
*Status:* Pending

A new booking has been submitted through the public booking link.
  `.trim();

  await getConfigAndSend('link_booking', message);
}

export async function notifyBillingReady(bookingData) {
  const message = `
📊 *Booking Ready for Billing*

*Department:* ${bookingData.department_agency}
*Contact:* ${bookingData.contact_person_name}
*Dates:* ${new Date(bookingData.start_date).toLocaleDateString()} - ${new Date(bookingData.end_date).toLocaleDateString()}
*Participants:* ${bookingData.num_participants}

The booking period has ended. This booking is now ready for billing.
  `.trim();

  await getConfigAndSend('billing_ready', message);
}

export async function notifyMonthEnd(stats) {
  const message = `
📅 *Monthly Summary - ${stats.month}*

*Pending Payments:* ${stats.pendingCount} bookings
*Total Pending Amount:* ₹${stats.pendingAmount.toLocaleString('en-IN')}

*Completed Payments:* ${stats.completedCount} bookings
*Total Received:* ₹${stats.completedAmount.toLocaleString('en-IN')}

*Total Revenue:* ₹${stats.totalRevenue.toLocaleString('en-IN')}

End of month financial summary.
  `.trim();

  await getConfigAndSend('month_end', message);
}

export async function notifyLogin(userData) {
  const message = `
🔐 *User Login Alert*

*User:* ${userData.name} (${userData.email})
*Role:* ${userData.role === 'admin' ? 'Administrator' : 'User'}
*Time:* ${new Date().toLocaleString()}

A user has logged into the ACSTI Booking System.
  `.trim();

  await getConfigAndSend('login', message);
}

// Manual notification: Send Upcoming Programmes
export async function sendUpcomingProgrammes(req, res) {
  try {
    // Get Telegram config
    const [configRows] = await pool.query('SELECT * FROM telegram_config WHERE enabled = TRUE LIMIT 1');
    if (configRows.length === 0) {
      return res.status(400).json({ error: 'Telegram bot is not configured or disabled' });
    }
    const config = configRows[0];

    // Get upcoming bookings (start date is today or in the future)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    const [bookings] = await pool.query(
      'SELECT * FROM bookings WHERE DATE(start_date) >= ? ORDER BY start_date ASC LIMIT 20',
      [todayStr]
    );

    if (bookings.length === 0) {
      return res.status(404).json({ error: 'No upcoming programmes found' });
    }

    let message = `📅 *Upcoming Programmes*\n\n`;
    message += `Total Upcoming: ${bookings.length}\n\n`;

    bookings.forEach((booking, index) => {
      message += `${index + 1}. *${booking.department_agency}*\n`;
      message += `   📞 ${booking.contact_person_name}\n`;
      message += `   📆 ${new Date(booking.start_date).toLocaleDateString('en-IN')} - ${new Date(booking.end_date).toLocaleDateString('en-IN')}\n`;
      message += `   👥 ${booking.num_participants} participants\n`;
      message += `   💰 ₹${(booking.total_bill_amount || 0).toLocaleString('en-IN')}\n\n`;
    });

    const success = await sendTelegramMessage(config.bot_token, config.chat_id, message);

    if (success) {
      res.json({ success: true, message: `Sent ${bookings.length} upcoming programmes`, count: bookings.length });
    } else {
      res.status(500).json({ error: 'Failed to send message to Telegram' });
    }
  } catch (error) {
    console.error('Error sending upcoming programmes:', error);
    console.error('Error details:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to send upcoming programmes', details: error.message });
  }
}

// Manual notification: Send Pending Bills
export async function sendPendingBills(req, res) {
  try {
    // Get Telegram config
    const [configRows] = await pool.query('SELECT * FROM telegram_config WHERE enabled = TRUE LIMIT 1');
    if (configRows.length === 0) {
      return res.status(400).json({ error: 'Telegram bot is not configured or disabled' });
    }
    const config = configRows[0];

    // Get bookings with payment_pending status
    const [bookings] = await pool.query(
      'SELECT * FROM bookings WHERE status = ? ORDER BY end_date DESC',
      ['payment_pending']
    );

    if (bookings.length === 0) {
      return res.status(404).json({ error: 'No pending bills found' });
    }

    const totalPending = bookings.reduce((sum, b) => sum + (b.total_bill_amount || 0), 0);

    let message = `💰 *Pending Bills & Payment*\n\n`;
    message += `Total Pending: ${bookings.length} bookings\n`;
    message += `Amount: ₹${totalPending.toLocaleString('en-IN')}\n\n`;

    bookings.forEach((booking, index) => {
      message += `${index + 1}. *${booking.department_agency}*\n`;
      message += `   📞 ${booking.contact_person_name}\n`;
      message += `   📆 ${new Date(booking.start_date).toLocaleDateString('en-IN')} - ${new Date(booking.end_date).toLocaleDateString('en-IN')}\n`;
      message += `   💰 ₹${(booking.total_bill_amount || 0).toLocaleString('en-IN')}\n`;
      message += `   ⏰ Status: Payment Pending\n\n`;
    });

    const success = await sendTelegramMessage(config.bot_token, config.chat_id, message);

    if (success) {
      res.json({ success: true, message: `Sent ${bookings.length} pending bills`, count: bookings.length, total: totalPending });
    } else {
      res.status(500).json({ error: 'Failed to send message to Telegram' });
    }
  } catch (error) {
    console.error('Error sending pending bills:', error);
    console.error('Error details:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to send pending bills', details: error.message });
  }
}

// Manual notification: Send Ready for Billing
export async function sendReadyForBilling(req, res) {
  try {
    // Get Telegram config
    const [configRows] = await pool.query('SELECT * FROM telegram_config WHERE enabled = TRUE LIMIT 1');
    if (configRows.length === 0) {
      return res.status(400).json({ error: 'Telegram bot is not configured or disabled' });
    }
    const config = configRows[0];

    // Get bookings where end_date is today or past, but status is not payment_completed
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const todayStr = today.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    const [bookings] = await pool.query(
      'SELECT * FROM bookings WHERE DATE(end_date) <= ? AND status != ? ORDER BY end_date DESC LIMIT 20',
      [todayStr, 'payment_completed']
    );

    if (bookings.length === 0) {
      return res.status(404).json({ error: 'No bookings ready for billing found' });
    }

    const totalAmount = bookings.reduce((sum, b) => sum + (b.total_bill_amount || 0), 0);

    let message = `📊 *Ready for Billing*\n\n`;
    message += `Total: ${bookings.length} bookings\n`;
    message += `Amount: ₹${totalAmount.toLocaleString('en-IN')}\n\n`;
    message += `These bookings have ended and are ready for billing:\n\n`;

    bookings.forEach((booking, index) => {
      message += `${index + 1}. *${booking.department_agency}*\n`;
      message += `   📞 ${booking.contact_person_name}\n`;
      message += `   📆 ${new Date(booking.start_date).toLocaleDateString('en-IN')} - ${new Date(booking.end_date).toLocaleDateString('en-IN')}\n`;
      message += `   👥 ${booking.num_participants} participants\n`;
      message += `   💰 ₹${(booking.total_bill_amount || 0).toLocaleString('en-IN')}\n`;
      message += `   ⏰ Ended: ${new Date(booking.end_date).toLocaleDateString('en-IN')}\n\n`;
    });

    const success = await sendTelegramMessage(config.bot_token, config.chat_id, message);

    if (success) {
      res.json({ success: true, message: `Sent ${bookings.length} bookings ready for billing`, count: bookings.length, total: totalAmount });
    } else {
      res.status(500).json({ error: 'Failed to send message to Telegram' });
    }
  } catch (error) {
    console.error('Error sending ready for billing:', error);
    console.error('Error details:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to send ready for billing', details: error.message });
  }
}
