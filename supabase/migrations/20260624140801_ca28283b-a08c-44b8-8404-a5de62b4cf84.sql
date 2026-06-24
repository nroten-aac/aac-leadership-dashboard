
-- action_completions
DROP POLICY IF EXISTS "auth write action_completions" ON public.action_completions;
CREATE POLICY "Authenticated can view action_completions" ON public.action_completions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert action_completions" ON public.action_completions
  FOR INSERT TO authenticated WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can update action_completions" ON public.action_completions
  FOR UPDATE TO authenticated USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can delete action_completions" ON public.action_completions
  FOR DELETE TO authenticated USING (private.has_role(auth.uid(), 'admin'::public.app_role));

-- custom_actions
DROP POLICY IF EXISTS "auth write custom_actions" ON public.custom_actions;
CREATE POLICY "Authenticated can view custom_actions" ON public.custom_actions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert custom_actions" ON public.custom_actions
  FOR INSERT TO authenticated WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can update custom_actions" ON public.custom_actions
  FOR UPDATE TO authenticated USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can delete custom_actions" ON public.custom_actions
  FOR DELETE TO authenticated USING (private.has_role(auth.uid(), 'admin'::public.app_role));

-- law_content_overrides
DROP POLICY IF EXISTS "auth write law_content_overrides" ON public.law_content_overrides;
CREATE POLICY "Authenticated can view law_content_overrides" ON public.law_content_overrides
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert law_content_overrides" ON public.law_content_overrides
  FOR INSERT TO authenticated WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can update law_content_overrides" ON public.law_content_overrides
  FOR UPDATE TO authenticated USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can delete law_content_overrides" ON public.law_content_overrides
  FOR DELETE TO authenticated USING (private.has_role(auth.uid(), 'admin'::public.app_role));

-- law_status_overrides
DROP POLICY IF EXISTS "auth write law_status_overrides" ON public.law_status_overrides;
CREATE POLICY "Authenticated can view law_status_overrides" ON public.law_status_overrides
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert law_status_overrides" ON public.law_status_overrides
  FOR INSERT TO authenticated WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can update law_status_overrides" ON public.law_status_overrides
  FOR UPDATE TO authenticated USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can delete law_status_overrides" ON public.law_status_overrides
  FOR DELETE TO authenticated USING (private.has_role(auth.uid(), 'admin'::public.app_role));

-- vision_statement
DROP POLICY IF EXISTS "auth write vision_statement" ON public.vision_statement;
CREATE POLICY "Authenticated can view vision_statement" ON public.vision_statement
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert vision_statement" ON public.vision_statement
  FOR INSERT TO authenticated WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can update vision_statement" ON public.vision_statement
  FOR UPDATE TO authenticated USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can delete vision_statement" ON public.vision_statement
  FOR DELETE TO authenticated USING (private.has_role(auth.uid(), 'admin'::public.app_role));
