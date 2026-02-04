-- Create VOD videos table
CREATE TABLE public.vod_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  thumbnail_url TEXT,
  video_url TEXT NOT NULL,
  duration_seconds INTEGER,
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  published_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create VOD likes table
CREATE TABLE public.vod_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES public.vod_videos(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(video_id, profile_id)
);

-- Create VOD comments table
CREATE TABLE public.vod_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES public.vod_videos(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create VOD views tracking table
CREATE TABLE public.vod_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES public.vod_videos(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.vod_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vod_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vod_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vod_views ENABLE ROW LEVEL SECURITY;

-- VOD Videos policies
CREATE POLICY "Anyone can view published videos"
ON public.vod_videos FOR SELECT
USING (is_published = true);

CREATE POLICY "Admins can manage videos"
ON public.vod_videos FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
));

-- VOD Likes policies
CREATE POLICY "Anyone can view likes"
ON public.vod_likes FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can like videos"
ON public.vod_likes FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND profile_id = public.get_current_profile_id());

CREATE POLICY "Users can remove their own likes"
ON public.vod_likes FOR DELETE
USING (profile_id = public.get_current_profile_id());

-- VOD Comments policies
CREATE POLICY "Anyone can view comments"
ON public.vod_comments FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can add comments"
ON public.vod_comments FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND profile_id = public.get_current_profile_id());

CREATE POLICY "Users can update their own comments"
ON public.vod_comments FOR UPDATE
USING (profile_id = public.get_current_profile_id());

CREATE POLICY "Users can delete their own comments"
ON public.vod_comments FOR DELETE
USING (profile_id = public.get_current_profile_id());

-- VOD Views policies
CREATE POLICY "Anyone can view view counts"
ON public.vod_views FOR SELECT
USING (true);

CREATE POLICY "Anyone can record views"
ON public.vod_views FOR INSERT
WITH CHECK (true);

-- Create function to update likes count
CREATE OR REPLACE FUNCTION public.update_vod_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.vod_videos SET likes_count = likes_count + 1 WHERE id = NEW.video_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.vod_videos SET likes_count = likes_count - 1 WHERE id = OLD.video_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for likes count
CREATE TRIGGER update_vod_likes_count_trigger
AFTER INSERT OR DELETE ON public.vod_likes
FOR EACH ROW EXECUTE FUNCTION public.update_vod_likes_count();

-- Create updated_at trigger for videos
CREATE TRIGGER update_vod_videos_updated_at
BEFORE UPDATE ON public.vod_videos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create updated_at trigger for comments
CREATE TRIGGER update_vod_comments_updated_at
BEFORE UPDATE ON public.vod_comments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for vod_comments
ALTER PUBLICATION supabase_realtime ADD TABLE public.vod_comments;