
CREATE TABLE public.building_campaign (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month text NOT NULL,
  year integer NOT NULL,
  monthly_giving_deposits numeric NOT NULL DEFAULT 0,
  cd_0668 numeric DEFAULT NULL,
  cd_1941 numeric DEFAULT NULL,
  money_market numeric DEFAULT NULL,
  cd_2029 numeric DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (month, year)
);

ALTER TABLE public.building_campaign ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view building_campaign" ON public.building_campaign FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert building_campaign" ON public.building_campaign FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update building_campaign" ON public.building_campaign FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete building_campaign" ON public.building_campaign FOR DELETE TO authenticated USING (true);
