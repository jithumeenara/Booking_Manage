-- Drop the existing bookings table and recreate with new structure
DROP TABLE IF EXISTS public.bookings CASCADE;

-- Create bookings table for direct facility reservations
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  department_agency TEXT NOT NULL,
  contact_person_name TEXT NOT NULL,
  contact_person_email TEXT NOT NULL,
  contact_person_phone TEXT NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  num_participants INTEGER NOT NULL CHECK (num_participants > 0),
  needs_accommodation BOOLEAN NOT NULL DEFAULT false,
  needs_food BOOLEAN NOT NULL DEFAULT false,
  needs_training_hall BOOLEAN NOT NULL DEFAULT false,
  training_hall_capacity TEXT,
  purpose TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view bookings" 
ON public.bookings 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create bookings" 
ON public.bookings 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update bookings" 
ON public.bookings 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete bookings" 
ON public.bookings 
FOR DELETE 
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_bookings_updated_at
BEFORE UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add bookings to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;

-- Function to check daily accommodation capacity (max 180 people)
CREATE OR REPLACE FUNCTION check_accommodation_capacity()
RETURNS TRIGGER AS $$
DECLARE
  daily_total INTEGER;
  check_date DATE;
BEGIN
  -- Only check if accommodation is needed
  IF NEW.needs_accommodation THEN
    -- Check each day in the booking range
    FOR check_date IN 
      SELECT generate_series(
        DATE(NEW.start_date),
        DATE(NEW.end_date),
        '1 day'::interval
      )::DATE
    LOOP
      -- Calculate total participants needing accommodation on this date
      SELECT COALESCE(SUM(num_participants), 0) INTO daily_total
      FROM public.bookings
      WHERE needs_accommodation = true
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
        AND DATE(start_date) <= check_date
        AND DATE(end_date) >= check_date;
      
      -- Check if adding this booking exceeds capacity
      IF (daily_total + NEW.num_participants) > 180 THEN
        RAISE EXCEPTION 'Accommodation capacity exceeded for date %. Current: %, Requested: %, Max: 180', 
          check_date, daily_total, NEW.num_participants;
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for capacity validation
CREATE TRIGGER validate_accommodation_capacity
BEFORE INSERT OR UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION check_accommodation_capacity();