CREATE TABLE public.building_campaign_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_date date NOT NULL,
  amount numeric NOT NULL,
  description text,
  payee text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.building_campaign_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view payouts" ON public.building_campaign_payouts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert payouts" ON public.building_campaign_payouts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update payouts" ON public.building_campaign_payouts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete payouts" ON public.building_campaign_payouts FOR DELETE TO authenticated USING (true);

INSERT INTO public.building_campaign_payouts (payout_date, amount, description, payee)
VALUES ('2026-04-06', 185000, 'Initial payout per signed builder contract', 'Builder');
