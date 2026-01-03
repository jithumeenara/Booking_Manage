-- Add is_private column to training_programs table
ALTER TABLE training_programs 
ADD COLUMN is_private boolean NOT NULL DEFAULT false;

-- Add comment explaining the private flag
COMMENT ON COLUMN training_programs.is_private IS 'Programs with more than 180 participants should be marked as private';