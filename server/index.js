import express from 'express';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import xss from 'xss-clean';
import hpp from 'hpp';
import { initAuth, signup, login, logout, me, deleteUser } from './auth.js';
import {
  getBookings,
  getBooking,
  createBooking,
  updateBooking,
  deleteBooking,
  allocateHallToBooking,
  getTodayAllocations
} from './bookings.js';
import { getBookingLink, getAllBookingLinks, createBookingLink, deleteBookingLink, sendBookingLinkEmail } from './booking_links.js';
import { getUsers, updateUserRole, updateUserPhoto, resetUserPassword, updateUserProfile } from './users.js';
import { getEmailConfig, saveEmailConfig, testEmailConfig } from './email_config.js';
import { getTelegramConfig, saveTelegramConfig, testTelegramConfig, sendUpcomingProgrammes, sendPendingBills, sendReadyForBilling } from './telegram.js';
import { getFinancialYears, createFinancialYear, setActiveFinancialYear, deleteFinancialYear } from './financial_years.js';
import { getTrainingHalls, createTrainingHall, updateTrainingHall, deleteTrainingHall, getBookingAllocations, getHallSchedule, deleteHallAllocation, checkHallAvailability } from './training_halls.js';
import { getFloors, createFloor, updateFloor, deleteFloor } from './floors.js';
import { pool, ensureSchema } from './db.js';
import { getAllUsersWithPermissions, updateUserPermissions, getUserPermissions } from './permissions.js';

const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Compression middleware
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser
app.use(cookieParser());

// Sanitize data
app.use(xss());
app.use(hpp());

// CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:4173'],
  credentials: true
}));

// Initialize DB schema
ensureSchema().catch(console.error);

// Routes
// Auth routes
app.post('/api/auth/signup', signup);
app.post('/api/auth/login', login);
app.post('/api/auth/logout', logout);
app.get('/api/auth/me', me);

// Booking routes
app.get('/api/bookings', getBookings);
app.get('/api/bookings/today-allocations', getTodayAllocations);
app.get('/api/bookings/:id', getBooking);
app.post('/api/bookings', createBooking);
app.put('/api/bookings/:id', updateBooking);
app.delete('/api/bookings/:id', deleteBooking);
app.post('/api/bookings/:bookingId/halls', allocateHallToBooking);

// Booking links routes
app.get('/api/booking-links', getAllBookingLinks);
app.get('/api/booking-links/:token', getBookingLink);
app.post('/api/booking-links', createBookingLink);
app.delete('/api/booking-links/:id', deleteBookingLink);
app.post('/api/booking-links/:id/send', sendBookingLinkEmail);

// Training Halls routes
app.get('/api/training-halls', getTrainingHalls);
app.get('/api/training-halls/availability', checkHallAvailability);
app.post('/api/training-halls', createTrainingHall);
app.get('/api/training-halls/:id/schedule', getHallSchedule);
app.put('/api/training-halls/:id', updateTrainingHall);
app.delete('/api/training-halls/:id', deleteTrainingHall);
app.delete('/api/training-halls/:hallId/allocations/:bookingId', deleteHallAllocation);
app.get('/api/bookings/:bookingId/allocations', getBookingAllocations);

// Floors routes
app.get('/api/floors', getFloors);
app.post('/api/floors', createFloor);
app.put('/api/floors/:id', updateFloor);
app.delete('/api/floors/:id', deleteFloor);

// Users routes
app.get('/api/users', getUsers);
app.put('/api/users/:id/role', updateUserRole);
app.put('/api/users/:id/photo', updateUserPhoto);
app.delete('/api/users/:id', deleteUser);
app.post('/api/users/:id/reset-password', resetUserPassword);
app.put('/api/users/:id/profile', updateUserProfile);

// User permissions routes
app.get('/api/users/:userId/permissions', getUserPermissions);
app.put('/api/users/:userId/permissions', updateUserPermissions);
app.get('/api/users-with-permissions', getAllUsersWithPermissions);

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

// Financial Years routes
app.get('/api/financial-years', getFinancialYears);
app.post('/api/financial-years', createFinancialYear);
app.put('/api/financial-years/:id/activate', setActiveFinancialYear);
app.delete('/api/financial-years/:id', deleteFinancialYear);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
