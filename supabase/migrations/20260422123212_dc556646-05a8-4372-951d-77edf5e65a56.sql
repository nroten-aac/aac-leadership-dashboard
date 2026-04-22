
-- 1. Add discipleship_stage and stage_updated_at to members
ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS discipleship_stage TEXT NOT NULL DEFAULT 'connecting',
  ADD COLUMN IF NOT EXISTS stage_updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Constrain stage values
ALTER TABLE public.members
  DROP CONSTRAINT IF EXISTS members_discipleship_stage_check;
ALTER TABLE public.members
  ADD CONSTRAINT members_discipleship_stage_check
  CHECK (discipleship_stage IN ('connecting','belonging','maturing','ministering','multiplying'));

-- 2. Create stage history table
CREATE TABLE IF NOT EXISTS public.discipleship_stage_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  previous_stage TEXT,
  new_stage TEXT NOT NULL,
  notes TEXT,
  changed_by UUID,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.discipleship_stage_history
  DROP CONSTRAINT IF EXISTS discipleship_stage_history_new_stage_check;
ALTER TABLE public.discipleship_stage_history
  ADD CONSTRAINT discipleship_stage_history_new_stage_check
  CHECK (new_stage IN ('connecting','belonging','maturing','ministering','multiplying'));

CREATE INDEX IF NOT EXISTS idx_stage_history_member ON public.discipleship_stage_history(member_id);
CREATE INDEX IF NOT EXISTS idx_stage_history_changed_at ON public.discipleship_stage_history(changed_at DESC);

-- 3. RLS
ALTER TABLE public.discipleship_stage_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can view stage history" ON public.discipleship_stage_history;
CREATE POLICY "Authenticated can view stage history"
  ON public.discipleship_stage_history FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated can insert stage history" ON public.discipleship_stage_history;
CREATE POLICY "Authenticated can insert stage history"
  ON public.discipleship_stage_history FOR INSERT
  TO authenticated WITH CHECK (true);

-- 4. Trigger: when members.discipleship_stage changes, log it and bump stage_updated_at
CREATE OR REPLACE FUNCTION public.log_discipleship_stage_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND NEW.discipleship_stage IS DISTINCT FROM OLD.discipleship_stage) THEN
    NEW.stage_updated_at := now();
    INSERT INTO public.discipleship_stage_history (member_id, previous_stage, new_stage, changed_by)
    VALUES (NEW.id, OLD.discipleship_stage, NEW.discipleship_stage, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_discipleship_stage_change ON public.members;
CREATE TRIGGER trg_log_discipleship_stage_change
  BEFORE UPDATE ON public.members
  FOR EACH ROW
  EXECUTE FUNCTION public.log_discipleship_stage_change();
