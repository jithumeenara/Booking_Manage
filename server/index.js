import express from 'express';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import xss from 'xss-clean';
import hpp from 'hpp';
import { initAuth, signup, login, logout, me, deleteUser } from './auth.js';
import { getBookings, getBooking, createBooking, updateBooking, deleteBooking } from './bookings.js';
import { getBookingLink, getAllBookingLinks, createBookingLink, deleteBookingLink, sendBookingLinkEmail } from './booking_links.js';
import { getUsers, updateUserRole, updateUserPhoto, resetUserPassword, updateUserProfile } from './users.js';
import { getEmailConfig, saveEmailConfig, testEmailConfig } from './email_config.js';
import { getTelegramConfig, saveTelegramConfig, testTelegramConfig, sendUpcomingProgrammes, sendPendingBills, sendReadyForBilling } from './telegram.js';
import { getUserPermissions, updateUserPermissions, getAllUsersWithPermissions } from './permissions.js';
import { getFinancialYears, createFinancialYear, setActiveFinancialYear, deleteFinancialYear } from './financial_years.js';
import { pool, ensureSchema } from './db.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy if strictly behind one (like Render/Netlify)
app.set('trust proxy', 1);

// Security Headers
app.use(helmet());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/api/', limiter);

// Body Parser with limits
app.use(express.json({ limit: '100mb' })); // Increased limit for base64 images
app.use(cookieParser());

// Sanitize inputs
app.use(xss());
app.use(compression());

// Prevent HTTP Parameter Pollution
app.use(hpp());

// CORS Configuration
const allowedOrigins = [
  'http://localhost:8080',
  'http://localhost:3000',
  'https://acsti-booking.netlify.app',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Allow any Netlify preview/production deploy
    if (origin.endsWith('.netlify.app')) {
      return callback(null, true);
    }

    if (allowedOrigins.indexOf(origin) === -1) {
      // Ideally restricted, but for development we can be permissive or warn
      // For a strict production environment, uncomment the error:
      // return callback(new Error('The CORS policy for this site does not allow access from the specified Origin.'), false);
      return callback(null, true); // Fallback for now to avoid breaking existing workflow
    }
    return callback(null, true);
  },
  credentials: true
}));


// Ensure migrations that the app depends on
async function ensureMigrations() {
  try {
    // Try MySQL 8+ syntax first
    await pool.query(
      `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booked_via_link BOOLEAN NOT NULL DEFAULT FALSE`
    );
  } catch (e) {
    try {
      // Fallback for servers without IF NOT EXISTS support
      const [rows] = await pool.query("SHOW COLUMNS FROM bookings LIKE 'booked_via_link'");
      if (!Array.isArray(rows) || rows.length === 0) {
        await pool.query(
          `ALTER TABLE bookings ADD COLUMN booked_via_link BOOLEAN NOT NULL DEFAULT FALSE`
        );
      }
    } catch (err) {
      console.error('Failed to ensure booked_via_link column:', err);
    }
  }

  // Add email column to booking_links
  try {
    await pool.query(
      `ALTER TABLE booking_links ADD COLUMN IF NOT EXISTS email VARCHAR(255) NULL`
    );
  } catch (e) {
    try {
      const [rows] = await pool.query("SHOW COLUMNS FROM booking_links LIKE 'email'");
      if (!Array.isArray(rows) || rows.length === 0) {
        await pool.query(
          `ALTER TABLE booking_links ADD COLUMN email VARCHAR(255) NULL`
        );
      }
    } catch (err) {
      console.error('Failed to ensure email column in booking_links:', err);
    }
  }

  // Add security column to email_config
  try {
    await pool.query(
      `ALTER TABLE email_config ADD COLUMN IF NOT EXISTS security VARCHAR(20) NOT NULL DEFAULT 'tls'`
    );
  } catch (e) {
    try {
      const [rows] = await pool.query("SHOW COLUMNS FROM email_config LIKE 'security'");
      if (!Array.isArray(rows) || rows.length === 0) {
        await pool.query(
          `ALTER TABLE email_config ADD COLUMN security VARCHAR(20) NOT NULL DEFAULT 'tls'`
        );
      }
    } catch (err) {
      console.error('Failed to ensure security column in email_config:', err);
    }
  }

  // Add is_active column to booking_links
  try {
    await pool.query(
      `ALTER TABLE booking_links ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE`
    );
  } catch (e) {
    try {
      const [rows] = await pool.query("SHOW COLUMNS FROM booking_links LIKE 'is_active'");
      if (!Array.isArray(rows) || rows.length === 0) {
        await pool.query(
          `ALTER TABLE booking_links ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE`
        );
      }
    } catch (err) {
      console.error('Failed to ensure is_active column in booking_links:', err);
    }
  }
}

try {
  await ensureSchema();
  await ensureMigrations();
  await initAuth();
} catch (error) {
  console.error('Failed to initialize database or auth:', error);
  process.exit(1);
}

// Auth routes
app.post('/api/auth/signup', signup);
app.post('/api/auth/login', login);
app.post('/api/auth/logout', logout);
app.get('/api/auth/me', me);

// Booking routes
app.get('/api/bookings', getBookings);
app.get('/api/bookings/:id', getBooking);
app.post('/api/bookings', createBooking);
app.put('/api/bookings/:id', updateBooking);
app.delete('/api/bookings/:id', deleteBooking);

// Booking links routes
app.get('/api/booking-links', getAllBookingLinks);
app.get('/api/booking-links/:token', getBookingLink);
app.post('/api/booking-links', createBookingLink);
app.post('/api/booking-links/send-email', sendBookingLinkEmail);
app.delete('/api/booking-links/:id', deleteBookingLink);

// Users routes
app.get('/api/users', getUsers);
app.put('/api/users/:id', updateUserProfile);
app.put('/api/users/:id/role', updateUserRole);
app.put('/api/users/:id/photo', updateUserPhoto);
app.put('/api/users/:id/password', resetUserPassword);
app.delete('/api/users/:userId', deleteUser);

// Email config routes
app.get('/api/email-config', getEmailConfig);
app.post('/api/email-config', saveEmailConfig);
app.post('/api/email-config/test', testEmailConfig);

// Telegram config routes
app.get('/api/telegram-config', getTelegramConfig);
app.post('/api/telegram-config', saveTelegramConfig);
app.post('/api/telegram-config/test', testTelegramConfig);
app.post('/api/telegram/send-upcoming', sendUpcomingProgrammes);
app.post('/api/telegram/send-pending-bills', sendPendingBills);
app.post('/api/telegram/send-ready-billing', sendReadyForBilling);

// User permissions routes
app.get('/api/users/:userId/permissions', getUserPermissions);
app.put('/api/users/:userId/permissions', updateUserPermissions);
app.get('/api/users-with-permissions', getAllUsersWithPermissions);

// Financial Years routes
app.get('/api/financial-years', getFinancialYears);
app.post('/api/financial-years', createFinancialYear);
app.put('/api/financial-years/:id/activate', setActiveFinancialYear);
app.delete('/api/financial-years/:id', deleteFinancialYear);

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Conditional listen for local development
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`API server running on http://localhost:${PORT}`);
  });
}

export default app;
