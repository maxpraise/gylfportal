import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Hls from 'hls.js';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  ArrowLeft, 
  Heart, 
  MessageSquare, 
  Share2, 
  Eye,
  Send,
  Trash2,
  Loader2
} from 'lucide-react';
import { getCategoryLabel, formatDuration } from '@/lib/vodCategories';
import { format } from 'date-fns';

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
  published_at: string;
}

interface Comment {
  id: string;
  comment: string;
  created_at: string;
  profile_id: string;
  profile?: {
    full_name: string;
    avatar_url: string | null;
  };
}

const VODDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();

  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [video, setVideo] = useState<VODVideo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  
  const [hasLiked, setHasLiked] = useState(false);
  const [localLikesCount, setLocalLikesCount] = useState(0);
  const [isLiking, setIsLiking] = useState(false);

  useEffect(() => {
    if (id) {
      fetchVideo();
      fetchComments();
      checkLikeStatus();
      recordView();
    }
  }, [id]);

  useEffect(() => {
    if (!video || !videoRef.current) return;

    const videoElement = videoRef.current;
    const videoUrl = video.video_url;

    // Check if it's an HLS stream
    if (videoUrl.includes('.m3u8')) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
        });

        hls.loadSource(videoUrl);
        hls.attachMedia(videoElement);
        hlsRef.current = hls;

        return () => {
          hls.destroy();
        };
      } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
        videoElement.src = videoUrl;
      }
    } else {
      // Regular video file
      videoElement.src = videoUrl;
    }
  }, [video]);

  const fetchVideo = async () => {
    const { data, error } = await supabase
      .from('vod_videos')
      .select('*')
      .eq('id', id)
      .single();

    if (data) {
      setVideo(data);
      setLocalLikesCount(data.likes_count);
    }
    setIsLoading(false);
  };

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from('vod_comments')
      .select(`
        *,
        profile:profiles!vod_comments_profile_id_fkey(full_name, avatar_url)
      `)
      .eq('video_id', id)
      .order('created_at', { ascending: false });

    if (data) {
      setComments(data);
    }
    setIsLoadingComments(false);
  };

  const checkLikeStatus = async () => {
    if (!profile) return;
    
    const { data } = await supabase
      .from('vod_likes')
      .select('id')
      .eq('video_id', id)
      .eq('profile_id', profile.id)
      .maybeSingle();

    setHasLiked(!!data);
  };

  const recordView = async () => {
    await supabase.from('vod_views').insert({
      video_id: id,
      profile_id: profile?.id || null,
    });
  };

  const handleLike = async () => {
    if (!profile) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to like videos.',
        variant: 'destructive',
      });
      return;
    }

    setIsLiking(true);

    if (hasLiked) {
      const { error } = await supabase
        .from('vod_likes')
        .delete()
        .eq('video_id', id)
        .eq('profile_id', profile.id);

      if (!error) {
        setHasLiked(false);
        setLocalLikesCount(prev => prev - 1);
      }
    } else {
      const { error } = await supabase.from('vod_likes').insert({
        video_id: id,
        profile_id: profile.id,
      });

      if (!error) {
        setHasLiked(true);
        setLocalLikesCount(prev => prev + 1);
      }
    }

    setIsLiking(false);
  };

  const handleSubmitComment = async () => {
    if (!profile) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to comment.',
        variant: 'destructive',
      });
      return;
    }

    if (!newComment.trim()) return;

    setIsSubmittingComment(true);

    const { data, error } = await supabase
      .from('vod_comments')
      .insert({
        video_id: id,
        profile_id: profile.id,
        comment: newComment.trim(),
      })
      .select(`
        *,
        profile:profiles!vod_comments_profile_id_fkey(full_name, avatar_url)
      `)
      .single();

    if (data) {
      setComments([data, ...comments]);
      setNewComment('');
    }

    setIsSubmittingComment(false);
  };

  const handleDeleteComment = async (commentId: string) => {
    const { error } = await supabase
      .from('vod_comments')
      .delete()
      .eq('id', commentId);

    if (!error) {
      setComments(comments.filter(c => c.id !== commentId));
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({
        title: video?.title,
        url,
      });
    } else {
      await navigator.clipboard.writeText(url);
      toast({
        title: 'Link copied',
        description: 'Video link copied to clipboard.',
      });
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = () => {
    if (!videoRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      videoRef.current.requestFullscreen();
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="space-y-4 pb-20 lg:pb-8">
        <Skeleton className="w-full aspect-video rounded-xl" />
        <Skeleton className="w-3/4 h-8" />
        <Skeleton className="w-1/2 h-6" />
      </div>
    );
  }

  if (!video) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Video not found</p>
        <Button variant="outline" onClick={() => navigate(-1)} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      {/* Video Player */}
      <Card className="overflow-hidden bg-surface-container">
        <div className="relative aspect-video bg-surface-container-highest">
          <video
            ref={videoRef}
            className="w-full h-full object-contain"
            poster={video.thumbnail_url || undefined}
            playsInline
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onClick={togglePlay}
          />

          {/* Controls Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={togglePlay}
                >
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={toggleMute}
                >
                  {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </Button>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={toggleFullscreen}
              >
                <Maximize className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Video Info */}
      <div className="space-y-4">
        <div>
          <p className="text-label-small text-primary uppercase tracking-wide mb-1">
            {getCategoryLabel(video.category)}
          </p>
          <h1 className="text-headline-small font-bold text-foreground">{video.title}</h1>
          <div className="flex items-center gap-4 text-muted-foreground text-body-medium mt-2">
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {video.views_count.toLocaleString()} views
            </span>
            <span>•</span>
            <span>{format(new Date(video.published_at), 'MMM d, yyyy')}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Button
            variant={hasLiked ? 'default' : 'outline'}
            size="sm"
            onClick={handleLike}
            disabled={isLiking}
          >
            <Heart className={`mr-2 h-4 w-4 ${hasLiked ? 'fill-current' : ''}`} />
            {localLikesCount.toLocaleString()}
          </Button>
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
        </div>

        {/* Description */}
        {video.description && (
          <Card className="p-4 bg-surface-container">
            <p className="text-body-medium text-foreground whitespace-pre-wrap">{video.description}</p>
          </Card>
        )}
      </div>

      {/* Comments Section */}
      <div className="space-y-4">
        <h2 className="text-title-large font-medium text-foreground flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Comments ({comments.length})
        </h2>

        {/* Add Comment */}
        {profile && (
          <Card className="p-4 bg-surface-container">
            <div className="flex gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={profile.avatar_url || ''} alt={profile.full_name} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getInitials(profile.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <Textarea
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={2}
                />
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={handleSubmitComment}
                    disabled={isSubmittingComment || !newComment.trim()}
                  >
                    {isSubmittingComment ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="mr-2 h-4 w-4" />
                    )}
                    Comment
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Comments List */}
        {isLoadingComments ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : comments.length === 0 ? (
          <Card className="p-8 bg-surface-container text-center">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No comments yet. Be the first to comment!</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {comments.map((comment) => (
              <Card key={comment.id} className="p-4 bg-surface-container">
                <div className="flex gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={comment.profile?.avatar_url || ''} alt={comment.profile?.full_name} />
                    <AvatarFallback className="bg-secondary text-secondary-foreground">
                      {comment.profile?.full_name ? getInitials(comment.profile.full_name) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-title-small font-medium text-foreground">
                        {comment.profile?.full_name || 'Anonymous'}
                      </p>
                      {profile?.id === comment.profile_id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteComment(comment.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <p className="text-body-small text-muted-foreground">
                      {format(new Date(comment.created_at), 'MMM d, yyyy • h:mm a')}
                    </p>
                    <p className="text-body-medium text-foreground mt-2">{comment.comment}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VODDetail;
