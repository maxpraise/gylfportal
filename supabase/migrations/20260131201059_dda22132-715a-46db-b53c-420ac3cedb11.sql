-- Create table for dynamic promo banners
CREATE TABLE public.promo_banners (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT,
    image_url TEXT NOT NULL,
    external_link TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for live stream configuration
CREATE TABLE public.live_stream_config (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    stream_url TEXT NOT NULL,
    is_live BOOLEAN NOT NULL DEFAULT false,
    title TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for news interactions (likes, comments)
CREATE TABLE public.news_interactions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    news_id TEXT NOT NULL,
    profile_id UUID NOT NULL,
    interaction_type TEXT NOT NULL CHECK (interaction_type IN ('like', 'share')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(news_id, profile_id, interaction_type)
);

-- Create table for news comments
CREATE TABLE public.news_comments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    news_id TEXT NOT NULL,
    profile_id UUID NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.promo_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_stream_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_comments ENABLE ROW LEVEL SECURITY;

-- Promo banners: public read, admin write
CREATE POLICY "Anyone can view active banners"
ON public.promo_banners FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage banners"
ON public.promo_banners FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Live stream config: public read, admin write
CREATE POLICY "Anyone can view stream config"
ON public.live_stream_config FOR SELECT
USING (true);

CREATE POLICY "Admins can manage stream config"
ON public.live_stream_config FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- News interactions: authenticated users
CREATE POLICY "Users can view all interactions"
ON public.news_interactions FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create their own interactions"
ON public.news_interactions FOR INSERT
WITH CHECK (profile_id = get_current_profile_id());

CREATE POLICY "Users can delete their own interactions"
ON public.news_interactions FOR DELETE
USING (profile_id = get_current_profile_id());

-- News comments: authenticated users
CREATE POLICY "Anyone can view comments"
ON public.news_comments FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create comments"
ON public.news_comments FOR INSERT
WITH CHECK (profile_id = get_current_profile_id());

CREATE POLICY "Users can update their own comments"
ON public.news_comments FOR UPDATE
USING (profile_id = get_current_profile_id());

CREATE POLICY "Users can delete their own comments"
ON public.news_comments FOR DELETE
USING (profile_id = get_current_profile_id());

-- Add foreign keys for profile references
ALTER TABLE public.news_interactions
ADD CONSTRAINT news_interactions_profile_id_fkey
FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.news_comments
ADD CONSTRAINT news_comments_profile_id_fkey
FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add triggers for updated_at
CREATE TRIGGER update_promo_banners_updated_at
BEFORE UPDATE ON public.promo_banners
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_live_stream_config_updated_at
BEFORE UPDATE ON public.live_stream_config
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_news_comments_updated_at
BEFORE UPDATE ON public.news_comments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default promo banners
INSERT INTO public.promo_banners (title, image_url, external_link, order_index) VALUES
('GYLF Academy Online', 'https://globalyouthleadersforum.org/iassets/images/academyonline-min.jpg', 'https://globalyouthleadersforum.org', 1),
('GYTV', 'https://hsch.ceflixcdn.com/GYTV/gytv_slide_min_2-min.jpeg', 'https://globalyouthleadersforum.org', 2),
('HEART Initiative', 'https://hsch.ceflixcdn.com/hsopc/heartecard.jpg', 'https://globalyouthleadersforum.org', 3),
('HTT Magazine', 'https://hsch.ceflixcdn.com/hsopc/httnmagjan26.jpg', 'https://globalyouthleadersforum.org', 4);

-- Insert default live stream config
INSERT INTO public.live_stream_config (stream_url, is_live, title) VALUES
('https://pvqybrzodz24-hls-live.5centscdn.com/HSOP/955ad3298db330b5ee880c2c9e6f23a0.sdp/playlist.m3u8', false, 'GYLF Live Stream');