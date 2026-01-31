import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { Play, Clock, BookOpen, ArrowRight } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string | null;
  category: string;
  duration_hours: number | null;
  thumbnail_url: string | null;
}

const AcademyCoursesCarousel = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      const { data, error } = await supabase
        .from('academy_courses')
        .select('id, title, description, category, duration_hours, thumbnail_url')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(6);

      if (data) {
        setCourses(data);
      }
      setIsLoading(false);
    };

    fetchCourses();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-title-large font-medium text-foreground">From The Academy</h2>
        </div>
        <div className="flex gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="w-64 h-48 rounded-xl flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  // Show placeholder courses if none exist
  const displayCourses = courses.length > 0 ? courses : [
    { id: '1', title: 'GYLF Leadership Fundamentals', description: 'Learn the core principles of leadership', category: 'Leadership', duration_hours: 2, thumbnail_url: null },
    { id: '2', title: 'Effective Communication', description: 'Master the art of communication', category: 'Skills', duration_hours: 1.5, thumbnail_url: null },
    { id: '3', title: 'Building Your Network', description: 'Grow your influence and connections', category: 'Growth', duration_hours: 1, thumbnail_url: null },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-title-large font-medium text-foreground">From The Academy</h2>
        <Button
          variant="ghost"
          size="sm"
          className="text-primary"
          onClick={() => navigate('/dashboard/academy')}
        >
          View All
          <ArrowRight className="ml-1 h-4 w-4" />
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
          {displayCourses.map((course) => (
            <CarouselItem key={course.id} className="pl-2 md:pl-4 basis-4/5 md:basis-1/2 lg:basis-1/3">
              <Card className="overflow-hidden hover:shadow-elevation-2 transition-shadow h-full">
                <div className="aspect-video bg-surface-container-high flex items-center justify-center">
                  {course.thumbnail_url ? (
                    <img
                      src={course.thumbnail_url}
                      alt={course.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <BookOpen className="h-10 w-10" />
                    </div>
                  )}
                </div>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs">
                      {course.category}
                    </Badge>
                    {course.duration_hours && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {course.duration_hours}h
                      </span>
                    )}
                  </div>
                  <CardTitle className="text-base line-clamp-1">{course.title}</CardTitle>
                  {course.description && (
                    <CardDescription className="line-clamp-2 text-xs">
                      {course.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  <Button
                    variant="tonal"
                    size="sm"
                    className="w-full"
                    onClick={() => navigate('/dashboard/academy')}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Watch Now
                  </Button>
                </CardContent>
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

export default AcademyCoursesCarousel;
