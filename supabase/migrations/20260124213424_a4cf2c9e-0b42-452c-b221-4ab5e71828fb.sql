-- Create HEART initiative categories enum
CREATE TYPE public.heart_category AS ENUM ('humanitarian', 'evangelism', 'arts', 'representation', 'technology');

-- Create giving categories enum
CREATE TYPE public.giving_category AS ENUM ('hslhs', 'magazine', 'gylf_missions_trips', 'offerings', 'gylf_conferences', 'sponsor_gytv', 'gylf_outreaches', 'gylf_academy');

-- Create OTP verification table
CREATE TABLE public.otp_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    phone TEXT,
    otp_code TEXT NOT NULL,
    otp_type TEXT NOT NULL DEFAULT 'email',
    expires_at TIMESTAMPTZ NOT NULL,
    verified BOOLEAN NOT NULL DEFAULT false,
    attempts INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create summit reports table
CREATE TABLE public.summit_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    location TEXT NOT NULL,
    country TEXT NOT NULL,
    state TEXT,
    city TEXT,
    event_date DATE NOT NULL,
    attendees_count INTEGER NOT NULL DEFAULT 0,
    souls_won INTEGER NOT NULL DEFAULT 0,
    new_members INTEGER NOT NULL DEFAULT 0,
    description TEXT,
    testimonies TEXT,
    image_urls TEXT[] DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create HEART initiative reports table
CREATE TABLE public.heart_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    category heart_category NOT NULL,
    outreach_name TEXT NOT NULL,
    country TEXT NOT NULL,
    state TEXT,
    city TEXT,
    location_details TEXT,
    event_date DATE NOT NULL,
    reach_impact INTEGER NOT NULL DEFAULT 0,
    souls_won INTEGER NOT NULL DEFAULT 0,
    souls_data_url TEXT,
    magazines_shared INTEGER NOT NULL DEFAULT 0,
    youths_incorporated INTEGER NOT NULL DEFAULT 0,
    youths_data_url TEXT,
    testimonies TEXT,
    summary TEXT,
    image_urls TEXT[] DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create connect meetings table
CREATE TABLE public.connect_meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    meeting_title TEXT NOT NULL,
    meeting_date DATE NOT NULL,
    meeting_type TEXT NOT NULL DEFAULT 'online',
    attendees_count INTEGER NOT NULL DEFAULT 0,
    first_timers INTEGER NOT NULL DEFAULT 0,
    offering_amount DECIMAL(10,2) DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    summary TEXT,
    image_urls TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create partnerships/giving table
CREATE TABLE public.partnerships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    category giving_category NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    payment_method TEXT NOT NULL,
    transaction_reference TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create testimonies table
CREATE TABLE public.testimonies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    testimony TEXT NOT NULL,
    category TEXT,
    is_approved BOOLEAN NOT NULL DEFAULT false,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create academy courses table
CREATE TABLE public.academy_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    duration_hours INTEGER DEFAULT 1,
    video_url TEXT,
    thumbnail_url TEXT,
    is_published BOOLEAN NOT NULL DEFAULT false,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create academy quizzes table
