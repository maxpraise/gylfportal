import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { ExternalLink } from 'lucide-react';

interface PromoBanner {
  id: string;
  title: string | null;
  image_url: string;
  external_link: string;
  order_index: number;
}

const PromoBannersCarousel = () => {
  const [banners, setBanners] = useState<PromoBanner[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBanners = async () => {
      const { data, error } = await supabase
        .from('promo_banners')
        .select('*')
        .eq('is_active', true)
        .order('order_index');

      if (data) {
        setBanners(data);
      }
      setIsLoading(false);
    };

    fetchBanners();
  }, []);

  const handleBannerClick = (link: string) => {
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <h2 className="text-title-large font-medium text-foreground">Programs/Events</h2>
        <Skeleton className="w-full h-48 rounded-xl" />
      </div>
    );
  }

  if (banners.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h2 className="text-title-large font-medium text-foreground">Programs/Events</h2>
      
      <Carousel
        opts={{
          align: 'start',
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {banners.map((banner) => (
            <CarouselItem key={banner.id} className="pl-2 md:pl-4 basis-4/5 md:basis-1/2 lg:basis-1/3">
              <Card
                className="overflow-hidden cursor-pointer group border-0 shadow-elevation-1 hover:shadow-elevation-2 transition-shadow"
                onClick={() => handleBannerClick(banner.external_link)}
              >
              <AspectRatio ratio={1600 / 654}>
                  <img
                    src={banner.image_url}
                    alt={banner.title || 'Promo banner'}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </AspectRatio>
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

export default PromoBannersCarousel;
