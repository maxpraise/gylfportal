import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { Play, Eye, Heart, ChevronRight } from 'lucide-react';
import { formatDuration, getCategoryLabel } from '@/lib/vodCategories';

interface VODVideo {
  id: string;
  title: string;
  description: string | null;
  category: string;
  thumbnail_url: string | null;
  video_url: string;
  duration_seconds: number | null;
  views_count: number;
  likes_count: number;
  is_featured: boolean;
}

const VODCarousel = () => {
  const navigate = useNavigate();
  const [videos, setVideos] = useState<VODVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      const { data, error } = await supabase
        .from('vod_videos')
        .select('*')
        .eq('is_published', true)
        .order('published_at', { ascending: false })
        .limit(10);

      if (data) {
        setVideos(data);
      }
      setIsLoading(false);
    };

    fetchVideos();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-title-large font-medium text-foreground">Videos on Demand</h2>
        </div>
        <div className="flex gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="w-64 h-40 rounded-xl flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-title-large font-medium text-foreground">Videos on Demand</h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/gytv/videos')}>
            View All <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
        <div className="bg-surface-container-high rounded-xl p-8 text-center">
          <Play className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-body-large text-muted-foreground">No videos available yet</p>
          <p className="text-body-small text-muted-foreground mt-1">Check back soon for new content</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-title-large font-medium text-foreground">Videos on Demand</h2>
        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/gytv/videos')}>
          View All <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
      
      <Carousel
        opts={{
          align: 'start',
          loop: false,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {videos.map((video) => (
            <CarouselItem key={video.id} className="pl-2 md:pl-4 basis-4/5 md:basis-1/2 lg:basis-1/3">
              <Card
                className="overflow-hidden cursor-pointer group border-0 shadow-elevation-1 hover:shadow-elevation-2 transition-shadow"
                onClick={() => navigate(`/dashboard/gytv/videos/${video.id}`)}
              >
                <AspectRatio ratio={16 / 9}>
                  <div className="relative w-full h-full bg-surface-container-highest">
                    {video.thumbnail_url ? (
                      <img
                        src={video.thumbnail_url}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Play className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-primary text-primary-foreground p-3 rounded-full">
                        <Play className="h-6 w-6" />
                      </div>
                    </div>
                    {video.duration_seconds && (
                      <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded">
                        {formatDuration(video.duration_seconds)}
                      </span>
                    )}
                    {video.is_featured && (
                      <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded">
                        FEATURED
                      </span>
                    )}
                  </div>
                </AspectRatio>
                <div className="p-3">
                  <p className="text-label-small text-primary uppercase tracking-wide mb-1">
                    {getCategoryLabel(video.category)}
                  </p>
                  <h3 className="text-title-small font-medium text-foreground line-clamp-2 mb-2">
                    {video.title}
                  </h3>
                  <div className="flex items-center gap-4 text-muted-foreground text-body-small">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3.5 w-3.5" />
                      {video.views_count.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="h-3.5 w-3.5" />
                      {video.likes_count.toLocaleString()}
                    </span>
                  </div>
                </div>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex -left-4" />
        <CarouselNext className="hidden md:flex -right-4" />
      </Carousel>
    </div>
  );
};

export default VODCarousel;
