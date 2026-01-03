-- Create training_programs table
CREATE TABLE public.training_programs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  max_participants INTEGER NOT NULL DEFAULT 180,
  has_accommodation BOOLEAN NOT NULL DEFAULT false,
  has_food BOOLEAN NOT NULL DEFAULT false,
  has_training_hall BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bookings table
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID NOT NULL REFERENCES public.training_programs(id) ON DELETE CASCADE,
  participant_name TEXT NOT NULL,
  participant_email TEXT NOT NULL,
  participant_phone TEXT NOT NULL,
  num_participants INTEGER NOT NULL,
  needs_accommodation BOOLEAN NOT NULL DEFAULT false,
  needs_food BOOLEAN NOT NULL DEFAULT false,
  needs_training_hall BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.training_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Create policies for training_programs (public read, no write for now)
CREATE POLICY "Anyone can view training programs" 
ON public.training_programs 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert training programs" 
ON public.training_programs 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update training programs" 
ON public.training_programs 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete training programs" 
ON public.training_programs 
FOR DELETE 
USING (true);

-- Create policies for bookings (public read and write)
CREATE POLICY "Anyone can view bookings" 
ON public.bookings 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create bookings" 
ON public.bookings 
FOR INSERT 
WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_training_programs_updated_at
BEFORE UPDATE ON public.training_programs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for both tables
ALTER TABLE public.training_programs REPLICA IDENTITY FULL;
ALTER TABLE public.bookings REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.training_programs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;