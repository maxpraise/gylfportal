import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Play, Eye, Heart, Search, Film, Plus } from 'lucide-react';
import { VOD_CATEGORIES, getCategoryLabel, formatDuration } from '@/lib/vodCategories';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

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
  is_published: boolean;
  published_at: string;
}

const VODVideos = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { role } = useAuth();
  const { toast } = useToast();
  
  const [videos, setVideos] = useState<VODVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category') || 'all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [newVideo, setNewVideo] = useState({
    title: '',
    description: '',
    category: '',
    video_url: '',
    thumbnail_url: '',
    duration_seconds: '',
    is_featured: false,
  });

  const isAdmin = role === 'admin';

  useEffect(() => {
    fetchVideos();
  }, [selectedCategory, isAdmin]);

  const fetchVideos = async () => {
    setIsLoading(true);
    let query = supabase
      .from('vod_videos')
      .select('*')
      .order('published_at', { ascending: false });

    if (!isAdmin) {
      query = query.eq('is_published', true);
    }

    if (selectedCategory && selectedCategory !== 'all') {
      query = query.eq('category', selectedCategory);
    }

    const { data, error } = await query;

    if (data) {
      setVideos(data);
    }
    setIsLoading(false);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    if (category === 'all') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', category);
    }
    setSearchParams(searchParams);
  };

  const filteredVideos = videos.filter(video =>
    video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    video.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddVideo = async () => {
    if (!newVideo.title || !newVideo.video_url || !newVideo.category) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase.from('vod_videos').insert({
      title: newVideo.title,
      description: newVideo.description || null,
      category: newVideo.category,
      video_url: newVideo.video_url,
      thumbnail_url: newVideo.thumbnail_url || null,
      duration_seconds: newVideo.duration_seconds ? parseInt(newVideo.duration_seconds) : null,
      is_featured: newVideo.is_featured,
      is_published: true,
    });

    setIsSubmitting(false);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to add video. Please try again.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Video Added',
      description: 'The video has been added successfully.',
    });

    setNewVideo({
      title: '',
      description: '',
      category: '',
      video_url: '',
      thumbnail_url: '',
      duration_seconds: '',
      is_featured: false,
    });
    setIsAddDialogOpen(false);
    fetchVideos();
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-2.5 rounded-xl">
            <Film className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-headline-small font-bold text-foreground">Videos on Demand</h1>
            <p className="text-body-medium text-muted-foreground">
              Browse all GYTV content
            </p>
          </div>
        </div>

        {isAdmin && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Video
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add New Video</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={newVideo.title}
                    onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
                    placeholder="Video title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newVideo.description}
                    onChange={(e) => setNewVideo({ ...newVideo, description: e.target.value })}
                    placeholder="Video description"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={newVideo.category} onValueChange={(value) => setNewVideo({ ...newVideo, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {VOD_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="video_url">Video URL *</Label>
                  <Input
                    id="video_url"
                    value={newVideo.video_url}
                    onChange={(e) => setNewVideo({ ...newVideo, video_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="thumbnail_url">Thumbnail URL</Label>
                  <Input
                    id="thumbnail_url"
                    value={newVideo.thumbnail_url}
                    onChange={(e) => setNewVideo({ ...newVideo, thumbnail_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (seconds)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={newVideo.duration_seconds}
                    onChange={(e) => setNewVideo({ ...newVideo, duration_seconds: e.target.value })}
                    placeholder="300"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_featured"
                    checked={newVideo.is_featured}
                    onChange={(e) => setNewVideo({ ...newVideo, is_featured: e.target.checked })}
                    className="rounded border-border"
                  />
                  <Label htmlFor="is_featured" className="text-body-medium cursor-pointer">
                    Mark as Featured
                  </Label>
                </div>
                <Button onClick={handleAddVideo} disabled={isSubmitting} className="w-full">
                  {isSubmitting ? 'Adding...' : 'Add Video'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search videos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Category Filter */}
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-2">
          <Badge
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            className="cursor-pointer hover:bg-primary/80"
            onClick={() => handleCategoryChange('all')}
          >
            All
          </Badge>
          {VOD_CATEGORIES.map((cat) => (
            <Badge
              key={cat.value}
              variant={selectedCategory === cat.value ? 'default' : 'outline'}
              className="cursor-pointer hover:bg-primary/80"
              onClick={() => handleCategoryChange(cat.value)}
            >
              {cat.label}
            </Badge>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Videos Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="w-full h-56 rounded-xl" />
          ))}
        </div>
      ) : filteredVideos.length === 0 ? (
        <div className="bg-surface-container-high rounded-xl p-8 text-center">
          <Film className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-body-large text-muted-foreground">No videos found</p>
          <p className="text-body-small text-muted-foreground mt-1">
            {searchQuery ? 'Try a different search term' : 'Check back soon for new content'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVideos.map((video) => (
            <Card
              key={video.id}
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
                  {isAdmin && !video.is_published && (
                    <span className="absolute top-2 right-2 bg-destructive text-destructive-foreground text-xs font-bold px-2 py-0.5 rounded">
                      DRAFT
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
          ))}
        </div>
      )}
    </div>
  );
};

export default VODVideos;
