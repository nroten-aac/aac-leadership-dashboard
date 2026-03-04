
-- Drop existing attendance table and recreate for aggregate service data
DROP TABLE IF EXISTS public.attendance CASCADE;

CREATE TABLE public.attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_date date NOT NULL,
  month text NOT NULL,
  year integer NOT NULL,
  quarter text NOT NULL,
  service text NOT NULL,
  sanctuary_attendance integer NOT NULL DEFAULT 0,
  volunteer_classroom_attendance integer NOT NULL DEFAULT 0,
  nursery_attendance integer NOT NULL DEFAULT 0,
  k3_attendance integer NOT NULL DEFAULT 0,
  grade_4_6_attendance integer NOT NULL DEFAULT 0,
  youth_attendance integer NOT NULL DEFAULT 0,
  in_person_total integer NOT NULL DEFAULT 0,
  adjusted_total integer NOT NULL DEFAULT 0,
  online_attendance integer NOT NULL DEFAULT 0,
  total_k6_attendance integer NOT NULL DEFAULT 0,
  total_adults integer NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view attendance" ON public.attendance FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert attendance" ON public.attendance FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update attendance" ON public.attendance FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete attendance" ON public.attendance FOR DELETE TO authenticated USING (true);
