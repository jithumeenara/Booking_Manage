-- Fix search_path for accommodation capacity check function
CREATE OR REPLACE FUNCTION check_accommodation_capacity()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;