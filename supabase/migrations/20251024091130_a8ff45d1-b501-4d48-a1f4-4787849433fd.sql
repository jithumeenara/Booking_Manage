-- Add new columns to training_programs table
ALTER TABLE public.training_programs
ADD COLUMN department_agency TEXT,
ADD COLUMN no_of_batches INTEGER DEFAULT 1,
ADD COLUMN training_hall_count INTEGER DEFAULT 0,
ADD COLUMN training_hall_capacity TEXT;