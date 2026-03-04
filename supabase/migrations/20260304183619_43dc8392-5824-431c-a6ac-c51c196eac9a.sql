CREATE TABLE public.monthly_giving (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year integer NOT NULL,
  month text NOT NULL,
  fund text NOT NULL DEFAULT 'general',
  amount numeric NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.monthly_giving ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view monthly_giving" ON public.monthly_giving FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert monthly_giving" ON public.monthly_giving FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update monthly_giving" ON public.monthly_giving FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete monthly_giving" ON public.monthly_giving FOR DELETE TO authenticated USING (true);