-- Create course progress tracking table
CREATE TABLE public.course_progress (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.academy_courses(id) ON DELETE CASCADE,
    progress_percentage INTEGER NOT NULL DEFAULT 0,
    watch_time_seconds INTEGER NOT NULL DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    last_watched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(profile_id, course_id)
);

-- Create user certificates/rewards table
CREATE TABLE public.user_certificates (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.academy_courses(id) ON DELETE CASCADE,
    certificate_number TEXT NOT NULL UNIQUE,
    earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    points_awarded INTEGER NOT NULL DEFAULT 100,
    UNIQUE(profile_id, course_id)
);

-- Create user points table for gamification
CREATE TABLE public.user_points (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    total_points INTEGER NOT NULL DEFAULT 0,
    courses_completed INTEGER NOT NULL DEFAULT 0,
    quizzes_passed INTEGER NOT NULL DEFAULT 0,
    current_streak INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    last_activity_date DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.course_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;

-- Course progress policies
CREATE POLICY "Users can view own progress" ON public.course_progress
    FOR SELECT USING (profile_id = get_current_profile_id());

CREATE POLICY "Users can create own progress" ON public.course_progress
    FOR INSERT WITH CHECK (profile_id = get_current_profile_id());

CREATE POLICY "Users can update own progress" ON public.course_progress
    FOR UPDATE USING (profile_id = get_current_profile_id());

CREATE POLICY "Admins can view all progress" ON public.course_progress
    FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- User certificates policies
CREATE POLICY "Users can view own certificates" ON public.user_certificates
    FOR SELECT USING (profile_id = get_current_profile_id());

CREATE POLICY "Users can create own certificates" ON public.user_certificates
    FOR INSERT WITH CHECK (profile_id = get_current_profile_id());

CREATE POLICY "Admins can view all certificates" ON public.user_certificates
    FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- User points policies
CREATE POLICY "Users can view own points" ON public.user_points
    FOR SELECT USING (profile_id = get_current_profile_id());

CREATE POLICY "Users can create own points" ON public.user_points
    FOR INSERT WITH CHECK (profile_id = get_current_profile_id());

CREATE POLICY "Users can update own points" ON public.user_points
    FOR UPDATE USING (profile_id = get_current_profile_id());

CREATE POLICY "Admins can view all points" ON public.user_points
    FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Function to generate certificate number
CREATE OR REPLACE FUNCTION public.generate_certificate_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_number TEXT;
    number_exists BOOLEAN;
BEGIN
    LOOP
        new_number := 'GYLF-CERT-' || upper(substring(md5(random()::text) from 1 for 8));
        SELECT EXISTS(SELECT 1 FROM public.user_certificates WHERE certificate_number = new_number) INTO number_exists;
        EXIT WHEN NOT number_exists;
    END LOOP;
    RETURN new_number;
END;
$$;

-- Trigger to update user points when certificate is earned
CREATE OR REPLACE FUNCTION public.update_user_points_on_certificate()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.user_points (profile_id, total_points, courses_completed, last_activity_date)
    VALUES (NEW.profile_id, NEW.points_awarded, 1, CURRENT_DATE)
    ON CONFLICT (profile_id) DO UPDATE SET
        total_points = user_points.total_points + NEW.points_awarded,
        courses_completed = user_points.courses_completed + 1,
        last_activity_date = CURRENT_DATE,
        updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_certificate_earned
AFTER INSERT ON public.user_certificates
FOR EACH ROW
EXECUTE FUNCTION public.update_user_points_on_certificate();