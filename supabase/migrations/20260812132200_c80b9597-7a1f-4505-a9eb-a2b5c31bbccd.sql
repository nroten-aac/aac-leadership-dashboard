CREATE TABLE public.pastoral_note_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  note text NOT NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pastoral_note_entries TO authenticated;
GRANT ALL ON public.pastoral_note_entries TO service_role;
ALTER TABLE public.pastoral_note_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view pastoral note entries" ON public.pastoral_note_entries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage pastoral note entries" ON public.pastoral_note_entries FOR ALL TO authenticated USING (private.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));
CREATE INDEX idx_pastoral_note_entries_member ON public.pastoral_note_entries(member_id, created_at DESC);
CREATE TRIGGER update_pastoral_note_entries_updated_at BEFORE UPDATE ON public.pastoral_note_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.pastoral_note_entries (member_id, note, created_by, created_at, updated_at)
SELECT member_id, note, updated_by, updated_at, updated_at FROM public.pastoral_notes WHERE note IS NOT NULL AND btrim(note) <> '';

CREATE TABLE public.member_action_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  title text NOT NULL,
  details text,
  due_date date,
  status text NOT NULL DEFAULT 'open',
  completed_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.member_action_steps TO authenticated;
GRANT ALL ON public.member_action_steps TO service_role;
ALTER TABLE public.member_action_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view action steps" ON public.member_action_steps FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage action steps" ON public.member_action_steps FOR ALL TO authenticated USING (private.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));
CREATE INDEX idx_member_action_steps_status ON public.member_action_steps(status, due_date);
CREATE TRIGGER update_member_action_steps_updated_at BEFORE UPDATE ON public.member_action_steps FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();