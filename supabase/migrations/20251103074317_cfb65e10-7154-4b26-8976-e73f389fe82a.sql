-- Add billing details columns to bookings table
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS bill_no TEXT,
ADD COLUMN IF NOT EXISTS billed_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS num_of_bills INTEGER DEFAULT 1;