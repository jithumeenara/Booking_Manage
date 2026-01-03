-- Drop the trigger and function that enforce accommodation capacity with CASCADE
DROP FUNCTION IF EXISTS public.check_accommodation_capacity() CASCADE;