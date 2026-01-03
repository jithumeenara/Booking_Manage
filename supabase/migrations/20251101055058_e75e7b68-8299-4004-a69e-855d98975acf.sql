-- Add number_of_halls column to bookings table
ALTER TABLE public.bookings 
ADD COLUMN number_of_halls integer DEFAULT 1;

-- Remove the training_hall_capacity column as it will be replaced
ALTER TABLE public.bookings 
DROP COLUMN training_hall_capacity;