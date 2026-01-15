import { z } from 'zod';

export const bookingSchema = z.object({
    department_agency: z.string().min(1, 'Department/Agency is required'),
    contact_person_name: z.string().min(1, 'Contact person name is required'),
    contact_person_email: z.string().email('Invalid email address'),
    contact_person_phone: z.string().min(10, 'Phone number must be at least 10 digits'),
    start_date: z.string().datetime().or(z.string().refine(val => !isNaN(Date.parse(val)), { message: "Invalid date format" })),
    end_date: z.string().datetime().or(z.string().refine(val => !isNaN(Date.parse(val)), { message: "Invalid date format" })),
    num_participants: z.number().int().positive('Number of participants must be positive').or(z.string().transform(val => parseInt(val, 10))),
    needs_accommodation: z.boolean().optional(),
    needs_food: z.boolean().optional(),
    needs_training_hall: z.boolean().optional(),
    number_of_halls: z.number().int().min(0).optional().default(0),
    purpose: z.string().optional(),
    financial_year: z.string().optional(),
    status: z.enum(['pending', 'complete', 'payment_completed', 'payment_pending']).optional(),
    booked_via_link: z.boolean().optional(),
    booking_link_token: z.string().optional(),
    hall_ids: z.array(z.string()).optional()
});

export const signupSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    name: z.string().min(1, 'Name is required'),
    role: z.enum(['user', 'admin']).optional(),
    mobile: z.string().optional(),
    photo: z.string().optional(), // Base64 or URL
});
