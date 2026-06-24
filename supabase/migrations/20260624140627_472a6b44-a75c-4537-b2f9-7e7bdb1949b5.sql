
-- 1) Private schema for security-definer helper
CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

REVOKE EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;

-- 2) Repoint existing policies to private.has_role, then drop public.has_role
DROP POLICY IF EXISTS "Admins can manage invitations" ON public.invitations;
CREATE POLICY "Admins can manage invitations" ON public.invitations
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
CREATE POLICY "Admins can manage all roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can manage tab permissions" ON public.user_tab_permissions;
CREATE POLICY "Admins can manage tab permissions" ON public.user_tab_permissions
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);

-- 3) Lock down trigger-only SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_invited_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.log_discipleship_stage_change() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sync_discipleship_phase() FROM PUBLIC;

-- 4) Tighten RLS on sensitive tables
-- members: read for any authenticated user; mutations for admins only
DROP POLICY IF EXISTS "Authenticated users can view members" ON public.members;
DROP POLICY IF EXISTS "Authenticated users can insert members" ON public.members;
DROP POLICY IF EXISTS "Authenticated users can update members" ON public.members;
DROP POLICY IF EXISTS "Authenticated users can delete members" ON public.members;
CREATE POLICY "Authenticated can view members" ON public.members
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert members" ON public.members
  FOR INSERT TO authenticated
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can update members" ON public.members
  FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can delete members" ON public.members
  FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

-- donations
DROP POLICY IF EXISTS "Authenticated users can view donations" ON public.donations;
DROP POLICY IF EXISTS "Authenticated users can insert donations" ON public.donations;
DROP POLICY IF EXISTS "Authenticated users can update donations" ON public.donations;
DROP POLICY IF EXISTS "Authenticated users can delete donations" ON public.donations;
CREATE POLICY "Authenticated can view donations" ON public.donations
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert donations" ON public.donations
  FOR INSERT TO authenticated
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can update donations" ON public.donations
  FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can delete donations" ON public.donations
  FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

-- pastoral_notes: admin only for all operations
DROP POLICY IF EXISTS "auth write pastoral_notes" ON public.pastoral_notes;
DROP POLICY IF EXISTS "auth read pastoral_notes" ON public.pastoral_notes;
CREATE POLICY "Admins manage pastoral_notes" ON public.pastoral_notes
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

-- discipleship_stage_history
DROP POLICY IF EXISTS "Authenticated can view stage history" ON public.discipleship_stage_history;
DROP POLICY IF EXISTS "Authenticated can insert stage history" ON public.discipleship_stage_history;
DROP POLICY IF EXISTS "Authenticated can update stage history" ON public.discipleship_stage_history;
DROP POLICY IF EXISTS "Authenticated can delete stage history" ON public.discipleship_stage_history;
CREATE POLICY "Authenticated can view stage history" ON public.discipleship_stage_history
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert stage history" ON public.discipleship_stage_history
  FOR INSERT TO authenticated
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can update stage history" ON public.discipleship_stage_history
  FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can delete stage history" ON public.discipleship_stage_history
  FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

-- building_campaign
DROP POLICY IF EXISTS "Authenticated users can view building_campaign" ON public.building_campaign;
DROP POLICY IF EXISTS "Authenticated users can insert building_campaign" ON public.building_campaign;
DROP POLICY IF EXISTS "Authenticated users can update building_campaign" ON public.building_campaign;
DROP POLICY IF EXISTS "Authenticated users can delete building_campaign" ON public.building_campaign;
CREATE POLICY "Authenticated can view building_campaign" ON public.building_campaign
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert building_campaign" ON public.building_campaign
  FOR INSERT TO authenticated
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can update building_campaign" ON public.building_campaign
  FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can delete building_campaign" ON public.building_campaign
  FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

-- building_campaign_payouts
DROP POLICY IF EXISTS "Authenticated users can view payouts" ON public.building_campaign_payouts;
DROP POLICY IF EXISTS "Authenticated users can insert payouts" ON public.building_campaign_payouts;
DROP POLICY IF EXISTS "Authenticated users can update payouts" ON public.building_campaign_payouts;
DROP POLICY IF EXISTS "Authenticated users can delete payouts" ON public.building_campaign_payouts;
CREATE POLICY "Authenticated can view payouts" ON public.building_campaign_payouts
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert payouts" ON public.building_campaign_payouts
  FOR INSERT TO authenticated
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can update payouts" ON public.building_campaign_payouts
  FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can delete payouts" ON public.building_campaign_payouts
  FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

-- building_fund_accounts
DROP POLICY IF EXISTS "Authenticated users can view building_fund_accounts" ON public.building_fund_accounts;
DROP POLICY IF EXISTS "Authenticated users can insert building_fund_accounts" ON public.building_fund_accounts;
DROP POLICY IF EXISTS "Authenticated users can update building_fund_accounts" ON public.building_fund_accounts;
DROP POLICY IF EXISTS "Authenticated users can delete building_fund_accounts" ON public.building_fund_accounts;
CREATE POLICY "Authenticated can view building_fund_accounts" ON public.building_fund_accounts
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert building_fund_accounts" ON public.building_fund_accounts
  FOR INSERT TO authenticated
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can update building_fund_accounts" ON public.building_fund_accounts
  FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can delete building_fund_accounts" ON public.building_fund_accounts
  FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

-- monthly_giving
DROP POLICY IF EXISTS "Authenticated users can view monthly_giving" ON public.monthly_giving;
DROP POLICY IF EXISTS "Authenticated users can insert monthly_giving" ON public.monthly_giving;
DROP POLICY IF EXISTS "Authenticated users can update monthly_giving" ON public.monthly_giving;
DROP POLICY IF EXISTS "Authenticated users can delete monthly_giving" ON public.monthly_giving;
CREATE POLICY "Authenticated can view monthly_giving" ON public.monthly_giving
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert monthly_giving" ON public.monthly_giving
  FOR INSERT TO authenticated
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can update monthly_giving" ON public.monthly_giving
  FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can delete monthly_giving" ON public.monthly_giving
  FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));
