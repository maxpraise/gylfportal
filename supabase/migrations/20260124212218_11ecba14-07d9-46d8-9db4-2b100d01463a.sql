-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'regional_leader', 'ambassador');

-- Create regions table
CREATE TABLE public.regions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create growth_paths table (defines levels for leaders)
CREATE TABLE public.growth_paths (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    level INTEGER NOT NULL UNIQUE,
    description TEXT,
    min_referrals INTEGER NOT NULL DEFAULT 0,
    badge_color TEXT DEFAULT 'primary',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    country TEXT,
    region_id UUID REFERENCES public.regions(id),
    current_level_id UUID REFERENCES public.growth_paths(id),
    referral_code TEXT UNIQUE NOT NULL,
    referred_by_profile_id UUID REFERENCES public.profiles(id),
    total_referrals INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    assigned_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Create referral_tracking table for multi-level tracking
CREATE TABLE public.referral_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    referred_profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    level INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (referrer_profile_id, referred_profile_id)
);

-- Create activity_log table
CREATE TABLE public.activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    action TEXT NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.growth_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Security definer function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id AND role = _role
    )
$$;

-- Function to get current user's profile ID
CREATE OR REPLACE FUNCTION public.get_current_profile_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
$$;

-- Function to get current user's region ID
CREATE OR REPLACE FUNCTION public.get_current_region_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT region_id FROM public.profiles WHERE user_id = auth.uid()
$$;

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    new_code TEXT;
    code_exists BOOLEAN;
BEGIN
    LOOP
        new_code := 'GYLF' || upper(substring(md5(random()::text) from 1 for 6));
        SELECT EXISTS(SELECT 1 FROM public.profiles WHERE referral_code = new_code) INTO code_exists;
        EXIT WHEN NOT code_exists;
    END LOOP;
    RETURN new_code;
END;
$$;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for regions (publicly readable)
CREATE POLICY "Regions are viewable by everyone"
    ON public.regions FOR SELECT
    USING (true);

CREATE POLICY "Only admins can insert regions"
    ON public.regions FOR INSERT
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update regions"
    ON public.regions FOR UPDATE
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete regions"
    ON public.regions FOR DELETE
    USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for growth_paths (publicly readable)
CREATE POLICY "Growth paths are viewable by everyone"
    ON public.growth_paths FOR SELECT
    USING (true);

CREATE POLICY "Only admins can insert growth paths"
    ON public.growth_paths FOR INSERT
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update growth paths"
    ON public.growth_paths FOR UPDATE
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete growth paths"
    ON public.growth_paths FOR DELETE
    USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for profiles
CREATE POLICY "Admins can view all profiles"
    ON public.profiles FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Regional leaders can view profiles in their region"
    ON public.profiles FOR SELECT
    USING (
        public.has_role(auth.uid(), 'regional_leader')
        AND region_id = public.get_current_region_id()
    );

CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can view their referrals' profiles"
    ON public.profiles FOR SELECT
    USING (referred_by_profile_id = public.get_current_profile_id());

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Admins can update any profile"
    ON public.profiles FOR UPDATE
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete profiles"
    ON public.profiles FOR DELETE
    USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_roles
CREATE POLICY "Admins can view all roles"
    ON public.user_roles FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own roles"
    ON public.user_roles FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Admins can insert roles"
    ON public.user_roles FOR INSERT
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
    ON public.user_roles FOR UPDATE
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
    ON public.user_roles FOR DELETE
    USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for referral_tracking
CREATE POLICY "Admins can view all referral tracking"
    ON public.referral_tracking FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Regional leaders can view referrals in their region"
    ON public.referral_tracking FOR SELECT
    USING (
        public.has_role(auth.uid(), 'regional_leader')
        AND EXISTS (
            SELECT 1 FROM public.profiles p 
            WHERE p.id = referrer_profile_id 
            AND p.region_id = public.get_current_region_id()
        )
    );

CREATE POLICY "Users can view their own referrals"
    ON public.referral_tracking FOR SELECT
    USING (referrer_profile_id = public.get_current_profile_id());

CREATE POLICY "System can insert referral tracking"
    ON public.referral_tracking FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for activity_log
CREATE POLICY "Admins can view all activity"
    ON public.activity_log FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Regional leaders can view activity in their region"
    ON public.activity_log FOR SELECT
    USING (
        public.has_role(auth.uid(), 'regional_leader')
        AND EXISTS (
            SELECT 1 FROM public.profiles p 
            WHERE p.id = profile_id 
            AND p.region_id = public.get_current_region_id()
        )
    );

CREATE POLICY "Users can view their own activity"
    ON public.activity_log FOR SELECT
    USING (profile_id = public.get_current_profile_id());

CREATE POLICY "System can insert activity"
    ON public.activity_log FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Insert default regions
INSERT INTO public.regions (name) VALUES
    ('North America'),
    ('Europe'),
    ('Africa'),
    ('Asia Pacific'),
    ('Latin America'),
    ('Middle East');

-- Insert default growth paths
INSERT INTO public.growth_paths (name, level, description, min_referrals, badge_color) VALUES
    ('New Ambassador', 1, 'Welcome to GYLF! Start your leadership journey.', 0, 'muted'),
    ('Rising Leader', 2, 'You have started building your network.', 3, 'primary'),
    ('Established Leader', 3, 'Your influence is growing steadily.', 10, 'accent'),
    ('Senior Leader', 4, 'You are a role model for other ambassadors.', 25, 'chart-1'),
    ('Master Leader', 5, 'You have achieved excellence in leadership.', 50, 'chart-2'),
    ('Elite Ambassador', 6, 'Top tier leadership achievement.', 100, 'destructive');