import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  CloudSun,
  Send,
  Heart,
  CheckCircle2,
  Clock,
  Users,
  Plus,
} from 'lucide-react';

interface PrayerRequest {
  id: string;
  request: string;
  is_anonymous: boolean;
  is_answered: boolean;
  prayer_count: number;
  created_at: string;
  profile_id: string;
}

const PrayerCloud = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<PrayerRequest[]>([]);
  const [myRequests, setMyRequests] = useState<PrayerRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newRequest, setNewRequest] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchPrayerRequests();
  }, [profile?.id]);

  const fetchPrayerRequests = async () => {
    if (!profile?.id) return;

    // Fetch community requests (non-anonymous)
    const { data: communityData } = await supabase
      .from('prayer_requests')
      .select('*')
      .eq('is_anonymous', false)
      .order('created_at', { ascending: false })
      .limit(20);

    // Fetch my requests
    const { data: myData } = await supabase
      .from('prayer_requests')
      .select('*')
      .eq('profile_id', profile.id)
      .order('created_at', { ascending: false });

    if (communityData) setRequests(communityData);
    if (myData) setMyRequests(myData);
    setIsLoading(false);
  };

  const handleSubmit = async () => {
    if (!profile?.id || !newRequest.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter your prayer request.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('prayer_requests').insert({
        profile_id: profile.id,
        request: newRequest.trim(),
        is_anonymous: isAnonymous,
      });

      if (error) throw error;

      toast({
        title: 'Prayer Request Submitted',
        description: 'Your prayer request has been shared with the community.',
      });

      setNewRequest('');
      setIsAnonymous(false);
      setShowForm(false);
      fetchPrayerRequests();
    } catch (error) {
      console.error('Error submitting prayer request:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit prayer request. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
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

  const totalPrayers = requests.reduce((sum, r) => sum + r.prayer_count, 0);
  const answeredCount = [...requests, ...myRequests].filter((r) => r.is_answered).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Prayer Cloud</h1>
          <p className="text-muted-foreground mt-1">
            Share prayer requests and pray for one another
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          New Prayer Request
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <CloudSun className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{requests.length + myRequests.length}</p>
                <p className="text-xs text-muted-foreground">Total Requests</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="bg-purple-500/10 p-2 rounded-lg">
                <Heart className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalPrayers}</p>
                <p className="text-xs text-muted-foreground">Prayers Offered</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-500/10 p-2 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{answeredCount}</p>
                <p className="text-xs text-muted-foreground">Answered</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500/10 p-2 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{myRequests.length}</p>
                <p className="text-xs text-muted-foreground">My Requests</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* New Request Form */}
      {showForm && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              Submit Prayer Request
            </CardTitle>
            <CardDescription>
              Share your prayer request with the GYLF community
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="request">Your Prayer Request</Label>
              <Textarea
                id="request"
                placeholder="Share what you'd like the community to pray about..."
                rows={4}
                value={newRequest}
                onChange={(e) => setNewRequest(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="anonymous"
                checked={isAnonymous}
                onCheckedChange={setIsAnonymous}
              />
              <Label htmlFor="anonymous">Submit anonymously</Label>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Community Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Community Requests
            </CardTitle>
            <CardDescription>
              Pray for others in the community
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : requests.length === 0 ? (
              <div className="text-center py-8">
                <CloudSun className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-foreground mb-2">No Requests Yet</h3>
                <p className="text-muted-foreground">Be the first to share a prayer request</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <div key={request.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          <Heart className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm text-foreground">{request.request}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(request.created_at).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="h-3 w-3" />
                            {request.prayer_count} prayers
                          </span>
                          {request.is_answered && (
                            <Badge className="bg-green-500/10 text-green-600">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Answered
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="mt-2">
                      <Heart className="mr-2 h-4 w-4" />
                      Praying
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* My Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CloudSun className="h-5 w-5 text-primary" />
              My Requests
            </CardTitle>
            <CardDescription>
              Track your prayer requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            {myRequests.length === 0 ? (
              <div className="text-center py-8">
                <Send className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-foreground mb-2">No Requests Yet</h3>
                <p className="text-muted-foreground">Submit a prayer request to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {myRequests.map((request) => (
                  <div key={request.id} className="p-4 border rounded-lg">
                    <p className="text-sm text-foreground">{request.request}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(request.created_at).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        {request.prayer_count} prayers
                      </span>
                      {request.is_anonymous && (
                        <Badge variant="secondary">Anonymous</Badge>
                      )}
                      {request.is_answered && (
                        <Badge className="bg-green-500/10 text-green-600">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Answered
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PrayerCloud;
