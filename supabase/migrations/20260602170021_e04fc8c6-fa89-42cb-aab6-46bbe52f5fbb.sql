-- 1) New columns on members
ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS phase text NOT NULL DEFAULT 'connecting',
  ADD COLUMN IF NOT EXISTS rhythms text[] NOT NULL DEFAULT '{}';

-- 2) Backfill phase + rhythms from existing discipleship_stage
UPDATE public.members SET
  phase = CASE
    WHEN discipleship_stage = 'connecting' THEN 'connecting'
    WHEN discipleship_stage = 'belonging'  THEN 'belonging'
    ELSE 'rhythms'
  END,
  rhythms = CASE
    WHEN discipleship_stage = 'maturing'    THEN ARRAY['maturing']
    WHEN discipleship_stage = 'ministering' THEN ARRAY['ministering']
    WHEN discipleship_stage = 'multiplying' THEN ARRAY['maturing','ministering','multiplying']
    ELSE ARRAY[]::text[]
  END;

-- 3) Validation + auto-sync trigger
CREATE OR REPLACE FUNCTION public.sync_discipleship_phase()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  allowed text[] := ARRAY['maturing','ministering','multiplying'];
  r text;
BEGIN
  -- Normalize / validate phase
  IF NEW.phase IS NULL OR NEW.phase NOT IN ('connecting','belonging','rhythms') THEN
    RAISE EXCEPTION 'Invalid phase: %', NEW.phase;
  END IF;

  -- Normalize rhythms
  IF NEW.rhythms IS NULL THEN NEW.rhythms := ARRAY[]::text[]; END IF;

  -- Enforce phase ↔ rhythms rules
  IF NEW.phase IN ('connecting','belonging') THEN
    NEW.rhythms := ARRAY[]::text[];
  ELSE
    -- phase = 'rhythms' must have at least one valid rhythm
    -- Validate every rhythm is allowed
    FOREACH r IN ARRAY NEW.rhythms LOOP
      IF NOT (r = ANY(allowed)) THEN
        RAISE EXCEPTION 'Invalid rhythm: %', r;
      END IF;
    END LOOP;
    IF array_length(NEW.rhythms, 1) IS NULL THEN
      RAISE EXCEPTION 'phase = rhythms requires at least one rhythm';
    END IF;
  END IF;

  -- Keep legacy discipleship_stage in sync (multiply > minister > mature; else phase)
  NEW.discipleship_stage := CASE
    WHEN NEW.phase = 'connecting' THEN 'connecting'
    WHEN NEW.phase = 'belonging'  THEN 'belonging'
    WHEN 'multiplying' = ANY(NEW.rhythms) THEN 'multiplying'
    WHEN 'ministering' = ANY(NEW.rhythms) THEN 'ministering'
    ELSE 'maturing'
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_discipleship_phase ON public.members;
CREATE TRIGGER trg_sync_discipleship_phase
BEFORE INSERT OR UPDATE OF phase, rhythms ON public.members
FOR EACH ROW EXECUTE FUNCTION public.sync_discipleship_phase();

-- 4) Index to speed up rhythm filtering
CREATE INDEX IF NOT EXISTS idx_members_phase ON public.members(phase);
CREATE INDEX IF NOT EXISTS idx_members_rhythms ON public.members USING GIN(rhythms);