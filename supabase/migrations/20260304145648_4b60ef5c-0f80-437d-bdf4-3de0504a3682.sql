-- Create timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Members table
CREATE TABLE public.members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  date_of_birth DATE,
  membership_date DATE NOT NULL DEFAULT CURRENT_DATE,
  membership_status TEXT NOT NULL DEFAULT 'active' CHECK (membership_status IN ('active', 'inactive', 'visitor')),
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  photo_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view members" ON public.members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert members" ON public.members FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update members" ON public.members FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete members" ON public.members FOR DELETE TO authenticated USING (true);
CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON public.members FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Attendance table
CREATE TABLE public.attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'sunday_service' CHECK (event_type IN ('sunday_service', 'wednesday_service', 'special_event', 'life_group', 'bible_study', 'other')),
  event_date DATE NOT NULL,
  present BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view attendance" ON public.attendance FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert attendance" ON public.attendance FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update attendance" ON public.attendance FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete attendance" ON public.attendance FOR DELETE TO authenticated USING (true);

-- Donations table
CREATE TABLE public.donations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  donation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  donation_type TEXT NOT NULL DEFAULT 'tithe' CHECK (donation_type IN ('tithe', 'offering', 'missions', 'building_fund', 'special', 'other')),
  payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'check', 'online', 'card', 'other')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view donations" ON public.donations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert donations" ON public.donations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update donations" ON public.donations FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete donations" ON public.donations FOR DELETE TO authenticated USING (true);

-- Discipleship programs table
CREATE TABLE public.discipleship_programs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  program_type TEXT NOT NULL CHECK (program_type IN ('life_group', 'pt_program', 'discipleship_group', 'bible_study')),
  description TEXT,
  leader_name TEXT,
  meeting_day TEXT,
  meeting_time TIME,
  location TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.discipleship_programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view programs" ON public.discipleship_programs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert programs" ON public.discipleship_programs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update programs" ON public.discipleship_programs FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete programs" ON public.discipleship_programs FOR DELETE TO authenticated USING (true);
CREATE TRIGGER update_programs_updated_at BEFORE UPDATE ON public.discipleship_programs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Member-program enrollment (many-to-many)
CREATE TABLE public.program_enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES public.discipleship_programs(id) ON DELETE CASCADE,
  enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(member_id, program_id)
);

ALTER TABLE public.program_enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view enrollments" ON public.program_enrollments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert enrollments" ON public.program_enrollments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update enrollments" ON public.program_enrollments FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete enrollments" ON public.program_enrollments FOR DELETE TO authenticated USING (true);

-- Profiles table for auth users
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'pastor', 'leader', 'viewer')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Indexes
CREATE INDEX idx_attendance_member_id ON public.attendance(member_id);
CREATE INDEX idx_attendance_event_date ON public.attendance(event_date);
CREATE INDEX idx_donations_member_id ON public.donations(member_id);
CREATE INDEX idx_donations_date ON public.donations(donation_date);
CREATE INDEX idx_enrollments_member_id ON public.program_enrollments(member_id);
CREATE INDEX idx_enrollments_program_id ON public.program_enrollments(program_id);
CREATE INDEX idx_members_status ON public.members(membership_status);