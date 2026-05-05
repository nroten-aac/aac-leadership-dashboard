CREATE POLICY "Authenticated can update stage history"
ON public.discipleship_stage_history
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated can delete stage history"
ON public.discipleship_stage_history
FOR DELETE
TO authenticated
USING (true);