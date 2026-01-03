-- Make booking links reusable by removing used tracking
ALTER TABLE public.booking_links DROP COLUMN IF EXISTS used;
ALTER TABLE public.booking_links DROP COLUMN IF EXISTS used_at;