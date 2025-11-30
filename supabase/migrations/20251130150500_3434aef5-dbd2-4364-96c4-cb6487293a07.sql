-- Create customers table
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  page_no INTEGER NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  village_name TEXT NOT NULL,
  notes TEXT,
  pending_amount NUMERIC DEFAULT 0,
  created_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own customers"
ON public.customers
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own customers"
ON public.customers
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own customers"
ON public.customers
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own customers"
ON public.customers
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_customers_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();