CREATE TABLE public.academy_quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES public.academy_courses(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    questions JSONB NOT NULL DEFAULT '[]',
    passing_score INTEGER NOT NULL DEFAULT 70,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create quiz attempts table
CREATE TABLE public.quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    quiz_id UUID REFERENCES public.academy_quizzes(id) ON DELETE CASCADE NOT NULL,
    answers JSONB NOT NULL DEFAULT '[]',
    score INTEGER NOT NULL DEFAULT 0,
    passed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create prayer requests table
CREATE TABLE public.prayer_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    request TEXT NOT NULL,
    is_anonymous BOOLEAN NOT NULL DEFAULT false,
    is_answered BOOLEAN NOT NULL DEFAULT false,
    prayer_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create storage bucket for file uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('gylf-uploads', 'gylf-uploads', true);

-- Enable RLS on new tables
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.summit_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.heart_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connect_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partnerships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prayer_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for OTP (open for verification process)
CREATE POLICY "Anyone can create OTP" ON public.otp_verifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read their OTP" ON public.otp_verifications FOR SELECT USING (true);
CREATE POLICY "Anyone can update their OTP" ON public.otp_verifications FOR UPDATE USING (true);

-- RLS Policies for summit_reports
CREATE POLICY "Users can view own summit reports" ON public.summit_reports FOR SELECT USING (profile_id = get_current_profile_id());
CREATE POLICY "Users can create summit reports" ON public.summit_reports FOR INSERT WITH CHECK (profile_id = get_current_profile_id());
CREATE POLICY "Users can update own summit reports" ON public.summit_reports FOR UPDATE USING (profile_id = get_current_profile_id());
CREATE POLICY "Admins can view all summit reports" ON public.summit_reports FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update all summit reports" ON public.summit_reports FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for heart_reports
CREATE POLICY "Users can view own heart reports" ON public.heart_reports FOR SELECT USING (profile_id = get_current_profile_id());
CREATE POLICY "Users can create heart reports" ON public.heart_reports FOR INSERT WITH CHECK (profile_id = get_current_profile_id());
CREATE POLICY "Users can update own heart reports" ON public.heart_reports FOR UPDATE USING (profile_id = get_current_profile_id());
CREATE POLICY "Admins can view all heart reports" ON public.heart_reports FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update all heart reports" ON public.heart_reports FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for connect_meetings
CREATE POLICY "Users can view own meetings" ON public.connect_meetings FOR SELECT USING (profile_id = get_current_profile_id());
CREATE POLICY "Users can create meetings" ON public.connect_meetings FOR INSERT WITH CHECK (profile_id = get_current_profile_id());
CREATE POLICY "Admins can view all meetings" ON public.connect_meetings FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for partnerships
CREATE POLICY "Users can view own partnerships" ON public.partnerships FOR SELECT USING (profile_id = get_current_profile_id());
CREATE POLICY "Users can create partnerships" ON public.partnerships FOR INSERT WITH CHECK (profile_id = get_current_profile_id());
CREATE POLICY "Admins can view all partnerships" ON public.partnerships FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for testimonies
CREATE POLICY "Users can create testimonies" ON public.testimonies FOR INSERT WITH CHECK (profile_id = get_current_profile_id());
CREATE POLICY "Users can view own testimonies" ON public.testimonies FOR SELECT USING (profile_id = get_current_profile_id());
CREATE POLICY "Users can view approved testimonies" ON public.testimonies FOR SELECT USING (is_approved = true);
CREATE POLICY "Admins can manage testimonies" ON public.testimonies FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for academy_courses (publicly visible if published)
CREATE POLICY "Published courses are viewable" ON public.academy_courses FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can manage courses" ON public.academy_courses FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for academy_quizzes
CREATE POLICY "Quizzes for published courses are viewable" ON public.academy_quizzes FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.academy_courses WHERE id = course_id AND is_published = true)
);
CREATE POLICY "Admins can manage quizzes" ON public.academy_quizzes FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for quiz_attempts
CREATE POLICY "Users can view own attempts" ON public.quiz_attempts FOR SELECT USING (profile_id = get_current_profile_id());
CREATE POLICY "Users can create attempts" ON public.quiz_attempts FOR INSERT WITH CHECK (profile_id = get_current_profile_id());
CREATE POLICY "Admins can view all attempts" ON public.quiz_attempts FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for prayer_requests
CREATE POLICY "Users can create prayer requests" ON public.prayer_requests FOR INSERT WITH CHECK (profile_id = get_current_profile_id());
CREATE POLICY "Users can view own requests" ON public.prayer_requests FOR SELECT USING (profile_id = get_current_profile_id());
CREATE POLICY "Users can view non-anonymous requests" ON public.prayer_requests FOR SELECT USING (is_anonymous = false);
CREATE POLICY "Admins can view all requests" ON public.prayer_requests FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- Storage policies for gylf-uploads bucket
CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'gylf-uploads' AND auth.uid() IS NOT NULL);
CREATE POLICY "Anyone can view uploads" ON storage.objects FOR SELECT USING (bucket_id = 'gylf-uploads');
CREATE POLICY "Users can delete own uploads" ON storage.objects FOR DELETE USING (bucket_id = 'gylf-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Triggers for updated_at
CREATE TRIGGER update_summit_reports_updated_at BEFORE UPDATE ON public.summit_reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_heart_reports_updated_at BEFORE UPDATE ON public.heart_reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();