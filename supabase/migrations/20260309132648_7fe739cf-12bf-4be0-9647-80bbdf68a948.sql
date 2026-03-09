
-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'viewer');

-- Create user_roles table (separate from profiles per security guidelines)
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'viewer',
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Admins can manage all roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Invitations table
CREATE TABLE public.invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending',
  allowed_tabs text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz
);

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage invitations"
ON public.invitations FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- User tab permissions table
CREATE TABLE public.user_tab_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tab_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, tab_name)
);

ALTER TABLE public.user_tab_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage tab permissions"
ON public.user_tab_permissions FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own permissions"
ON public.user_tab_permissions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Trigger: when a user signs up, check if they have an invitation and apply permissions
CREATE OR REPLACE FUNCTION public.handle_invited_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv RECORD;
  tab TEXT;
BEGIN
  -- Find a pending invitation for this email
  SELECT * INTO inv FROM public.invitations
  WHERE email = NEW.email AND status = 'pending'
  LIMIT 1;

  IF inv IS NOT NULL THEN
    -- Mark invitation as accepted
    UPDATE public.invitations SET status = 'accepted', accepted_at = now() WHERE id = inv.id;

    -- Create viewer role
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'viewer') ON CONFLICT DO NOTHING;

    -- Create tab permissions from invitation
    FOREACH tab IN ARRAY inv.allowed_tabs LOOP
      INSERT INTO public.user_tab_permissions (user_id, tab_name) VALUES (NEW.id, tab) ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_invite
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_invited_user();
