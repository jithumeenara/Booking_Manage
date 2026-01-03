-- Add financial tracking columns to bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending' CHECK (status IN ('pending', 'complete', 'payment_completed', 'payment_pending')),
ADD COLUMN IF NOT EXISTS total_bill_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS completed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS financial_year text;

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_financial_year ON public.bookings(financial_year);