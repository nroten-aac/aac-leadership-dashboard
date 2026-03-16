CREATE TABLE public.building_fund_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  month TEXT NOT NULL,
  year INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.building_fund_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view building_fund_accounts" ON public.building_fund_accounts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert building_fund_accounts" ON public.building_fund_accounts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update building_fund_accounts" ON public.building_fund_accounts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete building_fund_accounts" ON public.building_fund_accounts FOR DELETE TO authenticated USING (true);