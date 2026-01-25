import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  FileText,
  Video,
  Image,
  Share2,
  Copy,
  Check,
  Calendar,
  Users,
  Play,
  Download,
  ExternalLink,
} from 'lucide-react';

const GYLFConnect = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const referralLink = `${window.location.origin}/auth?ref=${profile?.referral_code || ''}`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      title: 'Copied!',
      description: `${label} copied to clipboard`,
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const summitResources = [
    { id: '1', title: 'GYLF Summit 2024 Highlights', type: 'video', duration: '12 min' },
    { id: '2', title: 'Summit Planning Guide', type: 'document' },
    { id: '3', title: 'Host a Local Summit', type: 'article' },
  ];

  const publicityCards = [
    { id: '1', title: 'GYLF Ambassador Card', imageUrl: '/placeholder.svg' },
    { id: '2', title: 'Event Invitation Card', imageUrl: '/placeholder.svg' },
    { id: '3', title: 'Youth Leadership Card', imageUrl: '/placeholder.svg' },
    { id: '4', title: 'Social Media Banner', imageUrl: '/placeholder.svg' },
  ];

  const promotionVideos = [
    { id: '1', title: 'What is GYLF?', duration: '3 min', thumbnail: '/placeholder.svg' },
    { id: '2', title: 'Join the Movement', duration: '2 min', thumbnail: '/placeholder.svg' },
    { id: '3', title: 'Leadership Testimonies', duration: '5 min', thumbnail: '/placeholder.svg' },
  ];

  const trainingVideos = [
    { id: '1', title: 'Ambassador Orientation', duration: '15 min', thumbnail: '/placeholder.svg' },
    { id: '2', title: 'Effective Communication', duration: '20 min', thumbnail: '/placeholder.svg' },
    { id: '3', title: 'Building Your Network', duration: '18 min', thumbnail: '/placeholder.svg' },
    { id: '4', title: 'Event Organization', duration: '25 min', thumbnail: '/placeholder.svg' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">GYLF Connect</h1>
        <p className="text-muted-foreground mt-1">
          Resources, materials, and tools to help you connect and grow
        </p>
      </div>

      {/* Referral Code Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            Your Referral Code
          </CardTitle>
          <CardDescription>Share this code to invite new members</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 bg-background rounded-lg px-4 py-3 font-mono text-lg font-bold text-center border">
              {profile?.referral_code || 'Loading...'}
            </div>
            <Button onClick={() => copyToClipboard(profile?.referral_code || '', 'Referral code')}>
              {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
              Copy Code
            </Button>
            <Button variant="outline" onClick={() => copyToClipboard(referralLink, 'Referral link')}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Copy Link
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different resources */}
      <Tabs defaultValue="summit" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 h-auto gap-1">
          <TabsTrigger value="summit" className="text-xs sm:text-sm">Summit</TabsTrigger>
          <TabsTrigger value="publicity" className="text-xs sm:text-sm">Publicity</TabsTrigger>
          <TabsTrigger value="promo" className="text-xs sm:text-sm">Promo Videos</TabsTrigger>
          <TabsTrigger value="training" className="text-xs sm:text-sm">Training</TabsTrigger>
          <TabsTrigger value="outline" className="text-xs sm:text-sm col-span-2 lg:col-span-1">Connect Outline</TabsTrigger>
        </TabsList>

        {/* Summit Resources */}
        <TabsContent value="summit" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {summitResources.map((resource) => (
              <Card key={resource.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg">
                      {resource.type === 'video' ? (
                        <Video className="h-5 w-5 text-primary" />
                      ) : resource.type === 'document' ? (
                        <FileText className="h-5 w-5 text-primary" />
                      ) : (
                        <FileText className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {resource.type}
                    </Badge>
                  </div>
                  <CardTitle className="text-base mt-2">{resource.title}</CardTitle>
                  {resource.duration && (
                    <CardDescription>{resource.duration}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  <Button variant="outline" size="sm" className="w-full">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Publicity Cards */}
        <TabsContent value="publicity" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {publicityCards.map((card) => (
              <Card key={card.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <div className="aspect-video bg-muted flex items-center justify-center">
                  <Image className="h-12 w-12 text-muted-foreground" />
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{card.title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button variant="outline" size="sm" className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Promotion Videos */}
        <TabsContent value="promo" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {promotionVideos.map((video) => (
              <Card key={video.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <div className="aspect-video bg-muted flex items-center justify-center relative">
                  <Play className="h-12 w-12 text-muted-foreground" />
                  <Badge className="absolute bottom-2 right-2 bg-background/80 text-foreground">
                    {video.duration}
                  </Badge>
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{video.title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button variant="outline" size="sm" className="w-full">
                    <Play className="mr-2 h-4 w-4" />
                    Watch
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Training Videos */}
        <TabsContent value="training" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {trainingVideos.map((video) => (
              <Card key={video.id} className="hover:shadow-md transition-shadow">
                <div className="flex gap-4 p-4">
                  <div className="w-32 h-20 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                    <Play className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{video.title}</h3>
                    <p className="text-sm text-muted-foreground">{video.duration}</p>
                    <Button variant="link" size="sm" className="px-0 mt-1">
                      Start watching →
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Connect Outline */}
        <TabsContent value="outline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                GYLF Connect Meeting Outline
              </CardTitle>
              <CardDescription>
                Follow this structure for your local GYLF Connect meetings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4 items-start">
                  <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">1</div>
                  <div>
                    <h4 className="font-semibold">Opening Prayer & Worship (10 min)</h4>
                    <p className="text-sm text-muted-foreground">Start with prayer and 1-2 worship songs</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">2</div>
                  <div>
                    <h4 className="font-semibold">Welcome & Introductions (5 min)</h4>
                    <p className="text-sm text-muted-foreground">Welcome attendees and introduce first-timers</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">3</div>
                  <div>
                    <h4 className="font-semibold">GYLF Message/Teaching (20 min)</h4>
                    <p className="text-sm text-muted-foreground">Share leadership principles or featured content</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">4</div>
                  <div>
                    <h4 className="font-semibold">Discussion & Sharing (15 min)</h4>
                    <p className="text-sm text-muted-foreground">Open discussion and testimony sharing</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">5</div>
                  <div>
                    <h4 className="font-semibold">Announcements & Closing (10 min)</h4>
                    <p className="text-sm text-muted-foreground">Upcoming events, prayer requests, and closing prayer</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Meeting Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5" />
                  Schedule meetings consistently (weekly or bi-weekly)
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5" />
                  Create a welcoming atmosphere for new members
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5" />
                  Document attendance and submit reports
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5" />
                  Follow up with attendees during the week
                </li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GYLFConnect;
