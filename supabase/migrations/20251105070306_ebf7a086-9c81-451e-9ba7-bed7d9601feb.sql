-- Create table for single-use booking links
CREATE TABLE public.booking_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  department_name TEXT NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  used_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.booking_links ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view booking links"
ON public.booking_links
FOR SELECT
USING (true);

CREATE POLICY "Anyone can create booking links"
ON public.booking_links
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update booking links"
ON public.booking_links
FOR UPDATE
USING (true);

-- Create index on token for faster lookups
CREATE INDEX idx_booking_links_token ON public.booking_links(token);