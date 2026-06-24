
-- activity_events
DROP POLICY IF EXISTS "auth insert activity_events" ON public.activity_events;
CREATE POLICY "Admins can insert activity_events" ON public.activity_events
  FOR INSERT TO authenticated
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

-- attendance
DROP POLICY IF EXISTS "Authenticated users can insert attendance" ON public.attendance;
DROP POLICY IF EXISTS "Authenticated users can update attendance" ON public.attendance;
DROP POLICY IF EXISTS "Authenticated users can delete attendance" ON public.attendance;
CREATE POLICY "Admins can insert attendance" ON public.attendance
  FOR INSERT TO authenticated
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can update attendance" ON public.attendance
  FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can delete attendance" ON public.attendance
  FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

-- discipleship_programs
DROP POLICY IF EXISTS "Authenticated users can insert programs" ON public.discipleship_programs;
DROP POLICY IF EXISTS "Authenticated users can update programs" ON public.discipleship_programs;
DROP POLICY IF EXISTS "Authenticated users can delete programs" ON public.discipleship_programs;
CREATE POLICY "Admins can insert programs" ON public.discipleship_programs
  FOR INSERT TO authenticated
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can update programs" ON public.discipleship_programs
  FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can delete programs" ON public.discipleship_programs
  FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

-- member_groups
DROP POLICY IF EXISTS "Authenticated users can insert member_groups" ON public.member_groups;
DROP POLICY IF EXISTS "Authenticated users can update member_groups" ON public.member_groups;
DROP POLICY IF EXISTS "Authenticated users can delete member_groups" ON public.member_groups;
CREATE POLICY "Admins can insert member_groups" ON public.member_groups
  FOR INSERT TO authenticated
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can update member_groups" ON public.member_groups
  FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can delete member_groups" ON public.member_groups
  FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

-- program_enrollments
DROP POLICY IF EXISTS "Authenticated users can insert enrollments" ON public.program_enrollments;
DROP POLICY IF EXISTS "Authenticated users can update enrollments" ON public.program_enrollments;
DROP POLICY IF EXISTS "Authenticated users can delete enrollments" ON public.program_enrollments;
CREATE POLICY "Admins can insert enrollments" ON public.program_enrollments
  FOR INSERT TO authenticated
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can update enrollments" ON public.program_enrollments
  FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can delete enrollments" ON public.program_enrollments
  FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));
