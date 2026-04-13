
-- Add PCO ID to members for dedup
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS pco_id text UNIQUE;

-- Create member_groups junction table
CREATE TABLE public.member_groups (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  group_name text NOT NULL,
  group_type text NOT NULL DEFAULT 'discipleship',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(member_id, group_name, group_type)
);

-- Enable RLS
ALTER TABLE public.member_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view member_groups"
  ON public.member_groups FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert member_groups"
  ON public.member_groups FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update member_groups"
  ON public.member_groups FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete member_groups"
  ON public.member_groups FOR DELETE TO authenticated USING (true);
