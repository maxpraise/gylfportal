import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import DOMPurify from 'dompurify';
import {
  ArrowLeft,
  Calendar,
  Heart,
  MessageCircle,
  Share2,
  Send,
  Loader2,
  User,
} from 'lucide-react';
import { format } from 'date-fns';
import type { NewsItem } from '@/components/home/ImpactReportsList';

interface Comment {
  id: string;
  comment: string;
  created_at: string;
  profile: {
    full_name: string;
    avatar_url: string | null;
  };
}

const NewsDetail = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile } = useAuth();

  const [news, setNews] = useState<NewsItem | null>(location.state?.news || null);
  const [isLoading, setIsLoading] = useState(!location.state?.news);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [sharesCount, setSharesCount] = useState(0);

  useEffect(() => {
    if (!news && id) {
      fetchNewsDetails();
    }
    if (id) {
      fetchInteractions();
      fetchComments();
    }
  }, [id]);

  const fetchNewsDetails = async () => {
    try {
      const response = await fetch(
        `https://globalyouthleadersforum.org/webapi/api.php?id=${id}`
      );
      const data = await response.json();
      if (data.status === 'success' && data.data) {
        setNews({
          id: data.data.id,
          title: data.data.title,
          excerpt: data.data.excerpt || '',
          content: data.data.content || '',
          image: data.data.image,
          date: data.data.date,
          category: data.data.category || 'News',
          author: data.data.author,
        });
      }
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInteractions = async () => {
    if (!id || !profile) return;

    // Get likes count
    const { count: likes } = await supabase
      .from('news_interactions')
      .select('*', { count: 'exact', head: true })
      .eq('news_id', id)
      .eq('interaction_type', 'like');

    setLikesCount(likes || 0);

    // Check if current user liked
    const { data: userLike } = await supabase
      .from('news_interactions')
      .select('id')
      .eq('news_id', id)
      .eq('profile_id', profile.id)
      .eq('interaction_type', 'like')
      .maybeSingle();

    setIsLiked(!!userLike);

    // Get shares count
    const { count: shares } = await supabase
      .from('news_interactions')
      .select('*', { count: 'exact', head: true })
      .eq('news_id', id)
      .eq('interaction_type', 'share');

    setSharesCount(shares || 0);
  };

  const fetchComments = async () => {
    if (!id) return;

    const { data, error } = await supabase
      .from('news_comments')
      .select(`
        id,
        comment,
        created_at,
        profile:profiles(full_name, avatar_url)
      `)
      .eq('news_id', id)
      .order('created_at', { ascending: false });

    if (data) {
      setComments(data as unknown as Comment[]);
    }
  };

  const handleLike = async () => {
    if (!profile || !id) return;

    try {
      if (isLiked) {
        await supabase
          .from('news_interactions')
          .delete()
          .eq('news_id', id)
          .eq('profile_id', profile.id)
          .eq('interaction_type', 'like');

        setLikesCount((prev) => prev - 1);
        setIsLiked(false);
      } else {
        await supabase.from('news_interactions').insert({
          news_id: id,
          profile_id: profile.id,
          interaction_type: 'like',
        });

        setLikesCount((prev) => prev + 1);
        setIsLiked(true);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update like',
        variant: 'destructive',
      });
    }
  };

  const handleShare = async () => {
    if (!id || !news) return;

    const shareData = {
      title: news.title,
      text: news.excerpt,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: 'Link copied!',
          description: 'Share link copied to clipboard',
        });
      }

      // Record share
      if (profile) {
        await supabase.from('news_interactions').upsert({
          news_id: id,
          profile_id: profile.id,
          interaction_type: 'share',
        });
        setSharesCount((prev) => prev + 1);
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleSubmitComment = async () => {
    if (!profile || !id || !newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('news_comments').insert({
        news_id: id,
        profile_id: profile.id,
        comment: newComment.trim(),
      });

      if (error) throw error;

      setNewComment('');
      fetchComments();
      toast({
        title: 'Comment added',
        description: 'Your comment has been posted',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to post comment',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'MMMM dd, yyyy');
    } catch {
      return dateStr;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto p-4 space-y-4">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!news) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">News article not found</p>
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-outline-variant p-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>

        {/* Featured Image */}
        <div className="aspect-video w-full overflow-hidden">
          <img
            src={news.image}
            alt={news.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder.svg';
            }}
          />
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary">{news.category}</Badge>
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatDate(news.date)}
            </span>
            {news.author && (
              <span className="text-sm text-muted-foreground">
                by {news.author}
              </span>
            )}
          </div>

          <h1 className="text-headline-small font-bold text-foreground">
            {news.title}
          </h1>

          {/* Article Content */}
          <div
            className="prose prose-sm max-w-none text-foreground"
            dangerouslySetInnerHTML={{ 
              __html: DOMPurify.sanitize(news.content || news.excerpt, {
                ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'span', 'div'],
                ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'target', 'rel']
              })
            }}
          />

          {/* Interaction Bar */}
          <Card className="border-outline-variant">
            <CardContent className="p-4">
              <div className="flex items-center justify-around">
                <Button
                  variant="ghost"
                  className={`flex items-center gap-2 ${isLiked ? 'text-destructive' : ''}`}
                  onClick={handleLike}
                >
                  <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
                  <span>{likesCount}</span>
                </Button>

                <Button variant="ghost" className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  <span>{comments.length}</span>
                </Button>

                <Button
                  variant="ghost"
                  className="flex items-center gap-2"
                  onClick={handleShare}
                >
                  <Share2 className="h-5 w-5" />
                  <span>{sharesCount}</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Comments Section */}
          <div className="space-y-4">
            <h2 className="text-title-large font-medium text-foreground">
              Comments ({comments.length})
            </h2>

            {/* Add Comment */}
            {profile && (
              <Card className="border-outline-variant">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile.avatar_url || undefined} />
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <Textarea
                        placeholder="Write a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="min-h-[80px] resize-none"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      onClick={handleSubmitComment}
                      disabled={!newComment.trim() || isSubmitting}
                    >
                      {isSubmitting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="mr-2 h-4 w-4" />
                      )}
                      Post
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Comments List */}
            <div className="space-y-3">
              {comments.map((comment) => (
                <Card key={comment.id} className="border-outline-variant">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={comment.profile.avatar_url || undefined} />
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm text-foreground">
                            {comment.profile.full_name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(comment.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-foreground">{comment.comment}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {comments.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No comments yet. Be the first to comment!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsDetail;
