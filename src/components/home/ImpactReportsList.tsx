import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Calendar, ArrowRight, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  image: string;
  date: string;
  category: string;
  author?: string;
}

interface ApiPostItem {
  postID: string;
  postTitle: string;
  postDesc: string;
  postCont: string;
  postDate: string;
  postImg: string;
  post_catname?: string;
  postVideo?: string;
  postAudio?: string;
  postSlug?: string;
  likeCount?: string;
}

const ImpactReportsList = () => {
  const navigate = useNavigate();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const fetchNews = useCallback(async (currentOffset: number, append: boolean = false) => {
    try {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }

      const response = await fetch(
        `https://globalyouthleadersforum.org/webapi/api.php?limit=9&offset=${currentOffset}`
      );
      const data: ApiPostItem[] = await response.json();

      if (Array.isArray(data) && data.length > 0) {
        const mappedNews: NewsItem[] = data.map((item) => ({
          id: item.postID,
          title: item.postTitle,
          excerpt: item.postDesc || '',
          content: item.postCont || '',
          image: item.postImg,
          date: item.postDate,
          category: item.post_catname || 'News',
          author: undefined,
        }));

        if (append) {
          setNews((prev) => [...prev, ...mappedNews]);
        } else {
          setNews(mappedNews);
        }

        setHasMore(mappedNews.length === 9);
        setOffset(currentOffset + 9);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchNews(0);
  }, [fetchNews]);

  useEffect(() => {
    if (!hasMore || isLoadingMore) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          fetchNews(offset, true);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, isLoadingMore, offset, fetchNews]);

  const handleNewsClick = (item: NewsItem) => {
    navigate(`/news/${item.id}`, { state: { news: item } });
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'MMM dd, yyyy');
    } catch {
      return dateStr;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <h2 className="text-title-large font-medium text-foreground">Impact Reports</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-40 w-full" />
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-title-large font-medium text-foreground">Impact Reports</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {news.map((item) => (
          <Card
            key={item.id}
            className="overflow-hidden cursor-pointer group hover:shadow-elevation-2 transition-all"
            onClick={() => handleNewsClick(item)}
          >
            <div className="aspect-video overflow-hidden bg-surface-container-high">
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder.svg';
                }}
              />
            </div>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {item.category}
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(item.date)}
                </span>
              </div>
              <h3 className="font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                {item.title}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {item.excerpt}
              </p>
              <div className="flex items-center text-primary text-sm font-medium pt-1">
                Read More
                <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Infinite scroll trigger */}
      <div ref={loadMoreRef} className="py-4 flex justify-center">
        {isLoadingMore && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Loading more...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImpactReportsList;
