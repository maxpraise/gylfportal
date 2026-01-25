import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  MessageSquareHeart,
  Send,
  Star,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';

interface Testimony {
  id: string;
  title: string;
  testimony: string;
  category: string | null;
  is_approved: boolean;
  is_featured: boolean;
  created_at: string;
  profile_id: string;
}

const categories = [
  { value: 'salvation', label: 'Salvation' },
  { value: 'healing', label: 'Healing' },
  { value: 'breakthrough', label: 'Breakthrough' },
  { value: 'provision', label: 'Provision' },
  { value: 'transformation', label: 'Transformation' },
  { value: 'other', label: 'Other' },
];

const ShareTestimony = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [testimonies, setTestimonies] = useState<Testimony[]>([]);
  const [myTestimonies, setMyTestimonies] = useState<Testimony[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    testimony: '',
    category: '',
  });

  useEffect(() => {
    fetchTestimonies();
  }, [profile?.id]);

  const fetchTestimonies = async () => {
    // Fetch approved testimonies
    const { data: approvedData } = await supabase
      .from('testimonies')
      .select('*')
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
      .limit(10);

    // Fetch my testimonies
    if (profile?.id) {
      const { data: myData } = await supabase
        .from('testimonies')
        .select('*')
        .eq('profile_id', profile.id)
        .order('created_at', { ascending: false });

      if (myData) setMyTestimonies(myData);
    }

    if (approvedData) setTestimonies(approvedData);
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;

    if (!formData.title.trim() || !formData.testimony.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please provide a title and your testimony.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('testimonies').insert({
        profile_id: profile.id,
        title: formData.title.trim(),
        testimony: formData.testimony.trim(),
        category: formData.category || null,
      });

      if (error) throw error;

      toast({
        title: 'Testimony Submitted!',
        description: 'Your testimony has been submitted for review.',
      });

      setFormData({ title: '', testimony: '', category: '' });
      fetchTestimonies();
    } catch (error) {
      console.error('Error submitting testimony:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit testimony. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Share Your Testimony</h1>
        <p className="text-muted-foreground mt-1">
          Inspire others by sharing what God has done in your life
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Submit Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              Share Your Story
            </CardTitle>
            <CardDescription>
              Your testimony could inspire someone today
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., My Healing Testimony"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData({ ...formData, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="testimony">Your Testimony *</Label>
                <Textarea
                  id="testimony"
                  placeholder="Share your testimony..."
                  rows={6}
                  value={formData.testimony}
                  onChange={(e) => setFormData({ ...formData, testimony: e.target.value })}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Testimony'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* My Testimonies */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquareHeart className="h-5 w-5 text-primary" />
              My Testimonies
            </CardTitle>
            <CardDescription>
              Your submitted testimonies
            </CardDescription>
          </CardHeader>
          <CardContent>
            {myTestimonies.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquareHeart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-foreground mb-2">No Testimonies Yet</h3>
                <p className="text-muted-foreground">Share your first testimony above</p>
              </div>
            ) : (
              <div className="space-y-4">
                {myTestimonies.map((t) => (
                  <div key={t.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-foreground">{t.title}</h4>
                      <div className="flex gap-1">
                        {t.is_featured && (
                          <Badge className="bg-yellow-500/10 text-yellow-600">
                            <Star className="h-3 w-3 mr-1" />
                            Featured
                          </Badge>
                        )}
                        {t.is_approved ? (
                          <Badge className="bg-green-500/10 text-green-600">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Approved
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{t.testimony}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(t.created_at).toLocaleDateString()}
                      {t.category && (
                        <>
                          <span>•</span>
                          <span className="capitalize">{t.category}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Featured Testimonies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Community Testimonies
          </CardTitle>
          <CardDescription>
            Inspiring stories from the GYLF community
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : testimonies.length === 0 ? (
            <div className="text-center py-8">
              <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-2">No Testimonies Yet</h3>
              <p className="text-muted-foreground">Be the first to share your story</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {testimonies.map((t) => (
                <div key={t.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        <MessageSquareHeart className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-foreground">{t.title}</h4>
                        {t.is_featured && (
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{t.testimony}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(t.created_at).toLocaleDateString()}
                        {t.category && (
                          <Badge variant="outline" className="text-xs">
                            {t.category}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ShareTestimony;
